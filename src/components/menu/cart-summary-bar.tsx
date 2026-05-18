"use client";

import Link from "next/link";

import { useCartStore } from "@/stores/cartStore";
import { useMounted } from "@/hooks/use-mounted";

function formatPrice(price: number) {
  return price.toLocaleString("ko-KR");
}

export function CartSummaryBar() {
  const mounted = useMounted();
  const itemCount = useCartStore((state) => state.getItemCount());
  const totalPrice = useCartStore((state) => state.getTotalPrice());

  if (!mounted || itemCount === 0) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
      <div className="mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-neutral-200 bg-white/95 px-4 py-3 shadow-[0_20px_50px_-20px_rgba(23,23,23,0.35)] backdrop-blur">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-neutral-950 text-white">
          <span className="text-sm font-bold">{itemCount}</span>
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
            장바구니
          </p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-sm font-semibold text-neutral-600">총 상품 {itemCount}개</span>
            <span className="truncate text-[17px] font-bold text-neutral-950">
              {formatPrice(totalPrice)}원
            </span>
          </div>
        </div>

        <Link
          href="/cart"
          className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-full bg-neutral-950 px-4 text-sm font-semibold text-white transition duration-200 ease-out active:scale-[0.98]"
        >
          장바구니 보기
        </Link>
      </div>
    </div>
  );
}
