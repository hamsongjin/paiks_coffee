const tableRows = Array.from({ length: 6 }, (_, index) => index);

export default function AdminProductsLoading() {
  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10">
      <header>
        <div className="h-4 w-20 rounded bg-neutral-200" />
        <div className="mt-3 h-8 w-40 rounded bg-neutral-200" />
        <div className="mt-3 h-4 w-80 max-w-full rounded bg-neutral-100" />
      </header>

      <section className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
        <div className="border-b border-neutral-200 px-5 py-4">
          <div className="h-5 w-24 rounded bg-neutral-200" />
          <div className="mt-2 h-4 w-16 rounded bg-neutral-100" />
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200 text-sm">
            <thead className="bg-neutral-50 text-left text-xs font-semibold uppercase text-neutral-500">
              <tr>
                <th className="px-5 py-3">image</th>
                <th className="px-5 py-3">goods_no</th>
                <th className="px-5 py-3">goods_nm</th>
                <th className="px-5 py-3">goods_price</th>
                <th className="px-5 py-3">cate_cd</th>
                <th className="px-5 py-3">sold_out</th>
                <th className="px-5 py-3">visible</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {tableRows.map((row) => (
                <tr key={row}>
                  <td className="px-5 py-4">
                    <div className="h-14 w-14 rounded-md bg-neutral-100" />
                  </td>
                  <td className="px-5 py-4">
                    <div className="h-4 w-20 rounded bg-neutral-100" />
                  </td>
                  <td className="px-5 py-4">
                    <div className="h-4 w-32 rounded bg-neutral-100" />
                  </td>
                  <td className="px-5 py-4">
                    <div className="h-4 w-16 rounded bg-neutral-100" />
                  </td>
                  <td className="px-5 py-4">
                    <div className="h-4 w-12 rounded bg-neutral-100" />
                  </td>
                  <td className="px-5 py-4">
                    <div className="h-6 w-20 rounded-full bg-neutral-100" />
                  </td>
                  <td className="px-5 py-4">
                    <div className="h-6 w-20 rounded-full bg-neutral-100" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
