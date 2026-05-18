import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { ProductImage } from "@/components/admin/product-image";
import { createClient } from "@/lib/supabase/server";
import type { AdminProductListItem } from "@/types/admin-products";

const productSelectColumns = "goods_no, goods_nm, goods_price, cate_cd, soldout_fl, del_fl";

type AdminProductsPageProps = {
  searchParams: Promise<{
    status_error?: string;
  }>;
};

function formatPrice(price: AdminProductListItem["goods_price"]) {
  return Number(price).toLocaleString("ko-KR");
}

function getSoldoutLabel(soldout_fl: AdminProductListItem["soldout_fl"]) {
  return soldout_fl === "y" ? "sold_out" : "available";
}

function getVisibilityLabel(del_fl: AdminProductListItem["del_fl"]) {
  return del_fl === "y" ? "hidden" : "visible";
}

function getNextFlag(value: string | null) {
  return value === "y" ? "n" : "y";
}

function isValidDbFlag(value: FormDataEntryValue | null): value is "y" | "n" {
  return value === "y" || value === "n";
}

function getGoodsNo(formData: FormData) {
  const goodsNoValue = formData.get("goods_no");
  const goodsNo = Number(goodsNoValue);

  return Number.isInteger(goodsNo) ? goodsNo : null;
}

function getStatusErrorRedirectUrl(message: string) {
  return `/admin/products?status_error=${encodeURIComponent(message)}`;
}

async function updateProductStatus(
  goodsNo: number,
  update: Pick<AdminProductListItem, "soldout_fl"> | Pick<AdminProductListItem, "del_fl">,
) {
  let supabase: Awaited<ReturnType<typeof createClient>>;

  try {
    supabase = await createClient();
  } catch (error) {
    return error instanceof Error ? error.message : "Supabase client 생성에 실패했습니다.";
  }

  const existingProductResult = await supabase
    .from("goods")
    .select("goods_no, soldout_fl, del_fl")
    .eq("goods_no", goodsNo)
    .maybeSingle();

  if (existingProductResult.error) {
    return existingProductResult.error.message;
  }

  if (!existingProductResult.data) {
    return `goods_no ${goodsNo}에 해당하는 상품이 없습니다.`;
  }

  const { error } = await supabase
    .from("goods")
    .update(update)
    .eq("goods_no", goodsNo);

  if (error) {
    return error.message;
  }

  const verifyResult = await supabase
    .from("goods")
    .select("soldout_fl, del_fl")
    .eq("goods_no", goodsNo)
    .maybeSingle();

  if (verifyResult.error) {
    return verifyResult.error.message;
  }

  if (!verifyResult.data) {
    return `goods_no ${goodsNo} 상태 변경 결과를 확인할 수 없습니다.`;
  }

  if ("soldout_fl" in update && verifyResult.data.soldout_fl !== update.soldout_fl) {
    return "soldout_fl 변경이 DB에 반영되지 않았습니다.";
  }

  if ("del_fl" in update && verifyResult.data.del_fl !== update.del_fl) {
    return "del_fl 변경이 DB에 반영되지 않았습니다.";
  }

  revalidatePath("/admin/products");
  return null;
}

async function toggleProductSoldOut(formData: FormData) {
  "use server";

  const goodsNo = getGoodsNo(formData);
  const nextValue = formData.get("next_soldout_fl");

  if (goodsNo === null || !isValidDbFlag(nextValue)) {
    redirect(getStatusErrorRedirectUrl("상품 품절 상태 변경 요청이 올바르지 않습니다."));
  }

  const errorMessage = await updateProductStatus(goodsNo, { soldout_fl: nextValue });

  if (errorMessage) {
    redirect(getStatusErrorRedirectUrl(errorMessage));
  }

  redirect("/admin/products");
}

