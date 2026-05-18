"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { createOrderAction } from "@/app/cart/actions";
import { useMounted } from "@/hooks/use-mounted";
import { useCartStore, type CartItem } from "@/stores/cartStore";

function formatPrice(price: number) {
  return price.toLocaleString("ko-KR");
}

function CartItemOptions({ item }: { item: CartItem }) {
  if (item.options.length === 0) {
    return <p className="mt-2 text-xs text-neutral-400">선택한 옵션 없음</p>;
  }

  return (
    <ul className="mt-3 grid gap-2">
      {item.options.map((option) => (
        <li
          key={`${option.opt_type}:${option.opt_no}`}
          className="flex items-center justify-between gap-3 rounded-xl bg-neutral-50 px-3 py-2 text-xs text-neutral-500"
        >
          <span className="min-w-0">
            <span className="block truncate font-medium text-neutral-400">{option.opt_type}</span>
            <span className="block truncate text-neutral-700">{option.opt_nm}</span>
            {option.count > 1 ? <span className="mt-1 inline-flex rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-neutral-600">x {option.count}</span> : null}
          </span>
          <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-neutral-700">
            +{formatPrice(option.opt_price * option.count)}원
          </span>
        </li>
      ))}
    </ul>
  );
}

export function CartList() {
  const router = useRouter();
  const mounted = useMounted();
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const clearCart = useCartStore((state) => state.clearCart);
  const decreaseItem = useCartStore((state) => state.decreaseItem);
  const getTotalPrice = useCartStore((state) => state.getTotalPrice);
  const increaseItem = useCartStore((state) => state.increaseItem);
  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const totalPrice = getTotalPrice();

  if (!mounted) {
    return (
      <section className="flex flex-1 flex-col px-4 py-6">
        <div className="rounded-3xl border border-neutral-200 bg-neutral-50 px-4 py-5">
          <div className="h-5 w-32 rounded-full bg-neutral-200" />
          <div className="mt-4 h-4 w-24 rounded-full bg-neutral-200" />
          <div className="mt-6 space-y-3">
            <div className="h-20 rounded-2xl bg-white" />
            <div className="h-20 rounded-2xl bg-white" />
          </div>
        </div>
      </section>
    );
  }

  function submitOrder() {
    setErrorMessage(null);

    startTransition(async () => {
      const result = await createOrderAction({
        items: items.map((item) => ({
          goods_no: item.goods_no,
          options: item.options.map((option) => ({
            count: option.count,
            opt_no: option.opt_no,
          })),
          quantity: item.quantity,
        })),
      });

      if (!result.ok || !result.orderNo) {
        setErrorMessage(result.message);
        return;
      }

      clearCart();
      router.push(`/order-complete?order_no=${encodeURIComponent(result.orderNo)}`);
    });
  }

  if (items.length === 0) {
    return (
      <section className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
        <div className="w-full rounded-3xl border border-dashed border-neutral-200 bg-neutral-50 px-5 py-10">
          <h2 className="text-lg font-semibold text-neutral-950">장바구니가 비어 있습니다</h2>
          <p className="mt-2 text-sm text-neutral-500">
            메뉴에서 상품과 옵션을 선택해 담아주세요.
          </p>
        </div>
        <Link
          href="/menu"
          className="mt-5 inline-flex min-h-12 items-center justify-center rounded-2xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition duration-200 ease-out active:scale-[0.98] active:bg-primary/90"
        >
          메뉴 보기
        </Link>
      </section>
    );
  }

  return (
    <>
      <section className="flex-1 divide-y divide-neutral-100 border-y border-neutral-100 bg-white">
        {items.map((item) => (
          <article key={item.id} className="px-4 py-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="truncate text-[15px] font-semibold text-neutral-950">
                  {item.goods_nm}
                </h2>
                <p className="mt-1 text-base font-bold text-neutral-950">
                  {formatPrice(item.unit_price)}원
                </p>
              </div>
              <button
                type="button"
                className="shrink-0 rounded-full bg-neutral-100 px-3 py-2 text-xs font-semibold text-neutral-500"
                onClick={() => removeItem(item.id)}
              >
                삭제
              </button>
            </div>

            <CartItemOptions item={item} />

            <div className="mt-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
              <button
                type="button"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-neutral-200 bg-white text-lg font-semibold text-primary transition duration-200 ease-out active:scale-[0.98] active:bg-primary-soft"
                onClick={() => decreaseItem(item.id)}
              >
                -
              </button>
                <span className="min-w-9 rounded-full bg-primary-soft px-3 py-2 text-center text-sm font-semibold text-primary">
                  {item.quantity}
                </span>
              <button
                type="button"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-neutral-200 bg-white text-lg font-semibold text-primary transition duration-200 ease-out active:scale-[0.98] active:bg-primary-soft"
                onClick={() => increaseItem(item.id)}
              >
                +
                </button>
              </div>
              <p className="text-lg font-bold text-neutral-950">
                {formatPrice(item.unit_price * item.quantity)}원
              </p>
            </div>
          </article>
        ))}
      </section>

      <footer className="sticky bottom-0 border-t border-neutral-100 bg-white/95 p-4 backdrop-blur">
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm font-semibold text-neutral-500">총 금액</span>
          <span className="text-2xl font-bold text-neutral-950">{formatPrice(totalPrice)}원</span>
        </div>
        {errorMessage ? (
          <p className="mt-3 rounded-2xl bg-red-50 px-3 py-3 text-sm text-red-700">
            {errorMessage}
          </p>
        ) : null}
        <button
          type="button"
          className="mt-3 w-full rounded-2xl bg-primary px-4 py-4 text-base font-semibold text-primary-foreground transition duration-200 ease-out active:scale-[0.99] active:bg-primary/90 disabled:cursor-not-allowed disabled:bg-neutral-300"
          disabled={isPending}
          onClick={submitOrder}
        >
          {isPending ? "주문 생성 중" : "주문하기"}
        </button>
      </footer>
    </>
  );
}
