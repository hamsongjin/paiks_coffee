import Link from "next/link";

import { ProductImage } from "@/components/admin/product-image";
import { createClient } from "@/lib/supabase/server";
import type {
  AdminProductDetail,
  AdminProductOptionGroup,
  AdminProductOptionItem,
  GoodsOptionGroupRow,
  GoodsOptionRow,
} from "@/types/admin-products";

const goodsSelectColumns =
  "goods_no, cate_cd, goods_nm, goods_en_nm, goods_price, ice_fl, best_fl, new_fl, soldout_fl, del_fl, created_at, updated_at";

const optionSelectColumns =
  "opt_no, opt_nm, opt_en_nm, opt_price, opt_type, opt_max_cnt, soldout_fl, created_at, updated_at";

type AdminProductDetailPageProps = {
  params: Promise<{
    goodsNo: string;
  }>;
};

function formatPrice(price: number | string) {
  return Number(price).toLocaleString("ko-KR");
}

function formatFlag(value: string | null) {
  return value ?? "-";
}

function ProductErrorState({ message }: { message: string }) {
  return (
    <section className="rounded-lg border border-red-200 bg-red-50 p-5">
      <h2 className="text-base font-semibold text-red-950">상품 상세 조회 실패</h2>
      <p className="mt-2 text-sm text-red-800">원인: {message}</p>
      <p className="mt-2 text-sm text-red-800">
        해결 방법: `goods`, `options_group`, `options` 테이블의 RLS 조회 정책과 Data API 노출
        설정을 확인하세요.
      </p>
    </section>
  );
}

function EmptyState({ goodsNo }: { goodsNo: number }) {
  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-6">
      <h2 className="text-base font-semibold text-neutral-950">상품을 찾을 수 없습니다</h2>
      <p className="mt-2 text-sm text-neutral-500">
        `goods_no` {goodsNo}에 해당하는 상품이 없습니다.
      </p>
    </section>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid gap-1 border-b border-neutral-100 py-3 last:border-b-0 sm:grid-cols-3">
      <dt className="text-xs font-semibold uppercase text-neutral-500">{label}</dt>
      <dd className="text-sm text-neutral-950 sm:col-span-2">{value}</dd>
    </div>
  );
}

function getOptionTypeLabel(option: GoodsOptionRow | null) {
  return option?.opt_type || "unclassified";
}

function groupOptionsByType(optionItems: AdminProductOptionItem[]) {
  const groupMap = new Map<string, AdminProductOptionItem[]>();

  optionItems.forEach((item) => {
    const optType = getOptionTypeLabel(item.option);
    const items = groupMap.get(optType) ?? [];
    items.push(item);
    groupMap.set(optType, items);
  });

  return Array.from(groupMap.entries()).map(
    ([opt_type, items]): AdminProductOptionGroup => ({
      opt_type,
      items,
    }),
  );
}

