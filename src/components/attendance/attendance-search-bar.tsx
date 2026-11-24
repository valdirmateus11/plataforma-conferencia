"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Search, X, Loader2, Filter } from "lucide-react";

interface AttendanceSearchBarProps {
  currentQuery: string;
  currentFilter: string;
}

export function AttendanceSearchBar({ currentQuery, currentFilter }: AttendanceSearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(currentQuery);
  const [isPending, startTransition] = useTransition();

  function handleSearch(term: string, filter: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (term.trim()) {
      params.set("q", term.trim());
    } else {
      params.delete("q");
    }

    if (filter && filter !== "all") {
      params.set("filter", filter);
    } else {
      params.delete("filter");
    }

    startTransition(() => {
      router.push(`/admin/presencas?${params.toString()}`);
    });
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    handleSearch(searchTerm, currentFilter);
  }

  function handleFilterClick(newFilter: string) {
    handleSearch(searchTerm, newFilter);
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <div className="absolute left-4 text-slate-400">
          {isPending ? (
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
          ) : (
            <Search className="w-5 h-5" />
          )}
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Pesquisar por Código (CDJ26-XXXXX), Nome Completo ou Telefone..."
          className="w-full pl-12 pr-28 py-3.5 bg-white border border-slate-300 rounded-2xl text-xs sm:text-sm font-medium focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none shadow-sm transition"
        />

        <div className="absolute right-2 flex items-center gap-1">
          {searchTerm && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                handleSearch("", currentFilter);
              }}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              title="Limpar pesquisa"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl text-xs shadow-sm transition"
          >
            Pesquisar
          </button>
        </div>
      </form>

      {/* Abas de Filtro da Sessão */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-slate-400 font-medium flex items-center gap-1 text-[11px] mr-1">
          <Filter className="w-3.5 h-3.5" />
          Filtro:
        </span>

        <button
          type="button"
          onClick={() => handleFilterClick("all")}
          className={`px-3 py-1.5 rounded-xl font-semibold transition ${
            currentFilter === "all"
              ? "bg-slate-900 text-white shadow-sm"
              : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
          }`}
        >
          Todos os Credenciados
        </button>

        <button
          type="button"
          onClick={() => handleFilterClick("present")}
          className={`px-3 py-1.5 rounded-xl font-semibold transition flex items-center gap-1.5 ${
            currentFilter === "present"
              ? "bg-emerald-600 text-white shadow-sm"
              : "bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50"
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          🟢 Presentes nesta Sessão
        </button>

        <button
          type="button"
          onClick={() => handleFilterClick("absent")}
          className={`px-3 py-1.5 rounded-xl font-semibold transition flex items-center gap-1.5 ${
            currentFilter === "absent"
              ? "bg-slate-600 text-white shadow-sm"
              : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-slate-400" />
          ⚪ Ausentes nesta Sessão
        </button>
      </div>
    </div>
  );
}
