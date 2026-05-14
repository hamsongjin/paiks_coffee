const rows = Array.from({ length: 4 }, (_, index) => index);

export default function AdminProductDetailLoading() {
  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10">
      <div className="h-4 w-28 rounded bg-neutral-100" />

      <header>
        <div className="h-4 w-20 rounded bg-neutral-200" />
        <div className="mt-3 h-8 w-56 rounded bg-neutral-200" />
        <div className="mt-3 h-4 w-40 rounded bg-neutral-100" />
      </header>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(420px,1.3fr)]">
        <div className="flex flex-col gap-6">
          <div className="rounded-lg border border-neutral-200 bg-white p-5">
            <div className="h-5 w-16 rounded bg-neutral-200" />
            <div className="mt-4 h-80 w-full rounded-lg bg-neutral-100" />
          </div>

          <div className="rounded-lg border border-neutral-200 bg-white p-5">
            <div className="h-5 w-16 rounded bg-neutral-200" />
            <div className="mt-4 space-y-4">
              {rows.map((row) => (
                <div key={row} className="grid gap-2 sm:grid-cols-3">
                  <div className="h-4 w-20 rounded bg-neutral-100" />
                  <div className="h-4 w-32 rounded bg-neutral-100 sm:col-span-2" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
          <div className="border-b border-neutral-200 px-5 py-4">
            <div className="h-5 w-44 rounded bg-neutral-200" />
            <div className="mt-2 h-4 w-20 rounded bg-neutral-100" />
          </div>
          <div className="p-5">
            <div className="h-28 rounded bg-neutral-100" />
          </div>
        </div>
      </section>
    </main>
  );
}
