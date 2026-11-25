import { createClient } from "@/lib/supabase/server";
import { Church, Plus, Building2 } from "lucide-react";
import { createOrganization } from "@/features/organizations/actions/organization-actions";
import { LUANDA_MUNICIPALITIES, INTENDENCIAS } from "@/lib/constants/conference-data";

export const dynamic = "force-dynamic";

export default async function AdminOrganizacoesPage() {
  const supabase = await createClient();

  const { data: organizations } = await supabase
    .from("organizations")
    .select("*")
    .order("name", { ascending: true });

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Church className="w-6 h-6 text-blue-600" />
          Organizações e Igrejas Locais
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Registo oficial das congregações participantes da III Sessão Bienal.
        </p>
      </div>

      {/* Formulário de Registo de Nova Organização */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Plus className="w-4 h-4 text-blue-600" />
          Registar Nova Igreja / Congregação
        </h2>

        <form
          action={async (formData: FormData) => {
            "use server";
            await createOrganization(formData);
          }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs"
        >
          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Nome da Igreja Local <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              required
              placeholder="Ex.: Congregação Central"
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Município <span className="text-rose-500">*</span>
            </label>
            <select
              name="municipality"
              required
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-blue-500 focus:outline-none bg-white"
            >
              {LUANDA_MUNICIPALITIES.map((mun) => (
                <option key={mun} value={mun}>
                  {mun}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Intendência <span className="text-rose-500">*</span>
            </label>
            <select
              name="district"
              required
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-blue-500 focus:outline-none bg-white"
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
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Guardar Igreja
            </button>
          </div>
        </form>
      </div>

      {/* Lista de Organizações Cadastradas */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Igrejas Cadastradas ({organizations?.length || 0})
          </h3>
        </div>

        {organizations && organizations.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Nome da Igreja / Cargo</th>
                  <th className="py-3 px-4">Município</th>
                  <th className="py-3 px-4">Intendência</th>
                  <th className="py-3 px-4">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {organizations.map((org) => (
                  <tr key={org.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900 flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 text-blue-500" />
                      {org.name}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{org.municipality}</td>
                    <td className="py-3 px-4 text-slate-600">{org.ecclesiastical_district}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {org.is_active ? "Ativa" : "Inativa"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-10 text-center text-xs text-slate-400">
            Nenhuma organização registada ainda. Utilize o formulário acima para adicionar.
          </div>
        )}
      </div>
    </div>
  );
}
