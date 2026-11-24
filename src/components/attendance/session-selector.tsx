"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Calendar, Play, Lock, Clock } from "lucide-react";
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
        <Clock className="w-4 h-4 shrink-0 text-amber-600" />
        <span>Nenhuma sessão plenária disponível. Crie uma sessão no menu &ldquo;Gestão de Sessões&rdquo;.</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-blue-600" />
          Selecione a Sessão de Trabalho / Plenária:
        </label>
        <span className="text-[11px] text-slate-400">
          As presenças são contabilizadas por sessão individual
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {sessions.map((s) => {
          const isSelected = s.id === selectedSessionId;
          const isOpen = s.status === "open";

          return (
            <button
              key={s.id}
              type="button"
              onClick={() => handleSelect(s.id)}
              className={`p-3 rounded-xl border text-left transition select-none flex flex-col justify-between gap-2 ${
                isSelected
                  ? "border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20"
                  : "border-slate-200 bg-white hover:bg-slate-50"
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  {isOpen ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      <Play className="w-2.5 h-2.5 fill-current" />
                      Aberta
                    </span>
                  ) : s.status === "closed" ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
                      <Lock className="w-2.5 h-2.5" />
                      Encerrada
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700">
                      Planeada
                    </span>
                  )}

                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(s.session_date).toLocaleDateString("pt-PT", {
                      day: "2-digit",
                      month: "2-digit",
                    })}
                  </span>
                </div>

                <div className="font-bold text-slate-900 text-xs line-clamp-1">{s.name}</div>
              </div>

              {s.starts_at && (
                <div className="text-[10px] text-slate-500 font-mono">
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
