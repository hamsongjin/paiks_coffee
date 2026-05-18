import Link from "next/link";

type OrderCompletePageProps = {
  searchParams: Promise<{
    order_no?: string;
  }>;
};

export default async function OrderCompletePage({ searchParams }: OrderCompletePageProps) {
  const { order_no } = await searchParams;

  return (
    <main className="kiosk-page">
      <div className="kiosk-shell flex min-h-screen flex-col px-4 py-6">
        <section className="flex flex-1 flex-col items-center justify-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-primary text-primary-foreground">
            <span className="text-xl font-bold">OK</span>
          </div>
          <p className="mt-4 text-sm font-semibold text-neutral-500">주문 접수</p>
          <h1 className="mt-2 text-[28px] font-bold leading-tight text-neutral-950">
            주문이 생성되었습니다
          </h1>
          <p className="mt-3 text-sm text-neutral-500">
            실제 결제 연동은 아직 연결하지 않았습니다.
          </p>

          <div className="mt-6 w-full rounded-3xl border border-neutral-200 bg-neutral-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">order_no</p>
            <p className="mt-2 font-mono text-[22px] font-bold text-neutral-950">
              {order_no ?? "-"}
            </p>
            <p className="mt-2 text-sm text-neutral-500">주문 번호를 확인한 뒤 대기해주세요.</p>
          </div>

          <Link
            href="/menu"
            className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition duration-200 ease-out active:scale-[0.99] active:bg-primary/90"
          >
            메뉴로 돌아가기
          </Link>
        </section>
      </div>
    </main>
  );
}
