"use client";

import { useState } from "react";
import Image from "next/image";
import { ZoomIn, X, Calendar, MapPin } from "lucide-react";

export function FlyerPreviewCard() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Card de Visualização do Flyer na Página Inicial */}
      <div className="relative group bg-[#F1F5F9] rounded-3xl p-3.5 border border-slate-300/80 shadow-xl shadow-slate-900/5 hover:shadow-slate-900/10 transition-all duration-300">
        <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden bg-slate-900 cursor-pointer">
          <Image
            src="/images/flyer-oficial.jpg"
            alt="Flyer Oficial da III Sessão Bienal da Conferência Distrital da Juventude de Luanda 2026"
            fill
            priority
            sizes="(max-width: 768px) 100vw, 400px"
            className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
            onClick={() => setIsOpen(true)}
          />

          {/* Gradiente sobreposto para legibilidade de etiquetas */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20 pointer-events-none" />

          {/* Botão Hover de Zoom */}
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-emerald-950/40 backdrop-blur-xs"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#F1F5F9]/95 text-emerald-950 text-xs font-bold shadow-lg transform -translate-y-2 group-hover:translate-y-0 transition-transform">
              <ZoomIn className="w-4 h-4 text-emerald-700" />
              Ampliar Flyer Oficial
            </span>
          </button>

          {/* Badge superior com a Data */}
          <div className="absolute top-3 right-3 pointer-events-none">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-black bg-orange-600 text-white shadow-md">
              21-24 JAN 2027
            </span>
          </div>

          {/* Resumo inferior */}
          <div className="absolute bottom-3 left-3 right-3 text-white pointer-events-none space-y-1">
            <p className="text-[11px] font-bold text-orange-300 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-orange-400" />
              Cargo Pastoral Monte Sinai
            </p>
            <p className="text-xs font-bold leading-tight line-clamp-1">
              III Sessão Bienal Ordinária
            </p>
          </div>
        </div>

        <div className="mt-3 px-1.5 flex items-center justify-between text-xs text-slate-600">
          <span className="font-semibold text-emerald-900">Cartaz Oficial do Evento</span>
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 hover:underline"
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
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="relative max-w-2xl w-full max-h-[92vh] flex flex-col bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabeçalho do Modal */}
            <div className="p-4 bg-slate-900/90 border-b border-white/10 flex items-center justify-between text-white">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    Flyer Oficial da Conferência
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    D.D.J.L — Igreja Metodista Unida
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                title="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Imagem do Flyer Completo com Scroll se necessário */}
            <div className="flex-1 overflow-auto p-2 sm:p-4 flex items-center justify-center bg-black/40">
              <div className="relative w-full max-w-lg aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl">
                <Image
                  src="/images/flyer-oficial.jpg"
                  alt="Flyer Oficial da III Sessão Bienal"
                  fill
                  sizes="(max-width: 768px) 100vw, 600px"
                  className="object-contain"
                  priority
                />
              </div>
            </div>

            {/* Rodapé do Modal */}
            <div className="p-3.5 bg-slate-900/90 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300">
              <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-orange-400" />
                21 a 24 de Janeiro de 2027 • Luanda
              </span>

              <a
                href="/images/flyer-oficial.jpg"
                download="Flyer-Oficial-CDJ-Luanda-2027.jpg"
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition-colors"
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
