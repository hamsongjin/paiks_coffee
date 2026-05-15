import type { Database } from "@/types/database";

export type GoodsRow = Database["public"]["Tables"]["goods"]["Row"];
export type GoodsCategoryRow = Database["public"]["Tables"]["goods_cate"]["Row"];
export type GoodsOptionGroupRow = Database["public"]["Tables"]["options_group"]["Row"];
export type GoodsOptionRow = Database["public"]["Tables"]["options"]["Row"];

export type AdminProductListItem = Pick<
  GoodsRow,
  "goods_no" | "goods_nm" | "goods_price" | "cate_cd" | "soldout_fl" | "del_fl"
>;

export type AdminProductDetail = GoodsRow;

export type AdminProductOptionItem = Pick<
  GoodsOptionGroupRow,
  "seq" | "goods_no" | "opt_no"
> & {
  option: GoodsOptionRow | null;
  is_duplicate_mapping: boolean;
};

export type AdminProductOptionGroup = {
  opt_type: string;
  items: AdminProductOptionItem[];
};
