"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import {
  productCreateSchema,
  type ProductCreateActionResult,
  type ProductCreateFormInput,
  type ProductCreateFormValues,
} from "@/lib/admin/product-create";
import type { GoodsCategoryRow } from "@/types/admin-products";

import { createProductAction } from "./actions";

type ProductCreateFormProps = {
  categories: GoodsCategoryRow[];
};

function getDefaultValues(categories: GoodsCategoryRow[]): ProductCreateFormValues {
  return {
    goods_nm: "",
    goods_price: 0,
    cate_cd: categories[0]?.cate_cd ?? "",
    goods_img: "",
    soldout_fl: "n",
    del_fl: "n",
  };
}

function appendFormData(values: ProductCreateFormValues) {
  const formData = new FormData();

  formData.set("goods_nm", values.goods_nm);
  formData.set("goods_price", String(values.goods_price));
  formData.set("cate_cd", values.cate_cd);
  formData.set("goods_img", values.goods_img);
  formData.set("soldout_fl", values.soldout_fl);
  formData.set("del_fl", values.del_fl);

  return formData;
}

function FieldError({ message }: { message?: string }) {
  return message ? <p className="mt-1 text-xs text-red-700">{message}</p> : null;
}

export function ProductCreateForm({ categories }: ProductCreateFormProps) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<ProductCreateActionResult | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ProductCreateFormInput, unknown, ProductCreateFormValues>({
    resolver: zodResolver(productCreateSchema),
    defaultValues: getDefaultValues(categories),
  });

  function onSubmit(values: ProductCreateFormValues) {
    setResult(null);

    startTransition(async () => {
      const actionResult = await createProductAction(appendFormData(values));
      setResult(actionResult);
    });
  }

  const cannotSubmit = isPending || !isDirty || categories.length === 0;

  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-neutral-950">상품 등록</h2>
          <p className="mt-1 text-sm text-neutral-500">
            `goods` row를 추가합니다. 이미지는 업로드하지 않고 `public/goods` 파일명을 입력합니다.
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
            className="mt-1 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-950 outline-none focus:border-neutral-500 disabled:bg-neutral-50 disabled:text-neutral-400"
            disabled={categories.length === 0}
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

        <label className="block">
          <span className="text-xs font-semibold uppercase text-neutral-500">goods_img</span>
          <input
            className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 font-mono text-sm text-neutral-950 outline-none focus:border-neutral-500"
            placeholder="1000000170.png"
            type="text"
            {...register("goods_img")}
          />
          <p className="mt-1 text-xs text-neutral-500">
            `public/goods/파일명` 기준입니다. 현재 구조에서는 숫자 파일명이 `goods_no`가 됩니다.
          </p>
          <FieldError message={errors.goods_img?.message ?? result?.fieldErrors?.goods_img?.[0]} />
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
            `goods_en_nm`은 현재 필수 DB 컬럼이라 등록 시 `goods_nm`과 같은 값으로 저장합니다.
          </p>
          <button
            className="rounded-md bg-neutral-950 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300"
            disabled={cannotSubmit}
            type="submit"
          >
            {isPending ? "등록 중" : "등록"}
          </button>
        </div>
      </form>
    </section>
  );
}
