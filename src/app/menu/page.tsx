import { CategoryTabs } from "@/components/menu/category-tabs";
import { CartSummaryBar } from "@/components/menu/cart-summary-bar";
import { ProductCard } from "@/components/menu/product-card";
import { createClient } from "@/lib/supabase/server";
import type { MenuCategory, MenuProduct } from "@/types/menu";

const productSelectColumns =
  "goods_no, cate_cd, goods_nm, goods_en_nm, goods_price, ice_fl, best_fl, new_fl, soldout_fl";

type MenuPageProps = {
  searchParams: Promise<{
    cate_cd?: string;
  }>;
};

function getActiveCategory(categories: MenuCategory[], requestedCateCd?: string) {
  if (requestedCateCd && categories.some((category) => category.cate_cd === requestedCateCd)) {
    return requestedCateCd;
  }

  return categories[0]?.cate_cd ?? "";
}

function MenuErrorState({ message }: { message: string }) {
  return (
    <section className="rounded-md border border-red-200 bg-red-50 p-4">
      <h2 className="text-sm font-semibold text-red-950">메뉴를 불러오지 못했습니다</h2>
      <p className="mt-2 text-sm text-red-800">{message}</p>
    </section>
  );
}

export default async function MenuPage({ searchParams }: MenuPageProps) {
  const { cate_cd } = await searchParams;
  const supabase = await createClient();

  const [categoriesResult, productsResult] = await Promise.all([
    supabase.from("goods_cate").select("cate_cd, cate_nm").order("cate_cd", { ascending: true }),
    supabase
      .from("goods")
      .select(productSelectColumns)
      .eq("del_fl", "n")
      .order("goods_no", { ascending: true }),
  ]);

  const categories = (categoriesResult.data ?? []) as MenuCategory[];
  const products = (productsResult.data ?? []) as MenuProduct[];
  const activeCateCd = getActiveCategory(categories, cate_cd);
  const visibleProducts = products.filter((product) => product.cate_cd === activeCateCd);
  const activeCategory = categories.find((category) => category.cate_cd === activeCateCd);

  return (
    <main className="min-h-screen bg-neutral-50">
      <div className="mx-auto flex min-h-screen max-w-md flex-col bg-white">
        <header className="sticky top-0 z-10 border-b border-neutral-100 bg-white/95 px-4 py-4 backdrop-blur">
          <p className="text-xs font-semibold uppercase text-neutral-500">Paik&apos;s Coffee</p>
          <h1 className="mt-1 text-2xl font-bold text-neutral-950">메뉴</h1>
        </header>

        {categoriesResult.error || productsResult.error ? (
          <div className="p-4">
            <MenuErrorState
              message={categoriesResult.error?.message ?? productsResult.error?.message ?? ""}
            />
          </div>
        ) : categories.length === 0 ? (
          <div className="p-4 text-sm text-neutral-500">등록된 카테고리가 없습니다.</div>
        ) : (
          <>
            <CategoryTabs activeCateCd={activeCateCd} categories={categories} />

            <section className="px-4 py-4">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="font-mono text-xs text-neutral-400">{activeCateCd}</p>
                  <h2 className="mt-1 text-lg font-semibold text-neutral-950">
                    {activeCategory?.cate_nm ?? "카테고리"}
                  </h2>
                </div>
                <p className="text-sm text-neutral-500">{visibleProducts.length}개</p>
              </div>
            </section>

            <section className="flex-1">
              {visibleProducts.length === 0 ? (
                <div className="px-4 py-12 text-center text-sm text-neutral-500">
                  이 카테고리에 노출 중인 상품이 없습니다.
                </div>
              ) : (
                <div className="border-y border-neutral-100">
                  {visibleProducts.map((product) => (
                    <ProductCard key={product.goods_no} product={product} />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
        <CartSummaryBar />
      </div>
    </main>
  );
}
