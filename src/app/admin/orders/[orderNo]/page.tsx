import Link from "next/link";

import {
  formatOrderDate,
  formatOrderPrice,
  OrderStatusBadge,
  toOrderStatus,
} from "@/lib/admin/orders";
import { createClient } from "@/lib/supabase/server";
import type {
  AdminOrderDetail,
  AdminOrderGoodsItem,
  OrderGoodsProductRow,
  OrderGoodsRow,
  OrderRow,
} from "@/types/admin-orders";

const orderSelectColumns =
  "seq, order_no, total_price, payment_method, order_state, created_at, updated_at";

const orderGoodsSelectColumns =
  "seq, order_no, goods_no, goods_options, order_state, created_at, updated_at";

type AdminOrderDetailPageProps = {
  params: Promise<{
    orderNo: string;
  }>;
};

function OrderDetailErrorState({ message }: { message: string }) {
  return (
    <section className="rounded-lg border border-red-200 bg-red-50 p-5">
      <h2 className="text-base font-semibold text-red-950">주문 상세 조회 실패</h2>
      <p className="mt-2 text-sm text-red-800">원인: {message}</p>
      <p className="mt-2 text-sm text-red-800">
        해결 방법: `order`, `order_goods`, `goods` 테이블의 RLS 조회 정책과 Data API 노출
        설정을 확인하세요.
      </p>
    </section>
  );
}

function EmptyOrderState({ orderNo }: { orderNo: string }) {
  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-6">
      <h2 className="text-base font-semibold text-neutral-950">주문을 찾을 수 없습니다</h2>
      <p className="mt-2 text-sm text-neutral-500">
        `order_no` {orderNo}에 해당하는 주문이 없습니다.
      </p>
    </section>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid gap-1 border-b border-neutral-100 py-3 last:border-b-0 sm:grid-cols-3">
      <dt className="text-xs font-semibold uppercase text-neutral-500">{label}</dt>
      <dd className="text-sm text-neutral-950 sm:col-span-2">{value}</dd>
    </div>
  );
}

function BackToOrdersLink() {
  return (
    <Link
      href="/admin/orders"
      className="w-fit rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 hover:text-neutral-950"
    >
      주문 목록으로 돌아가기
    </Link>
  );
}

function TerminalStatusNote({ order }: { order: AdminOrderDetail }) {
  const isTerminal = order.order_status === "completed" || order.order_status === "canceled";

  return (
    <section
      className={
        isTerminal
          ? "rounded-lg border border-neutral-200 bg-neutral-50 p-5"
          : "rounded-lg border border-blue-200 bg-blue-50 p-5"
      }
    >
      <h2 className={isTerminal ? "text-base font-semibold text-neutral-950" : "text-base font-semibold text-blue-950"}>
        terminal 상태 처리
      </h2>
      <p className={isTerminal ? "mt-2 text-sm text-neutral-700" : "mt-2 text-sm text-blue-800"}>
        `completed`와 `canceled`는 terminal 상태로 보고 이후 상태 변경 대상에서 제외합니다. 현재
        주문의 app `order_status`는 `{order.order_status}`이고, DB 원본 컬럼은
        `order_state = {order.order_state}`입니다.
      </p>
    </section>
  );
}

function OrderGoodsStructureNote() {
  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-5">
      <h2 className="text-base font-semibold text-neutral-950">order_goods 표시 기준</h2>
      <p className="mt-2 text-sm text-neutral-700">
        현재 `order_goods`에는 수량, 주문 당시 상품명, 주문 당시 단가 컬럼이 없습니다. 상세
        화면에서는 row 1개를 수량 1개로 보고, 가격은 현재 `goods.goods_price`를 참고값으로
        표시합니다.
      </p>
      <p className="mt-2 text-sm text-neutral-500">
        `goods_options`는 선택 옵션이 text로 저장된 현재 값을 그대로 보여줍니다.
      </p>
    </section>
  );
}

function getCurrentCatalogLineTotal(item: AdminOrderGoodsItem) {
  const price = Number(item.product?.goods_price);

  return Number.isFinite(price) ? price : null;
}

