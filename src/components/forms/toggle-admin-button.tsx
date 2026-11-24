"use client";

import { useTransition } from "react";
import { Loader2, CheckCircle2, Ban } from "lucide-react";
import { toggleAdminStatus } from "@/features/administration/actions/user-actions";

interface ToggleAdminButtonProps {
  userId: string;
  isActive: boolean;
  isSelf: boolean;
}

export function ToggleAdminButton({ userId, isActive, isSelf }: ToggleAdminButtonProps) {
  const [isPending, startTransition] = useTransition();

  if (isSelf) {
    return (
      <span className="text-[11px] text-slate-400 font-medium italic">
        Conta Atual (Você)
      </span>
    );
  }

  function handleToggle() {
    const actionLabel = isActive ? "desativar" : "reativar";
    if (!confirm(`Tem a certeza que deseja ${actionLabel} o acesso deste utilizador?`)) {
      return;
    }

    startTransition(async () => {
      const res = await toggleAdminStatus(userId, !isActive);
      if (res?.error) {
        alert(res.error);
      }
    });
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition border ${
        isActive
          ? "border-rose-200 text-rose-600 hover:bg-rose-50"
          : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
      } disabled:opacity-50`}
    >
      {isPending ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : isActive ? (
        <>
          <Ban className="w-3 h-3" />
          Desativar
        </>
      ) : (
        <>
          <CheckCircle2 className="w-3 h-3" />
          Reativar
        </>
      )}
    </button>
  );
}
