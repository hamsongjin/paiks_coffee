import Link from "next/link";

import { ProductImage } from "@/components/admin/product-image";
import { createClient } from "@/lib/supabase/server";
import type { AdminProductListItem } from "@/types/admin-products";

const productSelectColumns = "goods_no, goods_nm, goods_price, cate_cd, soldout_fl, del_fl";

function formatPrice(price: AdminProductListItem["goods_price"]) {
  return Number(price).toLocaleString("ko-KR");
}

function getSoldoutLabel(soldout_fl: AdminProductListItem["soldout_fl"]) {
  return soldout_fl === "y" ? "sold_out" : "available";
}

function getVisibilityLabel(del_fl: AdminProductListItem["del_fl"]) {
  return del_fl === "y" ? "hidden" : "visible";
}

function ProductsErrorState({ message }: { message: string }) {
  return (
    <section className="rounded-lg border border-red-200 bg-red-50 p-5">
      <h2 className="text-base font-semibold text-red-950">상품 목록 조회 실패</h2>
      <p className="mt-2 text-sm text-red-800">원인: {message}</p>
      <p className="mt-2 text-sm text-red-800">
        해결 방법: `.env.local`의 Supabase URL/key, `goods` 및 `goods_cate` 테이블의 RLS 조회
        정책, Data API 노출 설정을 확인하세요.
      </p>
    </section>
  );
}

export default async function AdminProductsPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("goods")
    .select(productSelectColumns)
    .order("goods_no", { ascending: true });

  const products: AdminProductListItem[] = data ?? [];

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10">
      <header>
        <p className="text-sm font-medium text-neutral-500">상품 관리</p>
        <h1 className="mt-2 text-2xl font-semibold text-neutral-950">Products</h1>
        <p className="mt-2 text-sm text-neutral-500">
          Supabase `goods` 테이블을 조회해 키오스크 상품 상태를 확인합니다.
        </p>
      </header>

      {error ? (
        <ProductsErrorState message={error.message} />
      ) : (
        <section className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
          <div className="border-b border-neutral-200 px-5 py-4">
            <h2 className="text-base font-semibold text-neutral-950">상품 목록</h2>
            <p className="mt-1 text-sm text-neutral-500">총 {products.length}개</p>
          </div>

          {products.length === 0 ? (
            <div className="px-5 py-10 text-sm text-neutral-500">
              조회된 상품이 없습니다. `goods` 테이블 데이터를 확인하세요.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-neutral-200 text-sm">
                <thead className="bg-neutral-50 text-left text-xs font-semibold uppercase text-neutral-500">
                  <tr>
                    <th className="px-5 py-3">image</th>
                    <th className="px-5 py-3">goods_no</th>
                    <th className="px-5 py-3">goods_nm</th>
                    <th className="px-5 py-3">goods_price</th>
                    <th className="px-5 py-3">cate_cd</th>
                    <th className="px-5 py-3">sold_out</th>
                    <th className="px-5 py-3">visible</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {products.map((product) => (
                    <tr key={product.goods_no} className="text-neutral-800">
                      <td className="whitespace-nowrap px-5 py-4">
                        <Link href={`/admin/products/${product.goods_no}`}>
                          <ProductImage
                            goods_no={product.goods_no}
                            alt={product.goods_nm}
                            size="thumbnail"
                          />
                        </Link>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 font-mono text-xs text-neutral-600">
                        <Link
                          href={`/admin/products/${product.goods_no}`}
                          className="text-neutral-700 underline-offset-4 hover:text-neutral-950 hover:underline"
                        >
                          {product.goods_no}
                        </Link>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 font-medium text-neutral-950">
                        <Link
                          href={`/admin/products/${product.goods_no}`}
                          className="underline-offset-4 hover:underline"
                        >
                          {product.goods_nm}
                        </Link>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4">
                        {formatPrice(product.goods_price)}원
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 font-mono text-xs text-neutral-600">
                        {product.cate_cd}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4">
                        <span
                          className={
                            product.soldout_fl === "y"
                              ? "rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700"
                              : "rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700"
                          }
                        >
                          {getSoldoutLabel(product.soldout_fl)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4">
                        <span
                          className={
                            product.del_fl === "y"
                              ? "rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-600"
                              : "rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700"
                          }
                        >
                          {getVisibilityLabel(product.del_fl)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </main>
  );
}
