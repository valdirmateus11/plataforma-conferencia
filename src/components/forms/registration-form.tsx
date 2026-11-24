"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Phone,
  Church,
  MapPin,
  Briefcase,
  Users,
  ShieldAlert,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import {
  publicRegistrationSchema,
  PROVISIONAL_DISTRICTS,
  LUANDA_MUNICIPALITIES,
  PARTICIPANT_CATEGORIES,
  ORGANIZATIONAL_ROLES,
  type PublicRegistrationInput,
} from "@/lib/validations/registration.schema";
import { submitRegistration } from "@/features/registrations/actions/submit-registration";

interface FormErrors {
  [key: string]: string | undefined;
}

export function RegistrationForm() {
  const router = useRouter();

  // Estados do formulário
  const [formData, setFormData] = useState({
    fullName: "",
    sex: "Masculino" as "Masculino" | "Feminino",
    phone: "",
    municipality: LUANDA_MUNICIPALITIES[0],
    ecclesiasticalDistrict: PROVISIONAL_DISTRICTS[0],
    localChurch: "",
    organizationalRole: ORGANIZATIONAL_ROLES[0],
    customRole: "",
    participantCategory: PARTICIPANT_CATEGORIES[0],
    delegationResponsible: "",
    website_url: "", // Honeypot
  });

  const [idempotencyKey, setIdempotencyKey] = useState("");
  const [formLoadedAt, setFormLoadedAt] = useState(0);
  const [errors, setErrors] = useState<FormErrors>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Inicializa a chave de idempotência única e o timestamp ao montar
  useEffect(() => {
    setIdempotencyKey(crypto.randomUUID());
    setFormLoadedAt(Date.now());
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Limpa o erro do campo ao digitar
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);

    const effectiveRole =
      formData.organizationalRole === "Outro" && formData.customRole.trim()
        ? formData.customRole.trim()
        : formData.organizationalRole;

    const payload: PublicRegistrationInput = {
      idempotencyKey,
      fullName: formData.fullName,
      sex: formData.sex,
      phone: formData.phone,
      municipality: formData.municipality,
      ecclesiasticalDistrict: formData.ecclesiasticalDistrict,
      localChurch: formData.localChurch,
      organizationalRole: effectiveRole,
      participantCategory: formData.participantCategory,
      delegationResponsible: formData.delegationResponsible || null,
      website_url: formData.website_url,
      formLoadedAt,
    };

    // Validação no cliente com Zod
    const clientValidation = publicRegistrationSchema.safeParse(payload);
    if (!clientValidation.success) {
      const fieldErrors: FormErrors = {};
      clientValidation.error.issues.forEach((issue) => {
        const path = issue.path[0] as string;
        if (!fieldErrors[path]) {
          fieldErrors[path] = issue.message;
        }
      });
      setErrors(fieldErrors);
      setGeneralError("Por favor, verifique os campos destacados abaixo.");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await submitRegistration(payload);

      if (!result.success) {
        setGeneralError(result.error);
        if (result.fieldErrors) {
          const mapped: FormErrors = {};
          Object.entries(result.fieldErrors).forEach(([key, msgs]) => {
            mapped[key] = msgs?.[0];
          });
          setErrors(mapped);
        }
        setIsSubmitting(false);
        return;
      }

      // Sucesso: armazena temporariamente os detalhes essenciais para o ecrã de sucesso
      sessionStorage.setItem(
        "cdj26_registration_success",
        JSON.stringify({
          code: result.registrationCode,
          name: result.fullName,
          submittedAt: result.submittedAt,
        })
      );

      // Redireciona para o ecrã de sucesso
      router.push(`/inscricao/sucesso?code=${encodeURIComponent(result.registrationCode)}`);
    } catch {
      setGeneralError("Ocorreu uma falha inesperada na submissão. Por favor, tente novamente.");
      setIsSubmitting(false);
    }
  };

  const isDelegate = formData.participantCategory === "Delegado";

  return (
    <form onSubmit={handleSubmit} className="space-y-6 text-left" noValidate>
      {/* Campo Honeypot Oculto para Bots */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="website_url">Não preencha este campo</label>
        <input
          type="text"
          id="website_url"
          name="website_url"
          value={formData.website_url}
          onChange={handleChange}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      {/* Alerta Geral de Erro */}
      {generalError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-800 text-sm flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="font-medium">Atenção</p>
            <p className="text-xs text-rose-700 mt-0.5">{generalError}</p>
          </div>
        </div>
      )}

      {/* SECÇÃO 1: Identificação Pessoal */}
      <div className="bg-[#F1F5F9] rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <User className="w-4 h-4 text-emerald-700" />
            Dados Pessoais
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Identificação oficial para credenciamento e emissão de credenciais.
          </p>
        </div>

        <div className="space-y-4">
          {/* Nome Completo */}
          <div>
            <label
              htmlFor="fullName"
              className="block text-xs font-medium text-slate-700 mb-1.5"
            >
              Nome Completo <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Ex.: Manuel António da Silva"
              maxLength={120}
              disabled={isSubmitting}
              className={`w-full rounded-xl border px-3.5 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 ${
                errors.fullName
                  ? "border-rose-300 bg-rose-50/50 focus:ring-rose-500"
                  : "border-slate-300 bg-[#F1F5F9] focus:border-emerald-600 focus:ring-emerald-500/20"
              }`}
            />
            {errors.fullName && (
              <p className="mt-1 text-xs text-rose-600">{errors.fullName}</p>
            )}
          </div>

          {/* Sexo e Telefone em Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="sex"
                className="block text-xs font-medium text-slate-700 mb-1.5"
              >
                Sexo <span className="text-rose-500">*</span>
              </label>
              <select
                id="sex"
                name="sex"
                value={formData.sex}
                onChange={handleChange}
                disabled={isSubmitting}
                className="w-full rounded-xl border border-slate-300 bg-[#F1F5F9] px-3.5 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="Masculino">Masculino</option>
                <option value="Feminino">Feminino</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="phone"
                className="block text-xs font-medium text-slate-700 mb-1.5"
              >
                Telefone de Contacto <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Ex.: 923 000 000"
                  maxLength={20}
                  disabled={isSubmitting}
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 ${
                    errors.phone
                      ? "border-rose-300 bg-rose-50/50 focus:ring-rose-500"
                      : "border-slate-300 bg-[#F1F5F9] focus:border-emerald-600 focus:ring-emerald-500/20"
                  }`}
                />
                <Phone className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
              </div>
              {errors.phone ? (
                <p className="mt-1 text-xs text-rose-600">{errors.phone}</p>
              ) : (
                <p className="mt-1 text-[11px] text-slate-400">
                  Número para contacto e localização da inscrição no credenciamento.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SECÇÃO 2: Origem Eclesiástica e Localização */}
      <div className="bg-[#F1F5F9] rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <Church className="w-4 h-4 text-emerald-700" />
            Dados Eclesiásticos e Localização
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Informações sobre a sua congregação e jurisdição eclesiástica.
          </p>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Município */}
            <div>
              <label
                htmlFor="municipality"
                className="block text-xs font-medium text-slate-700 mb-1.5"
              >
                Município de Residência / Igreja <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <select
                  id="municipality"
                  name="municipality"
                  value={formData.municipality}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className="w-full rounded-xl border border-slate-300 bg-[#F1F5F9] px-3.5 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none"
                >
                  {LUANDA_MUNICIPALITIES.map((mun) => (
                    <option key={mun} value={mun}>
                      {mun}
                    </option>
                  ))}
                </select>
                <MapPin className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
              </div>
            </div>

            {/* Distrito Eclesiástico */}
            <div>
              <label
                htmlFor="ecclesiasticalDistrict"
                className="block text-xs font-medium text-slate-700 mb-1.5"
              >
                Distrito Eclesiástico <span className="text-rose-500">*</span>
              </label>
              <select
                id="ecclesiasticalDistrict"
                name="ecclesiasticalDistrict"
                value={formData.ecclesiasticalDistrict}
                onChange={handleChange}
                disabled={isSubmitting}
                className="w-full rounded-xl border border-slate-300 bg-[#F1F5F9] px-3.5 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                {PROVISIONAL_DISTRICTS.map((dist) => (
                  <option key={dist} value={dist}>
                    {dist}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Igreja Local */}
          <div>
            <label
              htmlFor="localChurch"
              className="block text-xs font-medium text-slate-700 mb-1.5"
            >
              Igreja Local / Congregação <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              id="localChurch"
              name="localChurch"
              value={formData.localChurch}
              onChange={handleChange}
              placeholder="Ex.: Paróquia / Congregação Central"
              maxLength={120}
              disabled={isSubmitting}
              className={`w-full rounded-xl border px-3.5 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 ${
                errors.localChurch
                  ? "border-rose-300 bg-rose-50/50 focus:ring-rose-500"
                  : "border-slate-300 bg-[#F1F5F9] focus:border-emerald-600 focus:ring-emerald-500/20"
              }`}
            />
            {errors.localChurch && (
              <p className="mt-1 text-xs text-rose-600">{errors.localChurch}</p>
            )}
          </div>
        </div>
      </div>

      {/* SECÇÃO 3: Participação e Delegação */}
      <div className="bg-[#F1F5F9] rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-emerald-700" />
            Função e Participação
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Defina o seu papel na organização e o tipo de credenciamento.
          </p>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Categoria de Participação */}
            <div>
              <label
                htmlFor="participantCategory"
                className="block text-xs font-medium text-slate-700 mb-1.5"
              >
                Categoria de Participação <span className="text-rose-500">*</span>
              </label>
              <select
                id="participantCategory"
                name="participantCategory"
                value={formData.participantCategory}
                onChange={handleChange}
                disabled={isSubmitting}
                className="w-full rounded-xl border border-slate-300 bg-[#F1F5F9] px-3.5 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                {PARTICIPANT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Função na Organização */}
            <div>
              <label
                htmlFor="organizationalRole"
                className="block text-xs font-medium text-slate-700 mb-1.5"
              >
                Função na Organização <span className="text-rose-500">*</span>
              </label>
              <select
                id="organizationalRole"
                name="organizationalRole"
                value={formData.organizationalRole}
                onChange={handleChange}
                disabled={isSubmitting}
                className="w-full rounded-xl border border-slate-300 bg-[#F1F5F9] px-3.5 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                {ORGANIZATIONAL_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Campo extra se Função for "Outro" */}
          {formData.organizationalRole === "Outro" && (
            <div>
              <label
                htmlFor="customRole"
                className="block text-xs font-medium text-slate-700 mb-1.5"
              >
                Especifique a sua função <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                id="customRole"
                name="customRole"
                value={formData.customRole}
                onChange={handleChange}
                placeholder="Ex.: Animador Juvenil / Representante Distrital"
                maxLength={80}
                disabled={isSubmitting}
                className="w-full rounded-xl border border-slate-300 bg-[#F1F5F9] px-3.5 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          )}

          {/* Responsável da Delegação (Condicional se Delegado) */}
          {isDelegate && (
            <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 space-y-2">
              <label
                htmlFor="delegationResponsible"
                className="block text-xs font-medium text-slate-800 flex items-center gap-1.5"
              >
                <Users className="w-3.5 h-3.5 text-emerald-700" />
                Responsável da Delegação <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                id="delegationResponsible"
                name="delegationResponsible"
                value={formData.delegationResponsible}
                onChange={handleChange}
                placeholder="Nome do Líder ou Pastor que chefia a delegação"
                maxLength={120}
                disabled={isSubmitting}
                className={`w-full rounded-xl border px-3.5 py-2.5 text-sm bg-[#F1F5F9] transition-colors focus:outline-none focus:ring-2 ${
                  errors.delegationResponsible
                    ? "border-rose-300 focus:ring-rose-500"
                    : "border-slate-300 focus:border-emerald-600 focus:ring-emerald-500/20"
                }`}
              />
              {errors.delegationResponsible ? (
                <p className="text-xs text-rose-600">{errors.delegationResponsible}</p>
              ) : (
                <p className="text-[11px] text-slate-500">
                  Obrigatório para delegados conforme as normas de representação.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Botão de Submissão com Proteção de Duplo Envio */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-800 via-emerald-700 to-emerald-800 hover:from-emerald-900 hover:to-emerald-900 px-6 py-4 text-sm font-bold text-white shadow-lg shadow-emerald-950/15 transition-all active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              A processar inscrição de forma segura...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              Submeter Inscrição na Conferência
            </>
          )}
        </button>

        <p className="text-center text-[11px] text-slate-400 mt-3 leading-relaxed">
          Ao submeter, os seus dados serão registados de forma confidencial para a III Sessão
          Bienal. Será gerado um código único de inscrição para credenciamento no evento.
        </p>
      </div>
    </form>
  );
}
