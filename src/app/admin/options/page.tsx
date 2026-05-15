import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type GoodsRow = Database["public"]["Tables"]["goods"]["Row"];
type OptionsGroupRow = Database["public"]["Tables"]["options_group"]["Row"];
type OptionRow = Database["public"]["Tables"]["options"]["Row"];

type GoodsSummary = Pick<
  GoodsRow,
  "goods_no" | "goods_nm" | "goods_en_nm" | "soldout_fl" | "del_fl"
>;

type OptionSummary = Pick<
  OptionRow,
  "opt_no" | "opt_nm" | "opt_en_nm" | "opt_type" | "opt_price" | "opt_max_cnt" | "soldout_fl"
>;

type OptionsGroupMapping = Pick<OptionsGroupRow, "seq" | "goods_no" | "opt_no" | "created_at"> & {
  option: OptionSummary | null;
  is_duplicate_mapping: boolean;
};

type OptionTypeGroup = {
  opt_type: string;
  items: OptionsGroupMapping[];
};

type ProductOptionGroup = {
  goods_no: number;
  goods: GoodsSummary | null;
  mapping_count: number;
  unique_option_count: number;
  duplicate_mapping_count: number;
  option_type_groups: OptionTypeGroup[];
};

const goodsSelectColumns = "goods_no, goods_nm, goods_en_nm, soldout_fl, del_fl";

const optionSelectColumns =
  "opt_no, opt_nm, opt_en_nm, opt_type, opt_price, opt_max_cnt, soldout_fl";

function formatPrice(price: number | string) {
  return Number(price).toLocaleString("ko-KR");
}

function getOptionStatus(option: OptionSummary | null) {
  if (!option) {
    return {
      label: "missing_options_row",
      className: "bg-red-50 text-red-700",
    };
  }

  if (option.soldout_fl === "y") {
    return {
      label: "sold_out",
      className: "bg-red-50 text-red-700",
    };
  }

  return {
    label: "available",
    className: "bg-emerald-50 text-emerald-700",
  };
}

function getGoodsStatus(goods: GoodsSummary | null) {
  if (!goods) {
    return "missing_goods_row";
  }

  if (goods.del_fl === "y") {
    return "hidden";
  }

  if (goods.soldout_fl === "y") {
    return "sold_out";
  }

  return "visible";
}

function getOptionTypeLabel(option: OptionSummary | null) {
  return option?.opt_type || "missing_or_unclassified";
}

function groupByOptionType(items: OptionsGroupMapping[]) {
  const typeMap = new Map<string, OptionsGroupMapping[]>();

  items.forEach((item) => {
    const opt_type = getOptionTypeLabel(item.option);
    const typeItems = typeMap.get(opt_type) ?? [];
    typeItems.push(item);
    typeMap.set(opt_type, typeItems);
  });

  return Array.from(typeMap.entries()).map(
    ([opt_type, typeItems]): OptionTypeGroup => ({
      opt_type,
      items: typeItems,
    }),
  );
}

function buildProductOptionGroups(
  optionsGroups: Pick<OptionsGroupRow, "seq" | "goods_no" | "opt_no" | "created_at">[],
  goodsByNo: Map<number, GoodsSummary>,
  optionsByNo: Map<number, OptionSummary>,
) {
  const pairCountMap = optionsGroups.reduce((countMap, group) => {
    const key = `${group.goods_no}:${group.opt_no}`;
    countMap.set(key, (countMap.get(key) ?? 0) + 1);
    return countMap;
  }, new Map<string, number>());
  const groupsByGoodsNo = new Map<number, OptionsGroupMapping[]>();

  optionsGroups.forEach((group) => {
    const key = `${group.goods_no}:${group.opt_no}`;
    const items = groupsByGoodsNo.get(group.goods_no) ?? [];

    items.push({
      ...group,
      option: optionsByNo.get(group.opt_no) ?? null,
      is_duplicate_mapping: (pairCountMap.get(key) ?? 0) > 1,
    });

    groupsByGoodsNo.set(group.goods_no, items);
  });

  return Array.from(groupsByGoodsNo.entries()).map(
    ([goods_no, items]): ProductOptionGroup => {
      const uniqueOptionNos = new Set(items.map((item) => item.opt_no));

      return {
        goods_no,
        goods: goodsByNo.get(goods_no) ?? null,
        mapping_count: items.length,
        unique_option_count: uniqueOptionNos.size,
        duplicate_mapping_count: items.filter((item) => item.is_duplicate_mapping).length,
        option_type_groups: groupByOptionType(items),
      };
    },
  );
}

