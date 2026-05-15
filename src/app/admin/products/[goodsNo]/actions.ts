"use server";

import { revalidatePath } from "next/cache";

import {
  productEditSchema,
  type ProductEditActionResult,
  type ProductEditFormValues,
} from "@/lib/admin/product-edit";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type GoodsUpdate = Database["public"]["Tables"]["goods"]["Update"];

function getFormValues(formData: FormData) {
  return {
    goods_no: formData.get("goods_no"),
    goods_nm: formData.get("goods_nm"),
    goods_price: formData.get("goods_price"),
    cate_cd: formData.get("cate_cd"),
    soldout_fl: formData.get("soldout_fl"),
    del_fl: formData.get("del_fl"),
  };
}

export async function updateProductAction(formData: FormData): Promise<ProductEditActionResult> {
  const parsed = productEditSchema.safeParse(getFormValues(formData));

  if (!parsed.success) {
    return {
      ok: false,
      message: "입력값을 확인하세요.",
      fieldErrors: parsed.error.flatten().fieldErrors as ProductEditActionResult["fieldErrors"],
    };
  }

  const values: ProductEditFormValues = parsed.data;
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

  const update: GoodsUpdate = {
    goods_nm: values.goods_nm,
    goods_price: values.goods_price,
    cate_cd: values.cate_cd,
    soldout_fl: values.soldout_fl,
    del_fl: values.del_fl,
    updated_at: new Date().toISOString(),
  };

  const updateResult = await supabase
    .from("goods")
    .update(update)
    .eq("goods_no", values.goods_no)
    .select("goods_no")
    .maybeSingle();

  if (updateResult.error) {
    return { ok: false, message: updateResult.error.message };
  }

  if (!updateResult.data) {
    return { ok: false, message: `goods_no ${values.goods_no}에 해당하는 상품이 없습니다.` };
  }

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${values.goods_no}`);

  return { ok: true, message: "상품 정보가 저장되었습니다." };
}
