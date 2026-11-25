import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  className?: string;
}

export function PageHeader({
  title,
  description,
  icon,
  actions,
  breadcrumbs,
  className = "",
}: PageHeaderProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Navegação estrutural" className="flex items-center gap-1.5 text-xs text-slate-500">
          {breadcrumbs.map((crumb, idx) => (
            <span key={`${crumb.label}-${idx}`} className="inline-flex items-center gap-1.5">
              {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />}
              {crumb.href ? (
                <Link href={crumb.href} className="hover:text-slate-900 font-medium transition-colors">
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-slate-700 font-semibold">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            {icon && <span className="shrink-0" aria-hidden="true">{icon}</span>}
            <span>{title}</span>
          </h1>
          {description && (
            <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
      </div>
    </div>
  );
}
