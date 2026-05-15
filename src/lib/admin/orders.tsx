import type { OrderStatus } from "@/types/admin-orders";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "접수 대기",
  cooking: "조리 중",
  completed: "완료",
  canceled: "취소",
  unknown: "알 수 없음",
};

export function toOrderStatus(order_state: string | null | undefined): OrderStatus {
  const normalized = order_state?.toLowerCase();

  if (
    normalized === "pending" ||
    normalized === "cooking" ||
    normalized === "completed" ||
    normalized === "canceled"
  ) {
    return normalized;
  }

  return "unknown";
}

export function isTerminalOrderStatus(order_status: OrderStatus) {
  return order_status === "completed" || order_status === "canceled";
}

export function canTransitionOrderStatus(currentStatus: OrderStatus, nextStatus: OrderStatus) {
  if (currentStatus === "pending") {
    return nextStatus === "cooking" || nextStatus === "canceled";
  }

  if (currentStatus === "cooking") {
    return nextStatus === "completed" || nextStatus === "canceled";
  }

  return false;
}

export function getOrderStatusActions(order_status: OrderStatus) {
  if (order_status === "pending") {
    return [
      { next_order_status: "cooking" as const, label: "조리 시작", variant: "primary" as const },
      { next_order_status: "canceled" as const, label: "주문 취소", variant: "danger" as const },
    ];
  }

  if (order_status === "cooking") {
    return [
      { next_order_status: "completed" as const, label: "완료 처리", variant: "primary" as const },
      { next_order_status: "canceled" as const, label: "주문 취소", variant: "danger" as const },
    ];
  }

  return [];
}

export function formatOrderPrice(price: number | string | null | undefined) {
  if (price === null || price === undefined || price === "") {
    return "-";
  }

  const numericPrice = Number(price);

  return Number.isFinite(numericPrice) ? `${numericPrice.toLocaleString("ko-KR")}원` : "-";
}

export function formatOrderDate(value: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function OrderStatusBadge({ order_status }: { order_status: OrderStatus }) {
  const statusClassName = {
    pending: "bg-amber-50 text-amber-800",
    cooking: "bg-blue-50 text-blue-700",
    completed: "bg-emerald-50 text-emerald-700",
    canceled: "bg-neutral-100 text-neutral-600",
    unknown: "bg-red-50 text-red-700",
  }[order_status];

  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClassName}`}>
      {order_status}
    </span>
  );
}
