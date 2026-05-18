"use client";

import Link from "next/link";

import { useCartStore } from "@/stores/cartStore";

function formatPrice(price: number) {
  return price.toLocaleString("ko-KR");
}

export function CartSummaryBar() {
  const itemCount = useCartStore((state) => state.getItemCount());
  const totalPrice = useCartStore((state) => state.getTotalPrice());

  if (itemCount === 0) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-20 px-4 pb-4">
      <Link
        href="/cart"
        className="mx-auto flex max-w-md items-center justify-between rounded-md bg-neutral-950 px-4 py-3 text-white shadow-lg"
      >
        <span className="text-sm font-semibold">장바구니 {itemCount}개</span>
        <span className="text-sm font-bold">{formatPrice(totalPrice)}원</span>
      </Link>
    </div>
  );
}
