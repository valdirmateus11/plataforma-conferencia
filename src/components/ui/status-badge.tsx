import type { LucideIcon } from "lucide-react";
import {
  Clock,
  CheckCircle2,
  XCircle,
  Ban,
  Play,
  Lock,
  UserCheck,
  ShieldAlert,
  MinusCircle,
} from "lucide-react";

export type AppStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "cancelled"
  | "present"
  | "absent"
  | "voided"
  | "planned"
  | "open"
  | "closed"
  | "credentialed"
  | "revoked"
  | "active"
  | "inactive";

export interface StatusConfigItem {
  label: string;
  classes: string;
  icon: LucideIcon;
  iconClass: string;
}

export const STATUS_CONFIG: Record<AppStatus, StatusConfigItem> = {
  pending: {
    label: "Pendente",
    classes: "bg-amber-50 text-amber-800 border-amber-200",
    icon: Clock,
    iconClass: "text-amber-600",
  },
  approved: {
    label: "Aprovada",
    classes: "bg-emerald-50 text-emerald-800 border-emerald-200",
    icon: CheckCircle2,
    iconClass: "text-emerald-600",
  },
  rejected: {
    label: "Rejeitada",
    classes: "bg-rose-50 text-rose-800 border-rose-200",
    icon: XCircle,
    iconClass: "text-rose-600",
  },
  cancelled: {
    label: "Cancelada",
    classes: "bg-slate-200/70 text-slate-700 border-slate-300",
    icon: Ban,
    iconClass: "text-slate-500",
  },
  present: {
    label: "Presente",
    classes: "bg-emerald-50 text-emerald-800 border-emerald-200",
    icon: CheckCircle2,
    iconClass: "text-emerald-600",
  },
  absent: {
    label: "Ausente",
    classes: "bg-slate-200/70 text-slate-700 border-slate-300",
    icon: MinusCircle,
    iconClass: "text-slate-500",
  },
  voided: {
    label: "Anulada",
    classes: "bg-rose-50 text-rose-800 border-rose-200",
    icon: Ban,
    iconClass: "text-rose-600",
  },
  planned: {
    label: "Planeada",
    classes: "bg-blue-50 text-blue-800 border-blue-200",
    icon: Clock,
    iconClass: "text-blue-600",
  },
  open: {
    label: "Aberta",
    classes: "bg-emerald-50 text-emerald-800 border-emerald-200",
    icon: Play,
    iconClass: "text-emerald-600",
  },
  closed: {
    label: "Encerrada",
    classes: "bg-slate-200/70 text-slate-700 border-slate-300",
    icon: Lock,
    iconClass: "text-slate-500",
  },
  credentialed: {
    label: "Credenciado",
    classes: "bg-emerald-50 text-emerald-800 border-emerald-200",
    icon: UserCheck,
    iconClass: "text-emerald-600",
  },
  revoked: {
    label: "Revogado",
    classes: "bg-rose-50 text-rose-800 border-rose-200",
    icon: ShieldAlert,
    iconClass: "text-rose-600",
  },
  active: {
    label: "Ativo",
    classes: "bg-emerald-50 text-emerald-800 border-emerald-200",
    icon: CheckCircle2,
    iconClass: "text-emerald-600",
  },
  inactive: {
    label: "Inativo",
    classes: "bg-slate-200/70 text-slate-700 border-slate-300",
    icon: Ban,
    iconClass: "text-slate-500",
  },
};

export function getStatusConfig(status: string): StatusConfigItem {
  if (status in STATUS_CONFIG) {
    return STATUS_CONFIG[status as AppStatus];
  }
  return {
    label: status,
    classes: "bg-slate-200/70 text-slate-700 border-slate-300",
    icon: Clock,
    iconClass: "text-slate-500",
  };
}

interface StatusBadgeProps {
  status: string;
  label?: string;
  size?: "sm" | "md";
  showIcon?: boolean;
  className?: string;
}

export function StatusBadge({
  status,
  label,
  size = "sm",
  showIcon = true,
  className = "",
}: StatusBadgeProps) {
  const cfg = getStatusConfig(status);
  const Icon = cfg.icon;

  const sizeClass =
    size === "md" ? "px-3 py-1 text-xs" : "px-2.5 py-0.5 text-xs";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold border whitespace-nowrap ${sizeClass} ${cfg.classes} ${className}`}
    >
      {showIcon && <Icon className={`w-3.5 h-3.5 shrink-0 ${cfg.iconClass}`} aria-hidden="true" />}
      <span>{label || cfg.label}</span>
    </span>
  );
}
