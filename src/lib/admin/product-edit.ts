import { z } from "zod";

export const productEditSchema = z.object({
  goods_no: z.coerce.number().int("goods_no는 정수여야 합니다.").positive("goods_no가 올바르지 않습니다."),
  goods_nm: z.string().trim().min(1, "상품명을 입력하세요.").max(100, "상품명은 100자 이하로 입력하세요."),
  goods_price: z.coerce
    .number()
    .int("상품 가격은 정수로 입력하세요.")
    .min(0, "상품 가격은 0원 이상이어야 합니다.")
    .max(9999999, "상품 가격이 너무 큽니다."),
  cate_cd: z.string().trim().min(1, "카테고리를 선택하세요.").max(20, "cate_cd가 너무 깁니다."),
  soldout_fl: z.enum(["y", "n"], {
    message: "soldout_fl은 y 또는 n만 사용할 수 있습니다.",
  }),
  del_fl: z.enum(["y", "n"], {
    message: "del_fl은 y 또는 n만 사용할 수 있습니다.",
  }),
});

export type ProductEditFormValues = z.infer<typeof productEditSchema>;
export type ProductEditFormInput = z.input<typeof productEditSchema>;

export type ProductEditActionResult = {
  ok: boolean;
  message: string;
  fieldErrors?: Partial<Record<keyof ProductEditFormValues, string[]>>;
};
