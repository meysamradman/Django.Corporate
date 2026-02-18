export default function PropertySearchPageFallback() {
  return (
    <div className="space-y-6">
      <div className="h-12 w-full rounded bg-gray" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <aside className="lg:col-span-4 space-y-3">
          <div className="rounded-md border bg-card p-3 space-y-3">
            <div className="h-4 w-24 rounded bg-gray" />
            <div className="h-9 w-full rounded bg-gray" />
            <div className="h-9 w-full rounded bg-gray" />
            <div className="h-9 w-full rounded bg-gray" />
          </div>
        </aside>

        <section className="lg:col-span-8 space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="overflow-hidden rounded-lg border bg-card">
                <div className="aspect-16/10 w-full bg-gray" />
                <div className="space-y-3 p-5">
                  <div className="h-4 w-24 rounded bg-gray" />
                  <div className="h-5 w-3/4 rounded bg-gray" />
                  <div className="h-4 w-full rounded bg-gray" />
                  <div className="h-4 w-5/6 rounded bg-gray" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}