export default async function AdminOrderDetailPage({ params }: AdminOrderDetailPageProps) {
  const { orderNo: orderNoParam } = await params;
  const orderNo = decodeURIComponent(orderNoParam);
  const supabase = await createClient();

  const orderResult = await supabase
    .from("order")
    .select(orderSelectColumns)
    .eq("order_no", orderNo)
    .maybeSingle();

  if (orderResult.error) {
    return (
      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10">
        <BackToOrdersLink />
        <OrderDetailErrorState message={orderResult.error.message} />
      </main>
    );
  }

  const orderRow = orderResult.data as Pick<
    OrderRow,
    "seq" | "order_no" | "total_price" | "payment_method" | "order_state" | "created_at" | "updated_at"
  > | null;

  if (!orderRow) {
    return (
      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10">
        <BackToOrdersLink />
        <EmptyOrderState orderNo={orderNo} />
      </main>
    );
  }

  const order: AdminOrderDetail = {
    ...orderRow,
    order_status: toOrderStatus(orderRow.order_state),
  };

  const orderGoodsResult = await supabase
    .from("order_goods")
    .select(orderGoodsSelectColumns)
    .eq("order_no", orderNo)
    .order("seq", { ascending: true });

  if (orderGoodsResult.error) {
    return (
      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10">
        <BackToOrdersLink />
        <OrderDetailErrorState message={orderGoodsResult.error.message} />
      </main>
    );
  }

  const orderGoodsRows = (orderGoodsResult.data ?? []) as OrderGoodsRow[];
  const goodsNos = [...new Set(orderGoodsRows.map((item) => item.goods_no))];
  const goodsResult =
    goodsNos.length > 0
      ? await supabase
          .from("goods")
          .select("goods_no, goods_nm, goods_en_nm, goods_price")
          .in("goods_no", goodsNos)
      : { data: [] as OrderGoodsProductRow[], error: null };

  if (goodsResult.error) {
    return (
      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10">
        <BackToOrdersLink />
        <OrderDetailErrorState message={goodsResult.error.message} />
      </main>
    );
  }

  const goodsByNo = new Map(
    ((goodsResult.data ?? []) as OrderGoodsProductRow[]).map((goods) => [
      goods.goods_no,
      goods,
    ]),
  );
  const orderGoodsItems: AdminOrderGoodsItem[] = orderGoodsRows.map((item) => ({
    ...item,
    order_status: toOrderStatus(item.order_state),
    product: goodsByNo.get(item.goods_no) ?? null,
  }));
  const currentCatalogTotal = orderGoodsItems.reduce((total, item) => {
    const lineTotal = getCurrentCatalogLineTotal(item);

    return lineTotal === null ? total : total + lineTotal;
  }, 0);

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10">
      <BackToOrdersLink />

      <header>
        <p className="text-sm font-medium text-neutral-500">주문 상세</p>
        <h1 className="mt-2 text-2xl font-semibold text-neutral-950">{order.order_no}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <OrderStatusBadge order_status={order.order_status} />
          <span className="font-mono text-xs text-neutral-500">
            order_state: {order.order_state}
          </span>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase text-neutral-500">order_total</p>
          <p className="mt-2 text-2xl font-semibold text-neutral-950">
            {formatOrderPrice(order.total_price)}
          </p>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase text-neutral-500">order_goods rows</p>
          <p className="mt-2 text-2xl font-semibold text-neutral-950">
            {orderGoodsItems.length}
          </p>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase text-neutral-500">current_catalog_sum</p>
          <p className="mt-2 text-2xl font-semibold text-neutral-950">
            {formatOrderPrice(currentCatalogTotal)}
          </p>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(420px,1.3fr)]">
        <div className="flex flex-col gap-6">
          <div className="rounded-lg border border-neutral-200 bg-white p-5">
            <h2 className="text-base font-semibold text-neutral-950">order</h2>
            <dl className="mt-3">
              <DetailRow label="seq" value={order.seq} />
              <DetailRow label="order_no" value={order.order_no} />
              <DetailRow label="order_status" value={<OrderStatusBadge order_status={order.order_status} />} />
              <DetailRow label="order_state" value={order.order_state} />
              <DetailRow label="total_price" value={formatOrderPrice(order.total_price)} />
              <DetailRow label="payment_method" value={order.payment_method} />
              <DetailRow label="created_at" value={formatOrderDate(order.created_at)} />
              <DetailRow label="updated_at" value={formatOrderDate(order.updated_at)} />
            </dl>
          </div>

          <TerminalStatusNote order={order} />
          <OrderGoodsStructureNote />
        </div>

        <section className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
          <div className="border-b border-neutral-200 px-5 py-4">
            <h2 className="text-base font-semibold text-neutral-950">order_goods</h2>
            <p className="mt-1 text-sm text-neutral-500">
              `order_no`로 연결된 주문 상품 {orderGoodsItems.length}개
            </p>
          </div>

          {orderGoodsItems.length === 0 ? (
            <div className="px-5 py-10 text-sm text-neutral-500">
              이 주문에 연결된 `order_goods` row가 없습니다.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-neutral-200 text-sm">
                <thead className="bg-neutral-50 text-left text-xs font-semibold uppercase text-neutral-500">
                  <tr>
                    <th className="px-5 py-3">seq</th>
                    <th className="px-5 py-3">goods_no</th>
                    <th className="px-5 py-3">goods_nm</th>
                    <th className="px-5 py-3">quantity</th>
                    <th className="px-5 py-3">goods_price</th>
                    <th className="px-5 py-3">line_total</th>
                    <th className="px-5 py-3">goods_options</th>
                    <th className="px-5 py-3">item_status</th>
                    <th className="px-5 py-3">created_at</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {orderGoodsItems.map((item) => {
                    const quantity = 1;
                    const lineTotal = getCurrentCatalogLineTotal(item);

                    return (
                      <tr key={item.seq} className="text-neutral-800">
                        <td className="whitespace-nowrap px-5 py-4 font-mono text-xs text-neutral-600">
                          {item.seq}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 font-mono text-xs text-neutral-600">
                          {item.goods_no}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4">
                          <div className="font-medium text-neutral-950">
                            {item.product?.goods_nm ?? "연결된 goods 행 없음"}
                          </div>
                          <div className="mt-1 text-xs text-neutral-500">
                            {item.product?.goods_en_nm || "-"}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-5 py-4">{quantity}</td>
                        <td className="whitespace-nowrap px-5 py-4">
                          {formatOrderPrice(item.product?.goods_price)}
                          <div className="mt-1 text-[11px] text-neutral-400">current goods</div>
                        </td>
                        <td className="whitespace-nowrap px-5 py-4">
                          {formatOrderPrice(lineTotal)}
                        </td>
                        <td className="min-w-64 px-5 py-4 text-neutral-700">
                          {item.goods_options || "-"}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4">
                          <OrderStatusBadge order_status={item.order_status} />
                          <div className="mt-1 font-mono text-[11px] text-neutral-400">
                            order_state: {item.order_state ?? "-"}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-5 py-4">
                          {formatOrderDate(item.created_at)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
