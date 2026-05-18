import Link from "next/link";

import { CartList } from "@/components/menu/cart-list";

export default function CartPage() {
  return (
    <main className="kiosk-page">
      <div className="kiosk-shell flex min-h-screen flex-col">
        <header className="sticky top-0 z-10 border-b border-neutral-100 bg-white/95 px-4 py-4 backdrop-blur">
          <Link href="/menu" className="text-sm font-medium text-primary">
            메뉴로 돌아가기
          </Link>
          <h1 className="mt-2 text-[28px] font-bold leading-tight text-neutral-950">장바구니</h1>
          <p className="mt-1 text-sm text-neutral-500">선택한 상품을 확인하고 주문을 완료합니다.</p>
        </header>

        <CartList />
      </div>
    </main>
  );
}
