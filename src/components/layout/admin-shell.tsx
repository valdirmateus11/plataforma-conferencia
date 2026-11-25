"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Church,
  Calendar,
  UserCheck,
  ClipboardList,
  FileSpreadsheet,
  UserCog,
  Settings,
  History,
  LogOut,
  Shield,
  ExternalLink,
  Menu,
  X,
} from "lucide-react";
import type { AdminUserSession } from "@/features/administration/actions/auth-actions";
import { signOutAdmin } from "@/features/administration/actions/auth-actions";
import { ConferenceLogo } from "@/components/ui/conference-logo";
import { CONFERENCE_CONFIG } from "@/lib/config";

interface AdminShellProps {
  admin: AdminUserSession;
  children: React.ReactNode;
}

export function AdminShell({ admin, children }: AdminShellProps) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Fecha o drawer automaticamente ao navegar no mobile
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  // Fecha o drawer com a tecla Escape
  useEffect(() => {
    if (!isSidebarOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setIsSidebarOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isSidebarOpen]);

  const navItems = [
    {
      label: "Painel Geral",
      href: "/admin/dashboard",
      icon: LayoutDashboard,
      visible: true,
    },
    {
      label: "Inscrições",
      href: "/admin/inscricoes",
      icon: Users,
      visible:
        admin.isSuperAdmin ||
        admin.roles.includes("validator") ||
        admin.roles.includes("registration_admin") ||
        admin.roles.includes("consultant"),
    },
    {
      label: "Organizações / Igrejas",
      href: "/admin/organizacoes",
      icon: Church,
      visible:
        admin.isSuperAdmin ||
        admin.roles.includes("registration_admin") ||
        admin.roles.includes("consultant"),
    },
    {
      label: "Credenciamento",
      href: "/admin/credenciamento",
      icon: UserCheck,
      visible:
        admin.isSuperAdmin ||
        admin.roles.includes("accreditation_operator") ||
        admin.roles.includes("consultant"),
    },
    {
      label: "Sessões & Presenças",
      href: "/admin/presencas",
      icon: ClipboardList,
      visible:
        admin.isSuperAdmin ||
        admin.roles.includes("attendance_operator") ||
        admin.roles.includes("consultant"),
    },
    {
      label: "Gestão de Sessões",
      href: "/admin/sessoes",
      icon: Calendar,
      visible: admin.isSuperAdmin,
    },
    {
      label: "Relatórios & Exportação",
      href: "/admin/relatorios",
      icon: FileSpreadsheet,
      visible: true,
    },
    {
      label: "Gestão de Utilizadores",
      href: "/admin/utilizadores",
      icon: UserCog,
      visible: admin.isSuperAdmin,
    },
    {
      label: "Configurações",
      href: "/admin/configuracoes",
      icon: Settings,
      visible: admin.isSuperAdmin,
    },
    {
      label: "Trilha de Auditoria",
      href: "/admin/auditoria",
      icon: History,
      visible: admin.isSuperAdmin,
    },
  ];

  function isRouteActive(href: string): boolean {
    if (pathname === href) return true;
    if (href === "/admin/dashboard") return pathname === "/admin";
    return pathname.startsWith(`${href}/`);
  }

  const sidebarContent = (
    <>
      {/* Logótipo e Nome Institucional */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-2">
        <ConferenceLogo size="md" variant="dark" href="/admin/dashboard" />
        <button
          type="button"
          onClick={() => setIsSidebarOpen(false)}
          className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label="Fechar menu de navegação"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navegação */}
      <nav aria-label="Menu administrativo" className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems
          .filter((item) => item.visible)
          .map((item) => {
            const Icon = item.icon;
            const active = isRouteActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                  active
                    ? "bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 font-semibold"
                    : "text-slate-300 hover:text-white hover:bg-slate-800 border border-transparent"
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    active ? "text-emerald-400" : "text-slate-400"
                  }`}
                  aria-hidden="true"
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
      </nav>

      {/* Rodapé da Sidebar */}
      <div className="p-3 border-t border-slate-800 space-y-2">
        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between px-3 py-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-slate-800/70 transition-colors"
        >
          <span className="flex items-center gap-2">
            <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
            Ver Formulário Público
          </span>
        </Link>

        <div className="px-3 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-3.5 h-3.5 text-blue-400 shrink-0" aria-hidden="true" />
            <p className="text-xs font-semibold text-white truncate">
              {admin.displayName}
            </p>
          </div>
          <p className="text-xs text-slate-400 font-mono truncate mb-2">
            {admin.email}
          </p>
          <div className="flex flex-wrap gap-1">
            {admin.roles.map((r) => (
              <span
                key={r}
                className="px-1.5 py-0.5 rounded text-[11px] font-semibold bg-blue-900/60 text-blue-200 border border-blue-700/50"
              >
                {r}
              </span>
            ))}
          </div>
        </div>

        <form action={signOutAdmin}>
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
            Terminar Sessão
          </button>
        </form>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex bg-[#F1F5F9]">
      {/* Overlay Mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Drawer Mobile */}
      <aside
        aria-label="Navegação lateral móvel"
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 shadow-2xl transform transition-transform duration-200 ease-out lg:hidden ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Sidebar Fixa (Desktop >= lg) */}
      <aside
        aria-label="Navegação lateral"
        className="hidden lg:flex w-64 bg-slate-900 text-slate-300 flex-col shrink-0 border-r border-slate-800 sticky top-0 h-screen"
      >
        {sidebarContent}
      </aside>

      {/* Conteúdo Principal da Área Administrativa */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-[#F1F5F9]/95 backdrop-blur-md border-b border-slate-300/80 px-4 sm:px-6 py-3 flex items-center justify-between gap-3 sticky top-0 z-30">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Abrir menu de navegação"
              aria-expanded={isSidebarOpen}
              className="lg:hidden p-2 -ml-1 rounded-xl border border-slate-300 bg-[#F1F5F9] text-slate-700 hover:bg-slate-200 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>

            <ConferenceLogo size="sm" showText={false} href="/admin/dashboard" />

            <div className="flex items-center gap-2 min-w-0 text-xs">
              <span className="font-bold text-slate-900 truncate">
                {CONFERENCE_CONFIG.shortName}
              </span>
              <span className="hidden sm:inline text-slate-400">•</span>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0">
                {CONFERENCE_CONFIG.orgAcronym}
              </span>
            </div>
          </div>

          <span className="hidden md:inline-flex items-center text-xs font-semibold text-slate-600 shrink-0">
            {CONFERENCE_CONFIG.dateRange}
          </span>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">{children}</main>
      </div>
    </div>
  );
}
