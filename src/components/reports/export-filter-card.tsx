"use client";

import { useState } from "react";
import { Download, FileSpreadsheet } from "lucide-react";
import {
  LUANDA_MUNICIPALITIES,
  INTENDENCIAS,
  PARTICIPANT_CATEGORIES,
} from "@/lib/constants/conference-data";

interface SessionOption {
  id: string;
  name: string;
}

interface ExportFilterCardProps {
  sessions: SessionOption[];
}

export function ExportFilterCard({ sessions }: ExportFilterCardProps) {
  const [status, setStatus] = useState("all");
  const [district, setDistrict] = useState("all");
  const [municipality, setMunicipality] = useState("all");
  const [category, setCategory] = useState("all");
  const [selectedSession, setSelectedSession] = useState("all");

  function handleExportRegistrations() {
    const params = new URLSearchParams();
    if (status !== "all") params.set("status", status);
    if (district !== "all") params.set("district", district);
    if (municipality !== "all") params.set("municipality", municipality);
    if (category !== "all") params.set("category", category);

    window.location.href = `/api/export/inscricoes?${params.toString()}`;
  }

  function handleExportAttendance() {
    const params = new URLSearchParams();
    if (selectedSession !== "all") params.set("session", selectedSession);

    window.location.href = `/api/export/presencas?${params.toString()}`;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 1. Exportação de Inscrições com Filtros */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
          <div>
            <h3 className="text-sm font-bold text-slate-900">Exportar Inscrições (CSV / Excel)</h3>
            <p className="text-xs text-slate-500">
              Descarregue a base de delegados com filtros personalizados e blindagem contra injeção de fórmulas.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Estado</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-2 text-xs bg-white focus:border-blue-500 focus:outline-none"
            >
              <option value="all">Todos os Estados</option>
              <option value="approved">Apenas Aprovadas</option>
              <option value="pending">Apenas Pendentes</option>
              <option value="rejected">Apenas Rejeitadas</option>
              <option value="cancelled">Apenas Canceladas</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Intendência</label>
            <select
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-2 text-xs bg-white focus:border-blue-500 focus:outline-none"
            >
              <option value="all">Todas as Intendências</option>
              {INTENDENCIAS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Município</label>
            <select
              value={municipality}
              onChange={(e) => setMunicipality(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-2 text-xs bg-white focus:border-blue-500 focus:outline-none"
            >
              <option value="all">Todos os Municípios</option>
              {LUANDA_MUNICIPALITIES.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Categoria</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-2 text-xs bg-white focus:border-blue-500 focus:outline-none"
            >
              <option value="all">Todas as Categorias</option>
              {PARTICIPANT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleExportRegistrations}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
        >
          <Download className="w-4 h-4" />
          Descarregar CSV de Inscrições Filtradas
        </button>
      </div>

      {/* 2. Exportação de Presenças por Sessão */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <FileSpreadsheet className="w-5 h-5 text-blue-600" />
          <div>
            <h3 className="text-sm font-bold text-slate-900">Exportar Presenças por Sessão</h3>
            <p className="text-xs text-slate-500">
              Descarregue os registos nominais de assiduidade por plenária para consolidação de quórum.
            </p>
          </div>
        </div>

        <div className="text-xs space-y-2">
          <label className="block font-semibold text-slate-700">Selecione a Sessão Plenária</label>
          <select
            value={selectedSession}
            onChange={(e) => setSelectedSession(e.target.value)}
            className="w-full rounded-xl border border-slate-300 p-2.5 text-xs bg-white focus:border-blue-500 focus:outline-none"
          >
            <option value="all">Todas as Sessões (Visão Consolidada)</option>
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div className="pt-8">
          <button
            onClick={handleExportAttendance}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
          >
            <Download className="w-4 h-4" />
            Descarregar CSV de Presenças
          </button>
        </div>
      </div>
    </div>
  );
}
