import Link from "next/link";

import {
  formatOrderDate,
  formatOrderPrice,
  OrderStatusBadge,
  toOrderStatus,
} from "@/lib/admin/orders";
import { createClient } from "@/lib/supabase/server";
import type { AdminOrderListItem, OrderGoodsRow, OrderRow } from "@/types/admin-orders";

const orderSelectColumns =
  "seq, order_no, total_price, payment_method, order_state, created_at, updated_at";

export const dynamic = "force-dynamic";

function OrdersErrorState({ message }: { message: string }) {
  return (
    <section className="rounded-lg border border-red-200 bg-red-50 p-5">
      <h2 className="text-base font-semibold text-red-950">주문 목록 조회 실패</h2>
      <p className="mt-2 text-sm text-red-800">원인: {message}</p>
      <p className="mt-2 text-sm text-red-800">
        해결 방법: `order`, `order_goods` 테이블의 RLS 조회 정책과 Data API 노출 설정을
        확인하세요.
      </p>
    </section>
  );
}

function OrderStructureNote() {
  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-5">
      <h2 className="text-base font-semibold text-neutral-950">order / order_goods 구조</h2>
      <div className="mt-3 grid gap-4 text-sm text-neutral-700 lg:grid-cols-3">
        <div>
          <p className="font-medium text-neutral-950">관계</p>
          <p className="mt-1">
            `order.order_no`가 주문의 business key이고, `order_goods.order_no`가 같은 값을
            저장해 주문 상품 row를 연결합니다.
          </p>
        </div>
        <div>
          <p className="font-medium text-neutral-950">상태 매핑</p>
          <p className="mt-1">
            앱에서는 `order_status`라고 부르고, 현재 DB에서는 `order_state` 컬럼을 그대로
            조회합니다.
          </p>
        </div>
        <div>
          <p className="font-medium text-neutral-950">상태 흐름</p>
          <p className="mt-1">
            `pending {"->"} cooking {"->"} completed`, `pending/cooking {"->"} canceled` 흐름을 기준으로
            봅니다.
          </p>
        </div>
      </div>
      <p className="mt-4 text-sm text-neutral-500">
        `completed`와 `canceled`는 terminal 상태입니다. 상세 화면의 상태 변경 기능에서도 terminal
        주문은 변경 대상에서 제외합니다.
      </p>
    </section>
  );
}

function getItemCountByOrderNo(orderGoodsRows: Pick<OrderGoodsRow, "order_no">[]) {
  return orderGoodsRows.reduce((countMap, row) => {
    countMap.set(row.order_no, (countMap.get(row.order_no) ?? 0) + 1);
    return countMap;
  }, new Map<string, number>());
}

export default async function AdminOrdersPage() {
  let supabase: Awaited<ReturnType<typeof createClient>>;

  try {
    supabase = await createClient();
  } catch (error) {
    return (
      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10">
        <header>
          <p className="text-sm font-medium text-neutral-500">주문 관리</p>
          <h1 className="mt-2 text-2xl font-semibold text-neutral-950">Orders</h1>
        </header>
        <OrdersErrorState
          message={error instanceof Error ? error.message : "Supabase client 생성에 실패했습니다."}
        />
      </main>
    );
  }

  const ordersResult = await supabase
    .from("order")
    .select(orderSelectColumns)
    .order("created_at", { ascending: false });

  if (ordersResult.error) {
    return (
      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10">
        <header>
          <p className="text-sm font-medium text-neutral-500">주문 관리</p>
          <h1 className="mt-2 text-2xl font-semibold text-neutral-950">Orders</h1>
        </header>
        <OrdersErrorState message={ordersResult.error.message} />
      </main>
    );
  }

  const orders = (ordersResult.data ?? []) as Pick<
    OrderRow,
    "seq" | "order_no" | "total_price" | "payment_method" | "order_state" | "created_at" | "updated_at"
  >[];
  const orderNos = orders.map((order) => order.order_no);

  const orderGoodsResult =
    orderNos.length > 0
      ? await supabase.from("order_goods").select("order_no").in("order_no", orderNos)
      : { data: [] as Pick<OrderGoodsRow, "order_no">[], error: null };

  if (orderGoodsResult.error) {
    return (
      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10">
        <header>
          <p className="text-sm font-medium text-neutral-500">주문 관리</p>
          <h1 className="mt-2 text-2xl font-semibold text-neutral-950">Orders</h1>
        </header>
        <OrdersErrorState message={orderGoodsResult.error.message} />
      </main>
    );
  }

  const itemCountByOrderNo = getItemCountByOrderNo(
    (orderGoodsResult.data ?? []) as Pick<OrderGoodsRow, "order_no">[],
  );
  const orderItems: AdminOrderListItem[] = orders.map((order) => ({
    ...order,
    order_status: toOrderStatus(order.order_state),
    item_count: itemCountByOrderNo.get(order.order_no) ?? 0,
  }));

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10">
      <header>
        <p className="text-sm font-medium text-neutral-500">주문 관리</p>
        <h1 className="mt-2 text-2xl font-semibold text-neutral-950">Orders</h1>
        <p className="mt-2 text-sm text-neutral-500">
          결제/실시간 기능 없이 `order`와 `order_goods`를 조회해 주문 상태를 확인합니다.
        </p>
      </header>

      <OrderStructureNote />

      <section className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
        <div className="border-b border-neutral-200 px-5 py-4">
          <h2 className="text-base font-semibold text-neutral-950">주문 목록</h2>
          <p className="mt-1 text-sm text-neutral-500">총 {orderItems.length}개</p>
        </div>

        {orderItems.length === 0 ? (
          <div className="px-5 py-10 text-sm text-neutral-500">
            조회된 주문이 없습니다. `order` 테이블 데이터를 확인하세요.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200 text-sm">
              <thead className="bg-neutral-50 text-left text-xs font-semibold uppercase text-neutral-500">
                <tr>
                  <th className="px-5 py-3">order_no</th>
                  <th className="px-5 py-3">order_status</th>
                  <th className="px-5 py-3">total_price</th>
                  <th className="px-5 py-3">payment_method</th>
                  <th className="px-5 py-3">created_at</th>
                  <th className="px-5 py-3">items</th>
                  <th className="px-5 py-3">detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {orderItems.map((order) => (
                  <tr key={order.seq} className="text-neutral-800">
                    <td className="whitespace-nowrap px-5 py-4 font-mono text-xs text-neutral-600">
                      <Link
                        href={`/admin/orders/${encodeURIComponent(order.order_no)}`}
                        className="text-neutral-700 underline-offset-4 hover:text-neutral-950 hover:underline"
                      >
                        {order.order_no}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <OrderStatusBadge order_status={order.order_status} />
                      <div className="mt-1 font-mono text-[11px] text-neutral-400">
                        order_state: {order.order_state}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">
                      {formatOrderPrice(order.total_price)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">{order.payment_method}</td>
                    <td className="whitespace-nowrap px-5 py-4">
                      {formatOrderDate(order.created_at)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">{order.item_count}</td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <Link
                        href={`/admin/orders/${encodeURIComponent(order.order_no)}`}
                        className="text-sm font-medium text-neutral-700 underline-offset-4 hover:text-neutral-950 hover:underline"
                      >
                        상세 보기
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
