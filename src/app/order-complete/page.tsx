import Link from "next/link";

type OrderCompletePageProps = {
  searchParams: Promise<{
    order_no?: string;
  }>;
};

export default async function OrderCompletePage({ searchParams }: OrderCompletePageProps) {
  const { order_no } = await searchParams;

  return (
    <main className="min-h-screen bg-neutral-50">
      <div className="mx-auto flex min-h-screen max-w-md flex-col bg-white px-4 py-10">
        <section className="flex flex-1 flex-col items-center justify-center text-center">
          <p className="text-sm font-semibold text-neutral-500">주문 접수</p>
          <h1 className="mt-2 text-2xl font-bold text-neutral-950">주문이 생성되었습니다</h1>
          <p className="mt-3 text-sm text-neutral-500">
            실제 결제 연동은 아직 연결하지 않았습니다.
          </p>

          <div className="mt-6 w-full rounded-md bg-neutral-50 p-5">
            <p className="text-xs font-semibold uppercase text-neutral-500">order_no</p>
            <p className="mt-2 font-mono text-xl font-bold text-neutral-950">{order_no ?? "-"}</p>
          </div>

          <Link
            href="/menu"
            className="mt-6 w-full rounded-md bg-neutral-950 px-4 py-3 text-sm font-semibold text-white"
          >
            메뉴로 돌아가기
          </Link>
        </section>
      </div>
    </main>
  );
}
