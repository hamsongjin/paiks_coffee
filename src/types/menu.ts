import type { Database } from "@/types/database";

export type MenuCategory = Database["public"]["Tables"]["goods_cate"]["Row"];
export type MenuProduct = Pick<
  Database["public"]["Tables"]["goods"]["Row"],
  | "goods_no"
  | "cate_cd"
  | "goods_nm"
  | "goods_en_nm"
  | "goods_price"
  | "ice_fl"
  | "best_fl"
  | "new_fl"
  | "soldout_fl"
>;
export type MenuOptionGroupRow = Pick<
  Database["public"]["Tables"]["options_group"]["Row"],
  "goods_no" | "opt_no" | "seq"
>;
export type MenuOption = Pick<
  Database["public"]["Tables"]["options"]["Row"],
  "opt_no" | "opt_nm" | "opt_en_nm" | "opt_price" | "opt_type" | "opt_max_cnt" | "soldout_fl"
>;

export type MenuOptionGroup = {
  opt_type: string;
  options: MenuOption[];
};
