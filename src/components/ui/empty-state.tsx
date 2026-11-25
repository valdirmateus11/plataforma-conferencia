import type { ReactNode } from "react";
import { Inbox } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div className={`py-12 px-6 text-center flex flex-col items-center justify-center ${className}`}>
      <div className="w-12 h-12 rounded-2xl bg-slate-200/80 text-slate-500 flex items-center justify-center mb-3">
        {icon || <Inbox className="w-6 h-6" aria-hidden="true" />}
      </div>
      <p className="text-sm font-semibold text-slate-800">{title}</p>
      {description && (
        <p className="text-xs text-slate-500 mt-1 max-w-md leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
