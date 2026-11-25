"use client";

import { useActionState, useRef, useEffect } from "react";
import { Plus, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { createOrganizationAction } from "@/features/organizations/actions/organization-actions";
import { LUANDA_MUNICIPALITIES, INTENDENCIAS } from "@/lib/constants/conference-data";

export function CreateOrganizationForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, isPending] = useActionState(createOrganizationAction, null);

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <div className="bg-[#F1F5F9] rounded-2xl border border-slate-300/80 p-6 shadow-sm space-y-4">
      <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
        <Plus className="w-4 h-4 text-blue-600" aria-hidden="true" />
        Registar Nova Igreja / Congregação
      </h2>

      {state?.error && (
        <div
          role="alert"
          className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>{state.error}</span>
        </div>
      )}

      {state?.success && (
        <div
          role="status"
          className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>Organização registada com sucesso!</span>
        </div>
      )}

      <form
        ref={formRef}
        action={formAction}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs"
      >
        <div>
          <label htmlFor="org-name" className="block font-medium text-slate-700 mb-1">
            Nome da Igreja Local <span className="text-rose-500">*</span>
          </label>
          <input
            id="org-name"
            type="text"
            name="name"
            required
            disabled={isPending}
            placeholder="Ex.: Congregação Central"
            className="w-full rounded-xl border border-slate-300 bg-[#F1F5F9] p-2.5 text-xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div>
          <label htmlFor="org-municipality" className="block font-medium text-slate-700 mb-1">
            Município <span className="text-rose-500">*</span>
          </label>
          <select
            id="org-municipality"
            name="municipality"
            required
            disabled={isPending}
            className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-blue-500 focus:outline-none bg-[#F1F5F9]"
          >
            {LUANDA_MUNICIPALITIES.map((mun) => (
              <option key={mun} value={mun}>
                {mun}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="org-district" className="block font-medium text-slate-700 mb-1">
            Intendência <span className="text-rose-500">*</span>
          </label>
          <select
            id="org-district"
            name="district"
            required
            disabled={isPending}
            className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-blue-500 focus:outline-none bg-[#F1F5F9]"
          >
            {INTENDENCIAS.map((dist) => (
              <option key={dist} value={dist}>
                {dist}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-3 flex justify-end">
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                A guardar...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" aria-hidden="true" />
                Guardar Igreja
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
