"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import {
  Search,
  X,
  Loader2,
  Filter,
  CheckCircle2,
  UserCheck,
  Clock,
} from "lucide-react";
import { CONFERENCE_CONFIG } from "@/lib/config";

interface AccreditationSearchInputProps {
  currentQuery: string;
  currentFilter: string;
}

export function AccreditationSearchInput({
  currentQuery,
  currentFilter,
}: AccreditationSearchInputProps) {
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
      router.push(`/admin/credenciamento?${params.toString()}`);
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
      {/* Caixa de Pesquisa Principal */}
      <form onSubmit={handleSubmit} className="relative flex items-center" role="search">
        <div className="absolute left-4 text-slate-400 pointer-events-none">
          {isPending ? (
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" aria-hidden="true" />
          ) : (
            <Search className="w-5 h-5" aria-hidden="true" />
          )}
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          aria-label="Pesquisar participante por código, nome ou telefone"
          placeholder={`Pesquisar por Código (${CONFERENCE_CONFIG.codePrefix}-XXXXX), Nome Completo ou Telefone...`}
          className="w-full pl-12 pr-32 py-3.5 bg-[#F1F5F9] border border-slate-300 rounded-2xl text-xs sm:text-sm font-medium focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none shadow-sm transition"
        />

        <div className="absolute right-2 flex items-center gap-1">
          {searchTerm && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                handleSearch("", currentFilter);
              }}
              aria-label="Limpar pesquisa"
              className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/70 transition"
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

      {/* Abas de Filtro Operacional */}
      <div
        className="flex flex-wrap items-center gap-2 text-xs"
        role="group"
        aria-label="Filtrar por estado de credenciamento"
      >
        <span className="text-slate-500 font-medium flex items-center gap-1 text-xs mr-1">
          <Filter className="w-3.5 h-3.5" aria-hidden="true" />
          Filtro:
        </span>

        <button
          type="button"
          onClick={() => handleFilterClick("all")}
          aria-pressed={currentFilter === "all"}
          className={`px-3 py-1.5 rounded-xl font-semibold transition ${
            currentFilter === "all"
              ? "bg-slate-900 text-white shadow-sm"
              : "bg-[#F1F5F9] border border-slate-300 text-slate-700 hover:bg-slate-200/70"
          }`}
        >
          Todos os Registos
        </button>

        <button
          type="button"
          onClick={() => handleFilterClick("eligible")}
          aria-pressed={currentFilter === "eligible"}
          className={`px-3 py-1.5 rounded-xl font-semibold transition inline-flex items-center gap-1.5 ${
            currentFilter === "eligible"
              ? "bg-emerald-600 text-white shadow-sm"
              : "bg-[#F1F5F9] border border-emerald-300 text-emerald-800 hover:bg-emerald-50"
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          Prontos para Credenciar (Aprovados)
        </button>

        <button
          type="button"
          onClick={() => handleFilterClick("credentialed")}
          aria-pressed={currentFilter === "credentialed"}
          className={`px-3 py-1.5 rounded-xl font-semibold transition inline-flex items-center gap-1.5 ${
            currentFilter === "credentialed"
              ? "bg-blue-600 text-white shadow-sm"
              : "bg-[#F1F5F9] border border-blue-300 text-blue-800 hover:bg-blue-50"
          }`}
        >
          <UserCheck className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          Já Credenciados
        </button>

        <button
          type="button"
          onClick={() => handleFilterClick("pending")}
          aria-pressed={currentFilter === "pending"}
          className={`px-3 py-1.5 rounded-xl font-semibold transition inline-flex items-center gap-1.5 ${
            currentFilter === "pending"
              ? "bg-amber-600 text-white shadow-sm"
              : "bg-[#F1F5F9] border border-amber-300 text-amber-800 hover:bg-amber-50"
          }`}
        >
          <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          Validação Pendente
        </button>
      </div>
    </div>
  );
}
