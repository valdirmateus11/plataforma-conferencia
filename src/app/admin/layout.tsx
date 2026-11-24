import Link from "next/link";
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
} from "lucide-react";
import { getCurrentAdmin, signOutAdmin } from "@/features/administration/actions/auth-actions";
import { ConferenceLogo } from "@/components/ui/conference-logo";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getCurrentAdmin();

  // Se não estiver autenticado e não estiver na rota de login, o middleware já redireciona,
  // mas aqui asseguramos a integridade a nível de Server Component
  if (!admin) {
    return <>{children}</>;
  }

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

  return (
    <div className="min-h-screen flex bg-slate-100">
      {/* Barra Lateral / Sidebar (Desktop) */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 border-r border-slate-800">
        {/* Logótipo e Nome Institucional */}
        <div className="p-4 border-b border-slate-800">
          <ConferenceLogo size="md" variant="dark" href="/admin/dashboard" />
        </div>

        {/* Navegação */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems
            .filter((item) => item.visible)
            .map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <Icon className="w-4 h-4 shrink-0 text-slate-400" />
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
            className="flex items-center justify-between px-3 py-2 rounded-xl text-[11px] text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5" />
              Ver Formulário Público
            </span>
          </Link>

          <div className="px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700/60">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <p className="text-xs font-semibold text-white truncate">
                {admin.displayName}
              </p>
            </div>
            <p className="text-[10px] text-slate-400 font-mono truncate mb-2">
              {admin.email}
            </p>
            <div className="flex flex-wrap gap-1">
              {admin.roles.map((r) => (
                <span
                  key={r}
                  className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-blue-900/60 text-blue-300 border border-blue-700/50"
                >
                  {r}
                </span>
              ))}
            </div>
          </div>

          <form action={signOutAdmin}>
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Terminar Sessão
            </button>
          </form>
        </div>
      </aside>

      {/* Conteúdo Principal da Área Administrativa */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <ConferenceLogo size="sm" showText={false} href="/admin/dashboard" />
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900">
                Conferência Distrital da Juventude de Luanda 2026
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                D.D.J.L
              </span>
            </div>
          </div>
        </header>

        <div className="flex-1 p-6 sm:p-8">{children}</div>
      </div>
    </div>
  );
}