function countDuplicatePairs(
  optionsGroups: Pick<OptionsGroupRow, "goods_no" | "opt_no">[],
) {
  const pairCountMap = optionsGroups.reduce((countMap, group) => {
    const key = `${group.goods_no}:${group.opt_no}`;
    countMap.set(key, (countMap.get(key) ?? 0) + 1);
    return countMap;
  }, new Map<string, number>());

  return Array.from(pairCountMap.values()).filter((count) => count > 1).length;
}

function OptionsErrorState({ message }: { message: string }) {
  return (
    <section className="rounded-lg border border-red-200 bg-red-50 p-5">
      <h2 className="text-base font-semibold text-red-950">옵션 구조 조회 실패</h2>
      <p className="mt-2 text-sm text-red-800">원인: {message}</p>
      <p className="mt-2 text-sm text-red-800">
        해결 방법: `options_group`, `options`, `goods` 테이블의 RLS 조회 정책과 Data API 노출
        설정을 확인하세요.
      </p>
    </section>
  );
}

function SummaryBox({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4">
      <dt className="text-xs font-semibold uppercase text-neutral-500">{label}</dt>
      <dd className="mt-2 text-2xl font-semibold text-neutral-950">{value}</dd>
    </div>
  );
}

function MappingBadge({ isDuplicate }: { isDuplicate: boolean }) {
  return (
    <span
      className={
        isDuplicate
          ? "rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800"
          : "rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-600"
      }
    >
      {isDuplicate ? "duplicate" : "unique"}
    </span>
  );
}

