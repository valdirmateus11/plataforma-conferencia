import type { ReactNode } from "react";

interface DataTableProps {
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function DataTable({
  children,
  header,
  footer,
  className = "",
}: DataTableProps) {
  return (
    <div
      className={`bg-[#F1F5F9] rounded-2xl border border-slate-300/80 shadow-sm overflow-hidden ${className}`}
    >
      {header && (
        <div className="px-5 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
          {header}
        </div>
      )}

      <div className="overflow-x-auto">{children}</div>

      {footer && (
        <div className="px-5 py-3.5 border-t border-slate-200 bg-slate-200/40">
          {footer}
        </div>
      )}
    </div>
  );
}
