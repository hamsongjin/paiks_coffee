"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  getGoodsNoFromImageFilename,
  productCreateSchema,
  type ProductCreateActionResult,
  type ProductCreateFormValues,
} from "@/lib/admin/product-create";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type GoodsInsert = Database["public"]["Tables"]["goods"]["Insert"];

function getFormValues(formData: FormData) {
  return {
    goods_nm: formData.get("goods_nm"),
    goods_price: formData.get("goods_price"),
    cate_cd: formData.get("cate_cd"),
    goods_img: formData.get("goods_img"),
    soldout_fl: formData.get("soldout_fl"),
    del_fl: formData.get("del_fl"),
  };
}

export async function createProductAction(formData: FormData): Promise<ProductCreateActionResult> {
  const parsed = productCreateSchema.safeParse(getFormValues(formData));

  if (!parsed.success) {
    return {
      ok: false,
      message: "입력값을 확인하세요.",
      fieldErrors: parsed.error.flatten().fieldErrors as ProductCreateActionResult["fieldErrors"],
    };
  }

  const values: ProductCreateFormValues = parsed.data;
  const goodsNo = getGoodsNoFromImageFilename(values.goods_img);
  const supabase = await createClient();

  const categoryResult = await supabase
    .from("goods_cate")
    .select("cate_cd")
    .eq("cate_cd", values.cate_cd)
    .maybeSingle();

  if (categoryResult.error) {
    return { ok: false, message: categoryResult.error.message };
  }

  if (!categoryResult.data) {
    return {
      ok: false,
      message: "존재하지 않는 cate_cd입니다.",
      fieldErrors: { cate_cd: ["존재하지 않는 cate_cd입니다."] },
    };
  }

  const existingProductResult = await supabase
    .from("goods")
    .select("goods_no")
    .eq("goods_no", goodsNo)
    .maybeSingle();

  if (existingProductResult.error) {
    return { ok: false, message: existingProductResult.error.message };
  }

  if (existingProductResult.data) {
    return {
      ok: false,
      message: "이미 사용 중인 이미지 파일명입니다.",
      fieldErrors: { goods_img: ["이미 같은 goods_no가 존재합니다. 다른 파일명을 입력하세요."] },
    };
  }

  const now = new Date().toISOString();
  const insert: GoodsInsert = {
    goods_no: goodsNo,
    goods_nm: values.goods_nm,
    goods_en_nm: values.goods_nm,
    goods_price: values.goods_price,
    cate_cd: values.cate_cd,
    soldout_fl: values.soldout_fl,
    del_fl: values.del_fl,
    created_at: now,
    updated_at: now,
  };

  const insertResult = await supabase.from("goods").insert(insert).select("goods_no").maybeSingle();

  if (insertResult.error) {
    return { ok: false, message: insertResult.error.message };
  }

  if (!insertResult.data) {
    return { ok: false, message: "상품 등록 결과를 확인할 수 없습니다." };
  }

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${goodsNo}`);

  redirect(`/admin/products/${goodsNo}`);
}
