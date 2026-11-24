"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Eye } from "lucide-react";

interface AuditJsonViewerProps {
  beforeData: unknown;
  afterData: unknown;
}

export function AuditJsonViewer({ beforeData, afterData }: AuditJsonViewerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const hasBefore = Boolean(beforeData && typeof beforeData === "object" && Object.keys(beforeData as object).length > 0);
  const hasAfter = Boolean(afterData && typeof afterData === "object" && Object.keys(afterData as object).length > 0);

  if (!hasBefore && !hasAfter) {
    return <span className="text-slate-400 text-[11px] italic">Sem payload</span>;
  }

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 transition"
      >
        <Eye className="w-3 h-3" />
        {isOpen ? "Recolher JSON" : "Ver Detalhes"}
        {isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
      </button>

      {isOpen && (
        <div className="mt-2 p-3 rounded-xl bg-slate-900 text-slate-100 text-[11px] font-mono space-y-2 max-w-xl overflow-x-auto shadow-inner">
          {hasBefore && (
            <div>
              <div className="text-rose-400 font-bold mb-1 border-b border-slate-800 pb-0.5">
                ● Estado Anterior (Before):
              </div>
              <pre className="text-rose-200/90 whitespace-pre-wrap">
                {String(JSON.stringify(beforeData, null, 2))}
              </pre>
            </div>
          )}

          {hasAfter && (
            <div>
              <div className="text-emerald-400 font-bold mb-1 border-b border-slate-800 pb-0.5">
                ● Novo Estado (After):
              </div>
              <pre className="text-emerald-200/90 whitespace-pre-wrap">
                {String(JSON.stringify(afterData, null, 2))}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
