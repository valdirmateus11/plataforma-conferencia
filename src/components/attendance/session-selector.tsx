"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Calendar, Clock } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import type { SessionStatus } from "@/types/database.types";

interface SessionItem {
  id: string;
  name: string;
  session_date: string;
  starts_at: string | null;
  ends_at: string | null;
  status: SessionStatus;
}

interface SessionSelectorProps {
  sessions: SessionItem[];
  selectedSessionId: string | null;
}

export function SessionSelector({ sessions, selectedSessionId }: SessionSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleSelect(sessionId: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("session", sessionId);
    router.push(`/admin/presencas?${params.toString()}`);
  }

  if (sessions.length === 0) {
    return (
      <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
        <Clock className="w-4 h-4 shrink-0 text-amber-600" aria-hidden="true" />
        <span>Nenhuma sessão plenária disponível. Crie uma sessão no menu &ldquo;Gestão de Sessões&rdquo;.</span>
      </div>
    );
  }

  return (
    <div className="bg-[#F1F5F9] rounded-2xl border border-slate-300/80 p-4 shadow-sm space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-blue-600" aria-hidden="true" />
          Selecione a Sessão de Trabalho / Plenária:
        </span>
        <span className="text-xs text-slate-500">
          As presenças são contabilizadas por sessão individual
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {sessions.map((s) => {
          const isSelected = s.id === selectedSessionId;

          return (
            <button
              key={s.id}
              type="button"
              onClick={() => handleSelect(s.id)}
              aria-pressed={isSelected}
              className={`p-3 rounded-xl border text-left transition flex flex-col justify-between gap-2 ${
                isSelected
                  ? "border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/20"
                  : "border-slate-300 bg-[#F1F5F9] hover:bg-slate-200/60"
              }`}
            >
              <div className="w-full">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <StatusBadge status={s.status} />

                  <span className="text-xs text-slate-500 font-mono">
                    {new Date(s.session_date).toLocaleDateString("pt-PT", {
                      day: "2-digit",
                      month: "2-digit",
                    })}
                  </span>
                </div>

                <div className="font-bold text-slate-900 text-xs line-clamp-1">{s.name}</div>
              </div>

              {s.starts_at && (
                <div className="text-xs text-slate-500 font-mono">
                  Horário: {s.starts_at.substring(0, 5)} {s.ends_at ? `- ${s.ends_at.substring(0, 5)}` : ""}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
