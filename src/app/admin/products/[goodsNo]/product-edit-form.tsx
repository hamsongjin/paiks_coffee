"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import {
  productEditSchema,
  type ProductEditActionResult,
  type ProductEditFormInput,
  type ProductEditFormValues,
} from "@/lib/admin/product-edit";
import type { AdminProductDetail, GoodsCategoryRow } from "@/types/admin-products";

import { updateProductAction } from "./actions";

type ProductEditFormProps = {
  product: Pick<
    AdminProductDetail,
    "goods_no" | "goods_nm" | "goods_price" | "cate_cd" | "soldout_fl" | "del_fl"
  >;
  categories: GoodsCategoryRow[];
};

function getDefaultValues(product: ProductEditFormProps["product"]): ProductEditFormValues {
  return {
    goods_no: product.goods_no,
    goods_nm: product.goods_nm,
    goods_price: Number(product.goods_price),
    cate_cd: product.cate_cd,
    soldout_fl: product.soldout_fl === "y" ? "y" : "n",
    del_fl: product.del_fl === "y" ? "y" : "n",
  };
}

function appendFormData(values: ProductEditFormValues) {
  const formData = new FormData();

  formData.set("goods_no", String(values.goods_no));
  formData.set("goods_nm", values.goods_nm);
  formData.set("goods_price", String(values.goods_price));
  formData.set("cate_cd", values.cate_cd);
  formData.set("soldout_fl", values.soldout_fl);
  formData.set("del_fl", values.del_fl);

  return formData;
}

function FieldError({ message }: { message?: string }) {
  return message ? <p className="mt-1 text-xs text-red-700">{message}</p> : null;
}

export function ProductEditForm({ product, categories }: ProductEditFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<ProductEditActionResult | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProductEditFormInput, unknown, ProductEditFormValues>({
    resolver: zodResolver(productEditSchema),
    defaultValues: getDefaultValues(product),
  });

  function onSubmit(values: ProductEditFormValues) {
    setResult(null);

    startTransition(async () => {
      const actionResult = await updateProductAction(appendFormData(values));
      setResult(actionResult);

      if (actionResult.ok) {
        reset(values);
        router.refresh();
      }
    });
  }

  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-neutral-950">상품 수정</h2>
          <p className="mt-1 text-sm text-neutral-500">
            현재 `goods` row의 기본 정보와 상태 플래그만 수정합니다.
          </p>
        </div>
        {result ? (
          <span
            className={
              result.ok
                ? "rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700"
                : "rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700"
            }
          >
            {result.message}
          </span>
        ) : null}
      </div>

      <form className="mt-5 grid gap-4" onSubmit={handleSubmit(onSubmit)}>
        <input type="hidden" {...register("goods_no", { valueAsNumber: true })} />

        <label className="block">
          <span className="text-xs font-semibold uppercase text-neutral-500">goods_nm</span>
          <input
            className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm text-neutral-950 outline-none focus:border-neutral-500"
            type="text"
            {...register("goods_nm")}
          />
          <FieldError message={errors.goods_nm?.message ?? result?.fieldErrors?.goods_nm?.[0]} />
        </label>

        <label className="block">
          <span className="text-xs font-semibold uppercase text-neutral-500">goods_price</span>
          <input
            className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm text-neutral-950 outline-none focus:border-neutral-500"
            min={0}
            step={1}
            type="number"
            {...register("goods_price", { valueAsNumber: true })}
          />
          <FieldError
            message={errors.goods_price?.message ?? result?.fieldErrors?.goods_price?.[0]}
          />
        </label>

        <label className="block">
          <span className="text-xs font-semibold uppercase text-neutral-500">cate_cd</span>
          <select
            className="mt-1 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-950 outline-none focus:border-neutral-500"
            {...register("cate_cd")}
          >
            {categories.map((category) => (
              <option key={category.cate_cd} value={category.cate_cd}>
                {category.cate_cd} / {category.cate_nm}
              </option>
            ))}
          </select>
          <FieldError message={errors.cate_cd?.message ?? result?.fieldErrors?.cate_cd?.[0]} />
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-semibold uppercase text-neutral-500">soldout_fl</span>
            <select
              className="mt-1 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-950 outline-none focus:border-neutral-500"
              {...register("soldout_fl")}
            >
              <option value="n">n / 판매 가능</option>
              <option value="y">y / 품절</option>
            </select>
            <FieldError
              message={errors.soldout_fl?.message ?? result?.fieldErrors?.soldout_fl?.[0]}
            />
          </label>

          <label className="block">
            <span className="text-xs font-semibold uppercase text-neutral-500">del_fl</span>
            <select
              className="mt-1 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-950 outline-none focus:border-neutral-500"
              {...register("del_fl")}
            >
              <option value="n">n / visible</option>
              <option value="y">y / hidden</option>
            </select>
            <FieldError message={errors.del_fl?.message ?? result?.fieldErrors?.del_fl?.[0]} />
          </label>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <p className="text-xs text-neutral-500">
            `soldout_fl`은 품절 상태, `del_fl`은 노출/숨김 상태로 사용합니다.
          </p>
          <button
            className="rounded-md bg-neutral-950 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300"
            disabled={isPending || !isDirty}
            type="submit"
          >
            {isPending ? "저장 중" : "저장"}
          </button>
        </div>
      </form>
    </section>
  );
}
