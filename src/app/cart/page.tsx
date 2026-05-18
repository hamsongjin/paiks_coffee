import Link from "next/link";

import { CartList } from "@/components/menu/cart-list";

export default function CartPage() {
  return (
    <main className="min-h-screen bg-neutral-50">
      <div className="mx-auto flex min-h-screen max-w-md flex-col bg-white">
        <header className="sticky top-0 z-10 border-b border-neutral-100 bg-white/95 px-4 py-4 backdrop-blur">
          <Link href="/menu" className="text-sm font-medium text-neutral-500">
            메뉴로 돌아가기
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-neutral-950">장바구니</h1>
        </header>

        <CartList />
      </div>
    </main>
  );
}
