import Link from "next/link";

import { CartSummaryBar } from "@/components/menu/cart-summary-bar";
import { ProductOptionSelector } from "@/components/menu/product-option-selector";
import { ProductImage } from "@/components/product-image";
import { createClient } from "@/lib/supabase/server";
import type { MenuOption, MenuOptionGroup, MenuOptionGroupRow, MenuProduct } from "@/types/menu";

const productSelectColumns =
  "goods_no, cate_cd, goods_nm, goods_en_nm, goods_price, ice_fl, best_fl, new_fl, soldout_fl";

const optionSelectColumns =
  "opt_no, opt_nm, opt_en_nm, opt_price, opt_type, opt_max_cnt, soldout_fl";

type MenuProductDetailPageProps = {
  params: Promise<{
    goodsNo: string;
  }>;
};

function formatPrice(price: number | string) {
  return Number(price).toLocaleString("ko-KR");
}

function groupOptions(options: MenuOption[]) {
  const groupMap = new Map<string, MenuOption[]>();

  options.forEach((option) => {
    const groupName = option.opt_type || "option";
    const items = groupMap.get(groupName) ?? [];
    items.push(option);
    groupMap.set(groupName, items);
  });

  return Array.from(groupMap.entries()).map(
    ([opt_type, items]): MenuOptionGroup => ({
      opt_type,
      options: items,
    }),
  );
}

function MenuDetailErrorState({ message }: { message: string }) {
  return (
    <section className="rounded-md border border-red-200 bg-red-50 p-4">
      <h2 className="text-sm font-semibold text-red-950">상품 정보를 불러오지 못했습니다</h2>
      <p className="mt-2 text-sm text-red-800">{message}</p>
    </section>
  );
}

function EmptyProductState({ goodsNo }: { goodsNo: number }) {
  return (
    <section className="rounded-md border border-neutral-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-neutral-950">상품을 찾을 수 없습니다</h2>
      <p className="mt-2 text-sm text-neutral-500">
        `goods_no` {goodsNo} 상품이 없거나 현재 노출 상태가 아닙니다.
      </p>
    </section>
  );
}

export default async function MenuProductDetailPage({ params }: MenuProductDetailPageProps) {
  const { goodsNo: goodsNoParam } = await params;
  const goodsNo = Number(goodsNoParam);

  if (!Number.isInteger(goodsNo)) {
    return (
      <main className="min-h-screen bg-neutral-50">
        <div className="mx-auto min-h-screen max-w-md bg-white px-4 py-5">
          <Link href="/menu" className="text-sm font-medium text-neutral-500">
            메뉴로 돌아가기
          </Link>
          <div className="mt-5">
            <MenuDetailErrorState message="goodsNo route parameter must be an integer." />
          </div>
        </div>
      </main>
    );
  }

  const supabase = await createClient();
  const productResult = await supabase
    .from("goods")
    .select(productSelectColumns)
    .eq("goods_no", goodsNo)
    .eq("del_fl", "n")
    .maybeSingle();

  if (productResult.error) {
    return (
      <main className="min-h-screen bg-neutral-50">
        <div className="mx-auto min-h-screen max-w-md bg-white px-4 py-5">
          <Link href="/menu" className="text-sm font-medium text-neutral-500">
            메뉴로 돌아가기
          </Link>
          <div className="mt-5">
            <MenuDetailErrorState message={productResult.error.message} />
          </div>
        </div>
      </main>
    );
  }

  const product = productResult.data as MenuProduct | null;

  if (!product) {
    return (
      <main className="min-h-screen bg-neutral-50">
        <div className="mx-auto min-h-screen max-w-md bg-white px-4 py-5">
          <Link href="/menu" className="text-sm font-medium text-neutral-500">
            메뉴로 돌아가기
          </Link>
          <div className="mt-5">
            <EmptyProductState goodsNo={goodsNo} />
          </div>
        </div>
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
      <main className="min-h-screen bg-neutral-50">
        <div className="mx-auto min-h-screen max-w-md bg-white px-4 py-5">
          <Link href="/menu" className="text-sm font-medium text-neutral-500">
            메뉴로 돌아가기
          </Link>
          <div className="mt-5">
            <MenuDetailErrorState message={groupResult.error.message} />
          </div>
        </div>
      </main>
    );
  }

  const optionGroups = (groupResult.data ?? []) as MenuOptionGroupRow[];
  const optNos = [...new Set(optionGroups.map((group) => group.opt_no))];
  const optionsResult =
    optNos.length > 0
      ? await supabase
          .from("options")
          .select(optionSelectColumns)
          .in("opt_no", optNos)
          .order("opt_no", { ascending: true })
      : { data: [] as MenuOption[], error: null };

  if (optionsResult.error) {
    return (
      <main className="min-h-screen bg-neutral-50">
        <div className="mx-auto min-h-screen max-w-md bg-white px-4 py-5">
          <Link href="/menu" className="text-sm font-medium text-neutral-500">
            메뉴로 돌아가기
          </Link>
          <div className="mt-5">
            <MenuDetailErrorState message={optionsResult.error.message} />
          </div>
        </div>
      </main>
    );
  }

  const optionsByNo = new Map(
    ((optionsResult.data ?? []) as MenuOption[]).map((item) => [item.opt_no, item]),
  );
  const orderedOptions = optNos.flatMap((optNo) => {
    const option = optionsByNo.get(optNo);
    return option ? [option] : [];
  });
  const groupedOptions = groupOptions(orderedOptions);
  const isSoldOut = product.soldout_fl === "y";

  return (
    <main className="kiosk-page">
      <div className="kiosk-shell min-h-screen pb-[calc(8.75rem+env(safe-area-inset-bottom))]">
        <header className="sticky top-0 z-10 border-b border-neutral-100 bg-white/95 px-4 py-4 backdrop-blur">
          <Link href="/menu" className="text-sm font-medium text-neutral-500">
            메뉴로 돌아가기
          </Link>
        </header>

        <section className="px-4 py-5">
          <ProductImage goods_no={product.goods_no} alt={product.goods_nm} size="menuDetail" />

          <div className="mt-5 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-[28px] font-bold leading-tight text-neutral-950">
                {product.goods_nm}
              </h1>
              {product.goods_en_nm ? (
                <p className="mt-1 text-sm text-neutral-500">{product.goods_en_nm}</p>
              ) : null}
            </div>
            {isSoldOut ? (
              <span className="shrink-0 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
                품절
              </span>
            ) : null}
          </div>

          <p className="mt-4 inline-flex rounded-full bg-neutral-100 px-3 py-1.5 text-lg font-bold text-neutral-950">
            {formatPrice(product.goods_price)}원
          </p>
          {isSoldOut ? (
            <p className="mt-3 rounded-2xl bg-red-50 px-3 py-3 text-sm text-red-700">
              현재 주문할 수 없는 상품입니다.
            </p>
          ) : null}
        </section>

        <ProductOptionSelector groupedOptions={groupedOptions} product={product} />
        <CartSummaryBar />
      </div>
    </main>
  );
}
