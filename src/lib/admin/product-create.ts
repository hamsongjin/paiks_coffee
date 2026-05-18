import { z } from "zod";

import { productBaseSchema } from "@/lib/admin/product-edit";

const goodsImageFilenameSchema = z
  .string()
  .trim()
  .min(1, "이미지 파일명을 입력하세요.")
  .regex(/^\d+\.png$/, "public/goods 기준 숫자 파일명만 입력하세요. 예: 1000000170.png");

export const productCreateSchema = productBaseSchema.extend({
  goods_img: goodsImageFilenameSchema,
});

export function getGoodsNoFromImageFilename(goodsImg: string) {
  return Number(goodsImg.replace(/\.png$/, ""));
}

export type ProductCreateFormValues = z.infer<typeof productCreateSchema>;
export type ProductCreateFormInput = z.input<typeof productCreateSchema>;

export type ProductCreateActionResult = {
  ok: boolean;
  message: string;
  fieldErrors?: Partial<Record<keyof ProductCreateFormValues, string[]>>;
};
