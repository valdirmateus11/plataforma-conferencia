export default function AdminLoading() {
  return (
    <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="A carregar conteúdo">
      {/* Cabeçalho Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <div className="h-7 w-64 rounded-xl bg-slate-300/70" />
          <div className="h-4 w-96 max-w-full rounded-lg bg-slate-200" />
        </div>
        <div className="h-9 w-36 rounded-xl bg-slate-300/60" />
      </div>

      {/* Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-slate-300/80 bg-[#F1F5F9] p-5 space-y-3"
          >
            <div className="h-4 w-28 rounded bg-slate-200" />
            <div className="h-8 w-16 rounded bg-slate-300/80" />
            <div className="h-3 w-36 rounded bg-slate-200" />
          </div>
        ))}
      </div>

      {/* Tabela Skeleton */}
      <div className="rounded-2xl border border-slate-300/80 bg-[#F1F5F9] overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200">
          <div className="h-5 w-48 rounded bg-slate-300/70" />
        </div>
        <div className="p-5 space-y-3">
          {[1, 2, 3, 4, 5].map((row) => (
            <div key={row} className="h-12 w-full rounded-xl bg-slate-200/80" />
          ))}
        </div>
      </div>
    </div>
  );
}
