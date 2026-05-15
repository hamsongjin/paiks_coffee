import type { OrderStatus } from "@/types/admin-orders";

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
