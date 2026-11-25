"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ZoomIn, X, Calendar, MapPin } from "lucide-react";
import { CONFERENCE_CONFIG } from "@/lib/config";

export function FlyerPreviewCard() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  return (
    <>
      {/* Card de Visualização do Flyer na Página Inicial */}
      <div className="relative group bg-[#F1F5F9] rounded-3xl p-3.5 border border-slate-300/80 shadow-xl shadow-slate-900/5 hover:shadow-slate-900/10 transition-all duration-300">
        <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden bg-slate-900">
          <Image
            src="/images/flyer-oficial.jpg"
            alt={`Flyer Oficial da ${CONFERENCE_CONFIG.name} (${CONFERENCE_CONFIG.dateRange})`}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 400px"
            className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
          />

          {/* Gradiente sobreposto para legibilidade de etiquetas */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/20 pointer-events-none" />

          {/* Botão Hover/Focus de Zoom */}
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            aria-label="Ampliar Flyer Oficial da Conferência"
            className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity bg-emerald-950/40 backdrop-blur-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#F1F5F9]/95 text-emerald-950 text-xs font-bold shadow-lg transform -translate-y-2 group-hover:translate-y-0 transition-transform">
              <ZoomIn className="w-4 h-4 text-emerald-700" aria-hidden="true" />
              Ampliar Flyer Oficial
            </span>
          </button>

          {/* Badge superior com a Data */}
          <div className="absolute top-3 right-3 pointer-events-none">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-orange-600 text-white shadow-md">
              {CONFERENCE_CONFIG.shortDateBadge}
            </span>
          </div>

          {/* Resumo inferior */}
          <div className="absolute bottom-3 left-3 right-3 text-white pointer-events-none space-y-1">
            <p className="text-xs font-bold text-orange-300 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-orange-400 shrink-0" aria-hidden="true" />
              {CONFERENCE_CONFIG.venue}
            </p>
            <p className="text-xs font-bold leading-tight line-clamp-1">
              {CONFERENCE_CONFIG.editionLabel}
            </p>
          </div>
        </div>

        <div className="mt-3 px-1.5 flex items-center justify-between text-xs text-slate-600">
          <span className="font-semibold text-emerald-900">Cartaz Oficial do Evento</span>
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 hover:underline"
          >
            Ver Detalhes
          </button>
        </div>
      </div>

      {/* Modal / Lightbox do Flyer em Alta Definição */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Flyer Oficial da Conferência em Alta Definição"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="relative max-w-2xl w-full max-h-[92vh] flex flex-col bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabeçalho do Modal */}
            <div className="p-4 bg-slate-900/90 border-b border-white/10 flex items-center justify-between text-white">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    Flyer Oficial da Conferência
                  </h3>
                  <p className="text-xs text-slate-400">
                    {CONFERENCE_CONFIG.orgAcronym} — {CONFERENCE_CONFIG.churchName}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Fechar visualização do flyer"
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Imagem do Flyer Completo com Scroll se necessário */}
            <div className="flex-1 overflow-auto p-2 sm:p-4 flex items-center justify-center bg-black/40">
              <div className="relative w-full max-w-lg aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl">
                <Image
                  src="/images/flyer-oficial.jpg"
                  alt={`Flyer Oficial da ${CONFERENCE_CONFIG.editionLabel}`}
                  fill
                  sizes="(max-width: 768px) 100vw, 600px"
                  className="object-contain"
                  priority
                />
              </div>
            </div>

            {/* Rodapé do Modal */}
            <div className="p-3.5 bg-slate-900/90 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300">
              <span className="text-xs text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-orange-400" aria-hidden="true" />
                {CONFERENCE_CONFIG.dateRange} • Luanda
              </span>

              <a
                href="/images/flyer-oficial.jpg"
                download="Flyer-Oficial-CDJ-Luanda-2027.jpg"
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors"
              >
                Descarregar Imagem
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
