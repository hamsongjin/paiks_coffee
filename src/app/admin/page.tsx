const adminSections = ["Products", "Categories", "Options", "Orders"];

export default function AdminPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-6 py-10">
      <div>
        <p className="text-sm font-medium text-neutral-500">Store Admin</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-normal text-neutral-950">
          Paik&apos;s Coffee Admin
        </h1>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {adminSections.map((section) => (
          <div key={section} className="rounded-lg border border-neutral-200 bg-white p-4">
            <h2 className="text-base font-medium text-neutral-950">{section}</h2>
            <p className="mt-2 text-sm text-neutral-500">MVP route placeholder</p>
          </div>
        ))}
      </section>
    </main>
  );
}
