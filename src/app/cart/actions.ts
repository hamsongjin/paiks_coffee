"use server";

import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

const cartOptionSchema = z.object({
  count: z.number().int().positive(),
  opt_no: z.number().int().positive(),
});

const cartItemSchema = z.object({
  goods_no: z.number().int().positive(),
  options: z.array(cartOptionSchema),
  quantity: z.number().int().positive().max(20),
});

const createOrderSchema = z.object({
  items: z.array(cartItemSchema).min(1, "장바구니가 비어 있습니다.").max(50),
});

type GoodsRow = Pick<
  Database["public"]["Tables"]["goods"]["Row"],
  "goods_no" | "goods_price" | "soldout_fl" | "del_fl"
>;
type OptionRow = Pick<
  Database["public"]["Tables"]["options"]["Row"],
  "opt_no" | "opt_price" | "opt_max_cnt" | "soldout_fl"
>;
type OrderInsert = Database["public"]["Tables"]["order"]["Insert"];
type OrderGoodsInsert = Database["public"]["Tables"]["order_goods"]["Insert"];

export type CreateOrderResult = {
  ok: boolean;
  message: string;
  orderNo?: string;
};

function createOrderNo() {
  const timePart = Date.now().toString(36).slice(-7).toUpperCase();
  const randomPart = Math.floor(Math.random() * 36 ** 3)
    .toString(36)
    .padStart(3, "0")
    .toUpperCase();

  return `${timePart}${randomPart}`.slice(0, 10);
}

function getGoodsOptionsText(options: { count: number; opt_no: number }[]) {
  if (options.length === 0) {
    return "-";
  }

  return options
    .map((option) =>
      option.count > 1 ? `${option.opt_no}x${option.count}` : String(option.opt_no),
    )
    .sort()
    .join(",");
}

export async function createOrderAction(input: unknown): Promise<CreateOrderResult> {
  const parsed = createOrderSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "주문 요청이 올바르지 않습니다.",
    };
  }

  const { items } = parsed.data;
  const goodsNos = [...new Set(items.map((item) => item.goods_no))];
  const optionNos = [
    ...new Set(items.flatMap((item) => item.options.map((option) => option.opt_no))),
  ];
  const supabase = await createClient();

  const goodsResult = await supabase
    .from("goods")
    .select("goods_no, goods_price, soldout_fl, del_fl")
    .in("goods_no", goodsNos);

  if (goodsResult.error) {
    return { ok: false, message: goodsResult.error.message };
  }

  const goodsByNo = new Map(
    (goodsResult.data as GoodsRow[]).map((goods) => [goods.goods_no, goods]),
  );

  const optionsResult =
    optionNos.length > 0
      ? await supabase
          .from("options")
          .select("opt_no, opt_price, opt_max_cnt, soldout_fl")
          .in("opt_no", optionNos)
      : { data: [] as OptionRow[], error: null };

  if (optionsResult.error) {
    return { ok: false, message: optionsResult.error.message };
  }

  const optionsByNo = new Map(
    ((optionsResult.data ?? []) as OptionRow[]).map((option) => [option.opt_no, option]),
  );

  const mappingResult =
    optionNos.length > 0
      ? await supabase
          .from("options_group")
          .select("goods_no, opt_no")
          .in("goods_no", goodsNos)
          .in("opt_no", optionNos)
      : { data: [] as { goods_no: number; opt_no: number }[], error: null };

  if (mappingResult.error) {
    return { ok: false, message: mappingResult.error.message };
  }

  const allowedOptionKeys = new Set(
    ((mappingResult.data ?? []) as { goods_no: number; opt_no: number }[]).map(
      (mapping) => `${mapping.goods_no}:${mapping.opt_no}`,
    ),
  );
  let totalPrice = 0;
  const orderGoodsRows: OrderGoodsInsert[] = [];
  const now = new Date().toISOString();
  const orderNo = createOrderNo();

  for (const item of items) {
    const goods = goodsByNo.get(item.goods_no);

    if (!goods || goods.del_fl === "y") {
      return { ok: false, message: "노출 중인 상품만 주문할 수 있습니다." };
    }

    if (goods.soldout_fl === "y") {
      return { ok: false, message: "품절 상품은 주문할 수 없습니다." };
    }

    let unitPrice = Number(goods.goods_price);

    for (const selectedOption of item.options) {
      const option = optionsByNo.get(selectedOption.opt_no);

      if (!option || !allowedOptionKeys.has(`${item.goods_no}:${selectedOption.opt_no}`)) {
        return { ok: false, message: "상품에 연결되지 않은 옵션이 포함되어 있습니다." };
      }

      if (option.soldout_fl === "y") {
        return { ok: false, message: "품절 옵션은 주문할 수 없습니다." };
      }

      const maxCount = Number(option.opt_max_cnt ?? 0);

      if (maxCount > 1 && selectedOption.count > maxCount) {
        return { ok: false, message: "옵션 수량이 선택 가능한 최대 수량을 초과했습니다." };
      }

      if (maxCount <= 1 && selectedOption.count !== 1) {
        return { ok: false, message: "단일 선택 옵션 수량이 올바르지 않습니다." };
      }

      unitPrice += Number(option.opt_price) * selectedOption.count;
    }

    const goodsOptions = getGoodsOptionsText(item.options);

    if (goodsOptions.length > 20) {
      return {
        ok: false,
        message: "선택 옵션 문자열이 DB 저장 길이를 초과했습니다. 옵션 수를 줄여주세요.",
      };
    }

    totalPrice += unitPrice * item.quantity;

    for (let index = 0; index < item.quantity; index += 1) {
      orderGoodsRows.push({
        order_no: orderNo,
        goods_no: item.goods_no,
        goods_options: goodsOptions,
        order_state: "pending",
        created_at: now,
        updated_at: now,
      });
    }
  }

  const orderInsert: OrderInsert = {
    order_no: orderNo,
    total_price: totalPrice,
    payment_method: "none",
    order_state: "pending",
    created_at: now,
    updated_at: now,
  };

  const orderResult = await supabase.from("order").insert(orderInsert).select("order_no").single();

  if (orderResult.error) {
    return { ok: false, message: orderResult.error.message };
  }

  const orderGoodsResult = await supabase.from("order_goods").insert(orderGoodsRows);

  if (orderGoodsResult.error) {
    return { ok: false, message: orderGoodsResult.error.message };
  }

  return { ok: true, message: "주문이 생성되었습니다.", orderNo };
}
