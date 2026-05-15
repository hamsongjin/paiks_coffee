import type { Database } from "@/types/database";

export type OrderRow = Database["public"]["Tables"]["order"]["Row"];
export type OrderGoodsRow = Database["public"]["Tables"]["order_goods"]["Row"];
export type OrderGoodsProductRow = Pick<
  Database["public"]["Tables"]["goods"]["Row"],
  "goods_no" | "goods_nm" | "goods_en_nm" | "goods_price"
>;

export type OrderStatus = "pending" | "cooking" | "completed" | "canceled" | "unknown";

export type AdminOrderListItem = Pick<
  OrderRow,
  "seq" | "order_no" | "total_price" | "payment_method" | "order_state" | "created_at" | "updated_at"
> & {
  order_status: OrderStatus;
  item_count: number;
};

export type AdminOrderDetail = OrderRow & {
  order_status: OrderStatus;
};

export type AdminOrderGoodsItem = OrderGoodsRow & {
  order_status: OrderStatus;
  product: OrderGoodsProductRow | null;
};