export default async function AdminOptionsPage() {
  const supabase = await createClient();

  const optionsGroupResult = await supabase
    .from("options_group")
    .select("seq, goods_no, opt_no, created_at")
    .order("goods_no", { ascending: true })
    .order("seq", { ascending: true });

  if (optionsGroupResult.error) {
    return (
      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10">
        <OptionsErrorState message={optionsGroupResult.error.message} />
      </main>
    );
  }

  const optionsGroups = (optionsGroupResult.data ?? []) as Pick<
    OptionsGroupRow,
    "seq" | "goods_no" | "opt_no" | "created_at"
  >[];
  const goodsNos = [...new Set(optionsGroups.map((group) => group.goods_no))];
  const optionNos = [...new Set(optionsGroups.map((group) => group.opt_no))];

  const goodsResult =
    goodsNos.length > 0
      ? await supabase.from("goods").select(goodsSelectColumns).in("goods_no", goodsNos)
      : { data: [] as GoodsSummary[], error: null };

  if (goodsResult.error) {
    return (
      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10">
        <OptionsErrorState message={goodsResult.error.message} />
      </main>
    );
  }

  const optionsResult =
    optionNos.length > 0
      ? await supabase.from("options").select(optionSelectColumns).in("opt_no", optionNos)
      : { data: [] as OptionSummary[], error: null };

  if (optionsResult.error) {
    return (
      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10">
        <OptionsErrorState message={optionsResult.error.message} />
      </main>
    );
  }

  const goodsByNo = new Map(
    ((goodsResult.data ?? []) as GoodsSummary[]).map((goods) => [goods.goods_no, goods]),
  );
  const optionsByNo = new Map(
    ((optionsResult.data ?? []) as OptionSummary[]).map((option) => [option.opt_no, option]),
  );
  const productOptionGroups = buildProductOptionGroups(optionsGroups, goodsByNo, optionsByNo);
  const duplicateMappings = productOptionGroups.flatMap((group) =>
    group.option_type_groups.flatMap((typeGroup) =>
      typeGroup.items.filter((item) => item.is_duplicate_mapping),
    ),
  );
  const duplicatePairCount = countDuplicatePairs(optionsGroups);
  const missingOptionsCount = productOptionGroups.reduce(
    (count, group) =>
      count +
      group.option_type_groups.reduce(
        (typeCount, typeGroup) =>
          typeCount + typeGroup.items.filter((item) => !item.option).length,
        0,
      ),
    0,
  );
  const missingGoodsCount = productOptionGroups.filter((group) => !group.goods).length;

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10">
      <header>
        <p className="text-sm font-medium text-neutral-500">옵션 구조 조회</p>
        <h1 className="mt-2 text-2xl font-semibold text-neutral-950">Options</h1>
        <p className="mt-2 max-w-3xl text-sm text-neutral-500">
          `options_group` 매핑을 기준으로 상품별 연결 옵션을 조회합니다. 등록, 수정, 삭제는
          포함하지 않은 읽기 전용 화면입니다.
        </p>
      </header>

      <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryBox label="options_group rows" value={optionsGroups.length} />
        <SummaryBox label="goods groups" value={productOptionGroups.length} />
        <SummaryBox label="unique opt_no" value={optionNos.length} />
        <SummaryBox label="duplicate pairs" value={duplicatePairCount} />
      </dl>

      <section className="rounded-lg border border-neutral-200 bg-white p-5">
        <h2 className="text-base font-semibold text-neutral-950">구조 점검</h2>
        <div className="mt-3 grid gap-3 text-sm text-neutral-700 lg:grid-cols-3">
          <div>
            <p className="font-medium text-neutral-950">중복 연결</p>
            <p className="mt-1">
              `(goods_no, opt_no)` 중복 pair:{" "}
              <span className="font-semibold text-neutral-950">{duplicatePairCount}</span>
            </p>
            <p className="mt-1 text-xs text-neutral-500">
              중복 pair에 포함된 options_group row: {duplicateMappings.length}
            </p>
          </div>
          <div>
            <p className="font-medium text-neutral-950">누락된 options</p>
            <p className="mt-1">
              `options_group.opt_no`가 `options.opt_no`와 매칭되지 않는 row:{" "}
              <span className="font-semibold text-neutral-950">{missingOptionsCount}</span>
            </p>
          </div>
          <div>
            <p className="font-medium text-neutral-950">누락된 goods</p>
            <p className="mt-1">
              `options_group.goods_no`가 `goods.goods_no`와 매칭되지 않는 그룹:{" "}
              <span className="font-semibold text-neutral-950">{missingGoodsCount}</span>
            </p>
          </div>
        </div>
        <p className="mt-4 text-sm text-neutral-500">
          현재 구조의 핵심 위험은 `options_group`에 `(goods_no, opt_no)` 유니크 제약이 없어 같은
          상품-옵션 연결이 중복 저장될 수 있다는 점입니다. CRUD 구현 전 중복 정리와 유니크 제약
          추가를 검토하는 것이 좋습니다.
        </p>
      </section>

      {productOptionGroups.length === 0 ? (
        <section className="rounded-lg border border-neutral-200 bg-white px-5 py-10 text-sm text-neutral-500">
          조회된 `options_group` row가 없습니다.
        </section>
      ) : (
        <div className="flex flex-col gap-5">
          {productOptionGroups.map((group) => (
            <section
              key={group.goods_no}
              className="overflow-hidden rounded-lg border border-neutral-200 bg-white"
            >
              <div className="border-b border-neutral-200 px-5 py-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="font-mono text-xs text-neutral-500">goods_no: {group.goods_no}</p>
                    <h2 className="mt-1 text-base font-semibold text-neutral-950">
                      {group.goods ? (
                        <Link
                          href={`/admin/products/${group.goods_no}`}
                          className="underline-offset-4 hover:underline"
                        >
                          {group.goods.goods_nm}
                        </Link>
                      ) : (
                        "연결된 goods 행 없음"
                      )}
                    </h2>
                    <p className="mt-1 text-sm text-neutral-500">
                      {group.goods?.goods_en_nm || "-"} / product_status:{" "}
                      {getGoodsStatus(group.goods)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs font-medium">
                    <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-neutral-700">
                      mapping rows {group.mapping_count}
                    </span>
                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-blue-700">
                      unique options {group.unique_option_count}
                    </span>
                    <span
                      className={
                        group.duplicate_mapping_count > 0
                          ? "rounded-full bg-amber-100 px-2.5 py-1 text-amber-800"
                          : "rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700"
                      }
                    >
                      duplicates {group.duplicate_mapping_count}
                    </span>
                  </div>
                </div>
              </div>

              <div className="divide-y divide-neutral-200">
                {group.option_type_groups.map((typeGroup) => (
                  <section key={`${group.goods_no}:${typeGroup.opt_type}`}>
                    <div className="bg-neutral-50 px-5 py-3">
                      <h3 className="text-sm font-semibold text-neutral-950">
                        opt_type: {typeGroup.opt_type}
                      </h3>
                      <p className="mt-1 text-xs text-neutral-500">
                        {typeGroup.items.length}개 options_group row
                      </p>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-neutral-200 text-sm">
                        <thead className="text-left text-xs font-semibold uppercase text-neutral-500">
                          <tr>
                            <th className="px-5 py-3">seq</th>
                            <th className="px-5 py-3">goods_no</th>
                            <th className="px-5 py-3">opt_no</th>
                            <th className="px-5 py-3">opt_nm</th>
                            <th className="px-5 py-3">opt_type</th>
                            <th className="px-5 py-3">opt_price</th>
                            <th className="px-5 py-3">opt_max_cnt</th>
                            <th className="px-5 py-3">soldout_fl</th>
                            <th className="px-5 py-3">option_status</th>
                            <th className="px-5 py-3">mapping</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                          {typeGroup.items.map((item) => {
                            const status = getOptionStatus(item.option);

                            return (
                              <tr key={item.seq} className="text-neutral-800">
                                <td className="whitespace-nowrap px-5 py-4 font-mono text-xs text-neutral-600">
                                  {item.seq}
                                </td>
                                <td className="whitespace-nowrap px-5 py-4 font-mono text-xs text-neutral-600">
                                  {item.goods_no}
                                </td>
                                <td className="whitespace-nowrap px-5 py-4 font-mono text-xs text-neutral-600">
                                  {item.opt_no}
                                </td>
                                <td className="whitespace-nowrap px-5 py-4">
                                  <div className="font-medium text-neutral-950">
                                    {item.option?.opt_nm ?? "연결된 options 행 없음"}
                                  </div>
                                  <div className="mt-1 text-xs text-neutral-500">
                                    {item.option?.opt_en_nm || "-"}
                                  </div>
                                </td>
                                <td className="whitespace-nowrap px-5 py-4">
                                  {item.option?.opt_type ?? "-"}
                                </td>
                                <td className="whitespace-nowrap px-5 py-4">
                                  {item.option ? `${formatPrice(item.option.opt_price)}원` : "-"}
                                </td>
                                <td className="whitespace-nowrap px-5 py-4">
                                  {item.option?.opt_max_cnt ?? "-"}
                                </td>
                                <td className="whitespace-nowrap px-5 py-4">
                                  {item.option?.soldout_fl ?? "-"}
                                </td>
                                <td className="whitespace-nowrap px-5 py-4">
                                  <span
                                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${status.className}`}
                                  >
                                    {status.label}
                                  </span>
                                </td>
                                <td className="whitespace-nowrap px-5 py-4">
                                  <MappingBadge isDuplicate={item.is_duplicate_mapping} />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </section>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
