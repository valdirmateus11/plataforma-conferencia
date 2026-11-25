export default function DashboardLoading() {
  return (
    <div className="space-y-8 animate-pulse" aria-busy="true" aria-label="A carregar painel geral">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <div className="h-7 w-56 rounded-xl bg-slate-300/70" />
          <div className="h-4 w-72 rounded-lg bg-slate-200" />
        </div>
        <div className="h-9 w-36 rounded-xl bg-slate-300/70" />
      </div>

      {/* Controlo de vagas skeleton */}
      <div className="rounded-2xl border border-slate-300/80 bg-[#F1F5F9] p-6 space-y-4">
        <div className="flex justify-between">
          <div className="h-5 w-52 rounded bg-slate-300/70" />
          <div className="h-4 w-36 rounded bg-slate-200" />
        </div>
        <div className="h-3 w-full rounded-full bg-slate-200" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-slate-200/80" />
          ))}
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 rounded-2xl border border-slate-300/80 bg-[#F1F5F9] p-5" />
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-2xl border border-slate-300/80 bg-[#F1F5F9] p-5" />
        ))}
      </div>

      <div className="h-72 rounded-2xl border border-slate-300/80 bg-[#F1F5F9] p-6" />
    </div>
  );
}
