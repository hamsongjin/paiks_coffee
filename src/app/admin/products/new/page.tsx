import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import type { GoodsCategoryRow } from "@/types/admin-products";

import { ProductCreateForm } from "./product-create-form";

function ProductCreateErrorState({ message }: { message: string }) {
  return (
    <section className="rounded-lg border border-red-200 bg-red-50 p-5">
      <h2 className="text-base font-semibold text-red-950">상품 등록 준비 실패</h2>
      <p className="mt-2 text-sm text-red-800">원인: {message}</p>
      <p className="mt-2 text-sm text-red-800">
        해결 방법: `goods_cate` 테이블의 RLS 조회 정책과 Data API 노출 설정을 확인하세요.
      </p>
    </section>
  );
}

function EmptyCategoryState() {
  return (
    <section className="rounded-lg border border-amber-200 bg-amber-50 p-5">
      <h2 className="text-base font-semibold text-amber-950">등록 가능한 카테고리가 없습니다</h2>
      <p className="mt-2 text-sm text-amber-900">
        상품 등록 전 `goods_cate`에 카테고리를 먼저 추가해야 합니다.
      </p>
    </section>
  );
}

export default async function AdminProductCreatePage() {
  const supabase = await createClient();

  const categoriesResult = await supabase
    .from("goods_cate")
    .select("cate_cd, cate_nm")
    .order("cate_cd", { ascending: true });

  const categories = (categoriesResult.data ?? []) as GoodsCategoryRow[];

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-10">
      <Link href="/admin/products" className="text-sm text-neutral-500 hover:text-neutral-950">
        Back to products
      </Link>

      <header>
        <p className="text-sm font-medium text-neutral-500">상품 관리</p>
        <h1 className="mt-2 text-2xl font-semibold text-neutral-950">New Product</h1>
        <p className="mt-2 text-sm text-neutral-500">
          Supabase `goods` 테이블에 새 상품을 등록합니다.
        </p>
      </header>

      {categoriesResult.error ? (
        <ProductCreateErrorState message={categoriesResult.error.message} />
      ) : (
        <>
          {categories.length === 0 ? <EmptyCategoryState /> : null}
          <ProductCreateForm categories={categories} />
        </>
      )}
    </main>
  );
}
