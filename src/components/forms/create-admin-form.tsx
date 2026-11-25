"use client";

import { useState, useTransition } from "react";
import { UserPlus, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { createAdminUser } from "@/features/administration/actions/user-actions";
import type { AdminRoleName } from "@/types/database.types";

interface RoleOption {
  name: AdminRoleName;
  label: string;
  description: string;
  badgeClass: string;
}

const AVAILABLE_ROLES: RoleOption[] = [
  {
    name: "super_admin",
    label: "Superadministrador",
    description: "Acesso total irrestrito a configurações, utilizadores e auditoria",
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
  },
  {
    name: "registration_admin",
    label: "Coordenação / Registo",
    description: "Visão global executiva, gestão de inscrições e exportações",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
  },
  {
    name: "validator",
    label: "Validador de Inscrições",
    description: "Aprovação, rejeição com motivo e reativação de inscritos",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  {
    name: "accreditation_operator",
    label: "Operador de Credenciamento",
    description: "Pesquisa manual e confirmação presencial no secretariado",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
  },
  {
    name: "attendance_operator",
    label: "Operador de Presenças",
    description: "Registo manual de presenças nas sessões plenárias",
    badgeClass: "bg-cyan-50 text-cyan-700 border-cyan-200",
  },
  {
    name: "consultant",
    label: "Consultor / Auditor",
    description: "Consulta e verificação de quórum, relatórios e auditoria",
    badgeClass: "bg-slate-200/70 text-slate-700 border-slate-300",
  },
];

export function CreateAdminForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [selectedRoles, setSelectedRoles] = useState<AdminRoleName[]>(["validator"]);

  function toggleRole(role: AdminRoleName) {
    if (selectedRoles.includes(role)) {
      if (selectedRoles.length === 1) return;
      setSelectedRoles(selectedRoles.filter((r) => r !== role));
    } else {
      setSelectedRoles([...selectedRoles, role]);
    }
  }

  function handleSubmit(formData: FormData) {
    setErrorMessage(null);
    setSuccessMessage(null);

    formData.delete("roles");
    selectedRoles.forEach((role) => formData.append("roles", role));

    startTransition(async () => {
      const res = await createAdminUser(formData);
      if (res.error) {
        setErrorMessage(res.error);
      } else {
        setSuccessMessage("Novo utilizador administrativo criado com sucesso!");
        setSelectedRoles(["validator"]);
        setTimeout(() => {
          setIsOpen(false);
          setSuccessMessage(null);
        }, 2000);
      }
    });
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
      >
        <UserPlus className="w-4 h-4" aria-hidden="true" />
        Registar Novo Administrador / Operador
      </button>
    );
  }

  return (
    <div className="bg-[#F1F5F9] rounded-2xl border border-blue-300 p-6 shadow-sm space-y-4 w-full">
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-200">
            <UserPlus className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Novo Utilizador Administrativo</h3>
            <p className="text-xs text-slate-600">
              Crie contas operacionais com as funções e privilégios específicos do evento.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setIsOpen(false);
            setErrorMessage(null);
            setSuccessMessage(null);
          }}
          disabled={isPending}
          className="text-xs text-slate-500 hover:text-slate-700 font-medium px-2 py-1 rounded"
        >
          Cancelar
        </button>
      </div>

      {errorMessage && (
        <div role="alert" className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div role="status" className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>{successMessage}</span>
        </div>
      )}

      <form action={handleSubmit} className="space-y-4 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="admin-display-name" className="block font-semibold text-slate-700 mb-1">
              Nome Completo <span className="text-rose-500">*</span>
            </label>
            <input
              id="admin-display-name"
              type="text"
              name="displayName"
              required
              placeholder="Ex.: Francisco Miguel"
              className="w-full rounded-xl border border-slate-300 bg-[#F1F5F9] p-2.5 text-xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <label htmlFor="admin-email" className="block font-semibold text-slate-700 mb-1">
              E-mail de Acesso <span className="text-rose-500">*</span>
            </label>
            <input
              id="admin-email"
              type="email"
              name="email"
              required
              placeholder="operador@cdjluanda.ao"
              className="w-full rounded-xl border border-slate-300 bg-[#F1F5F9] p-2.5 text-xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <label htmlFor="admin-password" className="block font-semibold text-slate-700 mb-1">
              Palavra-passe Inicial <span className="text-rose-500">*</span>
            </label>
            <input
              id="admin-password"
              type="password"
              name="password"
              required
              minLength={6}
              placeholder="Mínimo 6 caracteres"
              className="w-full rounded-xl border border-slate-300 bg-[#F1F5F9] p-2.5 text-xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        {/* Seleção de Funções RBAC */}
        <div>
          <span className="block font-semibold text-slate-700 mb-2">
            Funções Atribuídas (Selecione pelo menos uma) <span className="text-rose-500">*</span>
          </span>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {AVAILABLE_ROLES.map((r) => {
              const isChecked = selectedRoles.includes(r.name);
              return (
                <label
                  key={r.name}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 select-none ${
                    isChecked
                      ? "border-blue-500 bg-blue-50/70"
                      : "border-slate-300 bg-slate-200/40 hover:bg-slate-200/70"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleRole(r.name)}
                    className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <div>
                    <div className="font-semibold text-slate-900 text-xs">{r.label}</div>
                    <div className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                      {r.description}
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {/* Botão de Submissão */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-200">
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            disabled={isPending}
            className="px-4 py-2 border border-slate-300 hover:bg-slate-200/70 text-slate-700 font-semibold rounded-xl text-xs transition"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl text-xs transition shadow-sm"
          >
            {isPending ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                Criando utilizador...
              </>
            ) : (
              <>
                <UserPlus className="w-3.5 h-3.5" aria-hidden="true" />
                Confirmar Criação
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