async function toggleProductVisible(formData: FormData) {
  "use server";

  const goodsNo = getGoodsNo(formData);
  const nextValue = formData.get("next_del_fl");

  if (goodsNo === null || !isValidDbFlag(nextValue)) {
    redirect(getStatusErrorRedirectUrl("상품 노출 상태 변경 요청이 올바르지 않습니다."));
  }

  const errorMessage = await updateProductStatus(goodsNo, { del_fl: nextValue });

  if (errorMessage) {
    redirect(getStatusErrorRedirectUrl(errorMessage));
  }

  redirect("/admin/products");
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

function ProductStatusError({ message }: { message: string }) {
  return (
    <section className="rounded-lg border border-red-200 bg-red-50 p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-red-950">상품 상태 변경 실패</h2>
          <p className="mt-2 text-sm text-red-800">원인: {message}</p>
        </div>
        <Link
          href="/admin/products"
          className="text-sm font-medium text-red-800 underline-offset-4 hover:underline"
        >
          메시지 닫기
        </Link>
      </div>
    </section>
  );
}

function StatusStructureNote() {
  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-5">
      <h2 className="text-base font-semibold text-neutral-950">상태 컬럼 구조</h2>
      <div className="mt-3 grid gap-3 text-sm text-neutral-700 lg:grid-cols-2">
        <div>
          <p className="font-medium text-neutral-950">soldout_fl</p>
          <p className="mt-1">`y`는 품절, `n`은 판매 가능 상태입니다.</p>
        </div>
        <div>
          <p className="font-medium text-neutral-950">del_fl</p>
          <p className="mt-1">
            기존 DB에서는 삭제 플래그지만, 현재 admin MVP에서는 `y`를 숨김, `n`을 노출로
            사용합니다.
          </p>
        </div>
      </div>
      <p className="mt-4 text-sm text-neutral-500">
        장기적으로 노출 상태가 필요하다면 `display_fl` 또는 `visible_fl` 같은 별도 `y/n` 컬럼을
        추가하고, `del_fl`는 실제 삭제/비활성 의미로 분리하는 구조가 더 명확합니다.
      </p>
    </section>
  );
}

function StatusToggleButton({
  label,
  actionLabel,
  tone,
}: {
  label: string;
  actionLabel: string;
  tone: "red" | "emerald" | "blue" | "neutral";
}) {
  const toneClassName = {
    red: "border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
    blue: "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100",
    neutral: "border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-neutral-100",
  }[tone];

  return (
    <button
      type="submit"
      className={`min-w-28 rounded-md border px-3 py-2 text-left text-xs font-medium transition ${toneClassName}`}
      title={actionLabel}
    >
      <span className="block">{label}</span>
      <span className="mt-1 block text-[11px] font-normal opacity-75">{actionLabel}</span>
    </button>
  );
}

function ProductStatusControls({ product }: { product: AdminProductListItem }) {
  const nextSoldoutFlag = getNextFlag(product.soldout_fl);
  const nextDelFlag = getNextFlag(product.del_fl);
  const isSoldOut = product.soldout_fl === "y";
  const isHidden = product.del_fl === "y";

  return (
    <div className="flex flex-wrap gap-2">
      <form action={toggleProductSoldOut}>
        <input type="hidden" name="goods_no" value={product.goods_no} />
        <input type="hidden" name="next_soldout_fl" value={nextSoldoutFlag} />
        <StatusToggleButton
          label={getSoldoutLabel(product.soldout_fl)}
          actionLabel={isSoldOut ? "판매 가능으로 변경" : "품절로 변경"}
          tone={isSoldOut ? "red" : "emerald"}
        />
      </form>

      <form action={toggleProductVisible}>
        <input type="hidden" name="goods_no" value={product.goods_no} />
        <input type="hidden" name="next_del_fl" value={nextDelFlag} />
        <StatusToggleButton
          label={getVisibilityLabel(product.del_fl)}
          actionLabel={isHidden ? "노출로 변경" : "숨김으로 변경"}
          tone={isHidden ? "neutral" : "blue"}
        />
      </form>
    </div>
  );
}

export default async function AdminProductsPage({ searchParams }: AdminProductsPageProps) {
  const { status_error } = await searchParams;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("goods")
    .select(productSelectColumns)
    .order("goods_no", { ascending: true });

  const products: AdminProductListItem[] = data ?? [];

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-neutral-500">상품 관리</p>
          <h1 className="mt-2 text-2xl font-semibold text-neutral-950">Products</h1>
          <p className="mt-2 text-sm text-neutral-500">
            Supabase `goods` 테이블을 조회해 키오스크 상품 상태를 확인합니다.
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex w-fit items-center rounded-md bg-neutral-950 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
        >
          상품 등록
        </Link>
      </header>

      {status_error ? <ProductStatusError message={status_error} /> : null}

      <StatusStructureNote />

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
                    <th className="px-5 py-3">status_actions</th>
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
                      <td className="whitespace-nowrap px-5 py-4">
                        <ProductStatusControls product={product} />
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