export default async function AdminProductDetailPage({ params }: AdminProductDetailPageProps) {
  const { goodsNo: goodsNoParam } = await params;
  const goodsNo = Number(goodsNoParam);

  if (!Number.isInteger(goodsNo)) {
    return (
      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10">
        <Link href="/admin/products" className="text-sm text-neutral-500 hover:text-neutral-950">
          Back to products
        </Link>
        <ProductErrorState message="goodsNo route parameter must be an integer." />
      </main>
    );
  }

  const supabase = await createClient();

  const goodsResult = await supabase
    .from("goods")
    .select(goodsSelectColumns)
    .eq("goods_no", goodsNo)
    .maybeSingle();

  if (goodsResult.error) {
    return (
      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10">
        <Link href="/admin/products" className="text-sm text-neutral-500 hover:text-neutral-950">
          Back to products
        </Link>
        <ProductErrorState message={goodsResult.error.message} />
      </main>
    );
  }

  const product = goodsResult.data as AdminProductDetail | null;

  if (!product) {
    return (
      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10">
        <Link href="/admin/products" className="text-sm text-neutral-500 hover:text-neutral-950">
          Back to products
        </Link>
        <EmptyState goodsNo={goodsNo} />
      </main>
    );
  }

  const groupResult = await supabase
    .from("options_group")
    .select("seq, goods_no, opt_no")
    .eq("goods_no", goodsNo)
    .order("seq", { ascending: true });

  if (groupResult.error) {
    return (
      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10">
        <Link href="/admin/products" className="text-sm text-neutral-500 hover:text-neutral-950">
          Back to products
        </Link>
        <ProductErrorState message={groupResult.error.message} />
      </main>
    );
  }

  const optionGroups = (groupResult.data ?? []) as Pick<
    GoodsOptionGroupRow,
    "seq" | "goods_no" | "opt_no"
  >[];
  const optionNos = [...new Set(optionGroups.map((group) => group.opt_no))];

  const optionsResult =
    optionNos.length > 0
      ? await supabase.from("options").select(optionSelectColumns).in("opt_no", optionNos)
      : { data: [] as GoodsOptionRow[], error: null };

  if (optionsResult.error) {
    return (
      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10">
        <Link href="/admin/products" className="text-sm text-neutral-500 hover:text-neutral-950">
          Back to products
        </Link>
        <ProductErrorState message={optionsResult.error.message} />
      </main>
    );
  }

  const optionsByNo = new Map(
    ((optionsResult.data ?? []) as GoodsOptionRow[]).map((option) => [option.opt_no, option]),
  );
  const mappingCountByOptNo = optionGroups.reduce((countMap, group) => {
    countMap.set(group.opt_no, (countMap.get(group.opt_no) ?? 0) + 1);
    return countMap;
  }, new Map<number, number>());
  const optionItems: AdminProductOptionItem[] = optionGroups.map((group) => ({
    ...group,
    option: optionsByNo.get(group.opt_no) ?? null,
    is_duplicate_mapping: (mappingCountByOptNo.get(group.opt_no) ?? 0) > 1,
  }));
  const groupedOptionItems = groupOptionsByType(optionItems);
  const duplicateMappings = optionItems.filter((item) => item.is_duplicate_mapping);

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10">
      <Link href="/admin/products" className="text-sm text-neutral-500 hover:text-neutral-950">
        Back to products
      </Link>

      <header>
        <p className="text-sm font-medium text-neutral-500">상품 상세</p>
        <h1 className="mt-2 text-2xl font-semibold text-neutral-950">{product.goods_nm}</h1>
        <p className="mt-2 font-mono text-sm text-neutral-500">goods_no: {product.goods_no}</p>
      </header>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(420px,1.3fr)]">
        <div className="flex flex-col gap-6">
          <div className="rounded-lg border border-neutral-200 bg-white p-5">
            <h2 className="text-base font-semibold text-neutral-950">image</h2>
            <div className="mt-4">
              <ProductImage goods_no={product.goods_no} alt={product.goods_nm} size="detail" />
            </div>
          </div>

          <div className="rounded-lg border border-neutral-200 bg-white p-5">
            <h2 className="text-base font-semibold text-neutral-950">goods</h2>
            <dl className="mt-3">
              <DetailRow label="goods_no" value={product.goods_no} />
              <DetailRow label="goods_nm" value={product.goods_nm} />
              <DetailRow label="goods_en_nm" value={product.goods_en_nm || "-"} />
              <DetailRow label="goods_price" value={`${formatPrice(product.goods_price)}원`} />
              <DetailRow label="cate_cd" value={product.cate_cd} />
              <DetailRow label="ice_fl" value={formatFlag(product.ice_fl)} />
              <DetailRow label="best_fl" value={formatFlag(product.best_fl)} />
              <DetailRow label="new_fl" value={formatFlag(product.new_fl)} />
              <DetailRow label="soldout_fl" value={formatFlag(product.soldout_fl)} />
              <DetailRow label="del_fl" value={formatFlag(product.del_fl)} />
              <DetailRow label="created_at" value={product.created_at ?? "-"} />
              <DetailRow label="updated_at" value={product.updated_at ?? "-"} />
            </dl>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
          <div className="border-b border-neutral-200 px-5 py-4">
            <h2 className="text-base font-semibold text-neutral-950">options_group / options</h2>
            <p className="mt-1 text-sm text-neutral-500">
              총 {optionItems.length}개 연결, {groupedOptionItems.length}개 opt_type
            </p>
          </div>

          {optionItems.length === 0 ? (
            <div className="px-5 py-10 text-sm text-neutral-500">
              이 상품에 연결된 옵션이 없습니다.
            </div>
          ) : (
            <div className="divide-y divide-neutral-200">
              {duplicateMappings.length > 0 ? (
                <div className="bg-amber-50 px-5 py-4 text-sm text-amber-900">
                  현재 상품에 중복 options_group 매핑이 있습니다:{" "}
                  {duplicateMappings.map((item) => `opt_no ${item.opt_no} / seq ${item.seq}`).join(", ")}
                </div>
              ) : (
                <div className="bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
                  현재 상품에는 중복 options_group 매핑이 없습니다.
                </div>
              )}

              {groupedOptionItems.map((group) => (
                <section key={group.opt_type}>
                  <div className="bg-neutral-50 px-5 py-3">
                    <h3 className="text-sm font-semibold text-neutral-950">{group.opt_type}</h3>
                    <p className="mt-1 text-xs text-neutral-500">{group.items.length}개 옵션</p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-neutral-200 text-sm">
                      <thead className="text-left text-xs font-semibold uppercase text-neutral-500">
                        <tr>
                          <th className="px-5 py-3">seq</th>
                          <th className="px-5 py-3">opt_no</th>
                          <th className="px-5 py-3">opt_nm</th>
                          <th className="px-5 py-3">opt_price</th>
                          <th className="px-5 py-3">opt_max_cnt</th>
                          <th className="px-5 py-3">soldout_fl</th>
                          <th className="px-5 py-3">mapping</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100">
                        {group.items.map((item) => (
                          <tr key={item.seq} className="text-neutral-800">
                            <td className="whitespace-nowrap px-5 py-4 font-mono text-xs text-neutral-600">
                              {item.seq}
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
                                className={
                                  item.is_duplicate_mapping
                                    ? "rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800"
                                    : "rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-600"
                                }
                              >
                                {item.is_duplicate_mapping ? "duplicate" : "unique"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
