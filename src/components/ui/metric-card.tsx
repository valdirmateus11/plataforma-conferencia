import type { ReactNode } from "react";

export type MetricTone = "default" | "success" | "warning" | "danger" | "info" | "purple";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  tone?: MetricTone;
  mono?: boolean;
  className?: string;
}

const TONE_STYLES: Record<
  MetricTone,
  { card: string; title: string; value: string; subtitle: string }
> = {
  default: {
    card: "bg-[#F1F5F9] border-slate-300/80",
    title: "text-slate-600",
    value: "text-slate-900",
    subtitle: "text-slate-500",
  },
  success: {
    card: "bg-[#F1F5F9] border-emerald-300/80",
    title: "text-emerald-800",
    value: "text-emerald-700",
    subtitle: "text-emerald-700/80",
  },
  warning: {
    card: "bg-[#F1F5F9] border-amber-300/80",
    title: "text-amber-800",
    value: "text-amber-700",
    subtitle: "text-amber-800/80",
  },
  danger: {
    card: "bg-[#F1F5F9] border-rose-300/80",
    title: "text-rose-800",
    value: "text-rose-700",
    subtitle: "text-rose-700/80",
  },
  info: {
    card: "bg-[#F1F5F9] border-blue-300/80",
    title: "text-blue-800",
    value: "text-blue-700",
    subtitle: "text-blue-700/80",
  },
  purple: {
    card: "bg-[#F1F5F9] border-purple-300/80",
    title: "text-purple-800",
    value: "text-purple-700",
    subtitle: "text-purple-700/80",
  },
};

export function MetricCard({
  title,
  value,
  subtitle,
  icon,
  tone = "default",
  mono = false,
  className = "",
}: MetricCardProps) {
  const styles = TONE_STYLES[tone];

  return (
    <div
      className={`rounded-2xl border p-5 shadow-sm space-y-2 ${styles.card} ${className}`}
    >
      <div className={`flex items-center justify-between gap-2 text-xs font-semibold ${styles.title}`}>
        <span>{title}</span>
        {icon && <span className="shrink-0" aria-hidden="true">{icon}</span>}
      </div>
      <p
        className={`text-2xl font-extrabold tracking-tight ${
          mono ? "font-mono" : ""
        } ${styles.value}`}
      >
        {value}
      </p>
      {subtitle && <p className={`text-xs ${styles.subtitle}`}>{subtitle}</p>}
    </div>
  );
}
