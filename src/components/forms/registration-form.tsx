"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Phone,
  Mail,
  Church,
  MapPin,
  Briefcase,
  Users,
  ShieldAlert,
  Loader2,
  CheckCircle2,
  ChevronDown,
} from "lucide-react";
import {
  publicRegistrationSchema,
  type PublicRegistrationInput,
} from "@/lib/validations/registration.schema";
import {
  LUANDA_MUNICIPALITIES,
  INTENDENCIAS,
  CARGOS_PASTORAIS,
  PARTICIPANT_CATEGORIES,
  ORGANIZATIONAL_ROLES,
  type Intendencia,
  type LuandaMunicipality,
  type ParticipantCategory,
  type OrganizationalRole,
} from "@/lib/constants/conference-data";
import { submitRegistration } from "@/features/registrations/actions/submit-registration";

interface FormErrors {
  [key: string]: string | undefined;
}

const inputBase =
  "w-full rounded-xl border px-3.5 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 bg-[#F1F5F9]";
const inputNormal =
  "border-slate-300 focus:border-emerald-600 focus:ring-emerald-500/20";
const inputError =
  "border-rose-300 bg-rose-50/50 focus:ring-rose-500";
const selectBase =
  "w-full rounded-xl border border-slate-300 bg-[#F1F5F9] px-3.5 py-2.5 text-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 appearance-none";

export function RegistrationForm() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    fullName: "",
    sex: "Masculino" as "Masculino" | "Feminino",
    phone: "",
    email: "",
    municipality: LUANDA_MUNICIPALITIES[0] as LuandaMunicipality,
    ecclesiasticalDistrict: "" as Intendencia | "",
    localChurch: "",
    organizationalRole: ORGANIZATIONAL_ROLES[0] as OrganizationalRole,
    customRole: "",
    participantCategory: PARTICIPANT_CATEGORIES[0] as ParticipantCategory,
    delegationResponsible: "",
    website_url: "", // Honeypot
  });

  const [idempotencyKey, setIdempotencyKey] = useState("");
  const [formLoadedAt, setFormLoadedAt] = useState(0);
  const [errors, setErrors] = useState<FormErrors>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setIdempotencyKey(crypto.randomUUID());
    setFormLoadedAt(Date.now());
  }, []);

  // Cargos pastorais disponíveis para a Intendência seleccionada
  const availableCargos =
    formData.ecclesiasticalDistrict
      ? CARGOS_PASTORAIS[formData.ecclesiasticalDistrict as Intendencia] ?? []
      : [];

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    // Quando a Intendência muda, limpa o Cargo Pastoral para evitar inconsistências
    if (name === "ecclesiasticalDistrict") {
      setFormData((prev) => ({ ...prev, [name]: value as Intendencia | "", localChurch: "" }));
      setErrors((prev) => ({ ...prev, ecclesiasticalDistrict: undefined, localChurch: undefined }));
      return;
    }

    // Quando a Função deixa de ser "Outro", limpa a especificação anterior
    if (name === "organizationalRole") {
      setFormData((prev) => ({
        ...prev,
        organizationalRole: value as OrganizationalRole,
        customRole: value === "Outro" ? prev.customRole : "",
      }));
      setErrors((prev) => ({ ...prev, organizationalRole: undefined, customRole: undefined }));
      return;
    }

    // Quando a Categoria muda de "Delegado", limpa o responsável da delegação se aplicável
    if (name === "participantCategory") {
      setFormData((prev) => ({
        ...prev,
        participantCategory: value as ParticipantCategory,
        delegationResponsible: value === "Delegado" ? prev.delegationResponsible : "",
      }));
      setErrors((prev) => ({ ...prev, participantCategory: undefined, delegationResponsible: undefined }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));

    // Limpa o erro do campo ao editar
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);

    const payload: PublicRegistrationInput = {
      idempotencyKey,
      fullName: formData.fullName,
      sex: formData.sex,
      phone: formData.phone,
      email: formData.email,
      municipality: formData.municipality,
      ecclesiasticalDistrict: formData.ecclesiasticalDistrict,
      localChurch: formData.localChurch,
      organizationalRole: formData.organizationalRole,
      customRole: formData.organizationalRole === "Outro" ? formData.customRole : null,
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
      // Scroll para o primeiro erro
      setTimeout(() => {
        const firstError = document.querySelector("[data-error='true']");
        firstError?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 50);
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

      sessionStorage.setItem(
        "cdj26_registration_success",
        JSON.stringify({
          code: result.registrationCode,
          name: result.fullName,
          submittedAt: result.submittedAt,
        })
      );

      router.push(`/inscricao/sucesso?code=${encodeURIComponent(result.registrationCode)}`);
    } catch {
      setGeneralError(
        "Ocorreu uma falha inesperada na submissão. Por favor, tente novamente."
      );
      setIsSubmitting(false);
    }
  };

  const isDelegate = formData.participantCategory === "Delegado";
  const isOtherRole = formData.organizationalRole === "Outro";

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

      {/* ================================================================
          SECÇÃO 1: Dados Pessoais
      ================================================================ */}
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
          <div data-error={!!errors.fullName}>
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
              className={`${inputBase} ${errors.fullName ? inputError : inputNormal}`}
            />
            {errors.fullName && (
              <p className="mt-1 text-xs text-rose-600">{errors.fullName}</p>
            )}
          </div>

          {/* Sexo e Telefone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="sex"
                className="block text-xs font-medium text-slate-700 mb-1.5"
              >
                Sexo <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <select
                  id="sex"
                  name="sex"
                  value={formData.sex}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className={selectBase}
                >
                  <option value="Masculino">Masculino</option>
                  <option value="Feminino">Feminino</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
              </div>
            </div>

            <div data-error={!!errors.phone}>
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
                  className={`${inputBase} ${errors.phone ? inputError : inputNormal}`}
                />
                <Phone className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
              </div>
              {errors.phone ? (
                <p className="mt-1 text-xs text-rose-600">{errors.phone}</p>
              ) : (
                <p className="mt-1 text-xs text-slate-400">
                  Número para contacto e localização da inscrição no credenciamento.
                </p>
              )}
            </div>
          </div>

          {/* E-mail */}
          <div data-error={!!errors.email}>
            <label
              htmlFor="email"
              className="block text-xs font-medium text-slate-700 mb-1.5"
            >
              Endereço de E-mail <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Ex.: nome@dominio.com"
                maxLength={254}
                autoComplete="email"
                disabled={isSubmitting}
                className={`${inputBase} ${errors.email ? inputError : inputNormal}`}
              />
              <Mail className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
            </div>
            {errors.email ? (
              <p className="mt-1 text-xs text-rose-600">{errors.email}</p>
            ) : (
              <p className="mt-1 text-xs text-slate-400">
                Utilizado apenas para comunicações oficiais da Conferência.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ================================================================
          SECÇÃO 2: Dados Eclesiásticos e Localização
      ================================================================ */}
      <div className="bg-[#F1F5F9] rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <Church className="w-4 h-4 text-emerald-700" />
            Dados Eclesiásticos e Localização
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Informações sobre a sua jurisdição eclesiástica e localização.
          </p>
        </div>

        <div className="space-y-4">
          {/* Município e Intendência em grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Município de Residência */}
            <div>
              <label
                htmlFor="municipality"
                className="block text-xs font-medium text-slate-700 mb-1.5"
              >
                Município de Residência <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <select
                  id="municipality"
                  name="municipality"
                  value={formData.municipality}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className={selectBase}
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

            {/* Intendência */}
            <div data-error={!!errors.ecclesiasticalDistrict}>
              <label
                htmlFor="ecclesiasticalDistrict"
                className="block text-xs font-medium text-slate-700 mb-1.5"
              >
                Intendência <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <select
                  id="ecclesiasticalDistrict"
                  name="ecclesiasticalDistrict"
                  value={formData.ecclesiasticalDistrict}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className={`${selectBase} ${!formData.ecclesiasticalDistrict ? "text-slate-400" : ""}`}
                >
                  <option value="" disabled>
                    Seleccione a Intendência...
                  </option>
                  {INTENDENCIAS.map((dist) => (
                    <option key={dist} value={dist}>
                      {dist}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
              </div>
              {errors.ecclesiasticalDistrict && (
                <p className="mt-1 text-xs text-rose-600">
                  {errors.ecclesiasticalDistrict}
                </p>
              )}
            </div>
          </div>

          {/* Cargo Pastoral — dependente da Intendência */}
          <div data-error={!!errors.localChurch}>
            <label
              htmlFor="localChurch"
              className="block text-xs font-medium text-slate-700 mb-1.5"
            >
              Cargo Pastoral <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <select
                id="localChurch"
                name="localChurch"
                value={formData.localChurch}
                onChange={handleChange}
                disabled={isSubmitting || !formData.ecclesiasticalDistrict}
                aria-describedby={
                  !formData.ecclesiasticalDistrict
                    ? "localChurch-hint"
                    : undefined
                }
                className={`${selectBase} ${
                  errors.localChurch
                    ? "border-rose-300 bg-rose-50/50"
                    : !formData.ecclesiasticalDistrict
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                } ${!formData.localChurch ? "text-slate-400" : ""}`}
              >
                <option value="" disabled>
                  {formData.ecclesiasticalDistrict
                    ? "Seleccione o Cargo Pastoral..."
                    : "Seleccione primeiro a Intendência"}
                </option>
                {availableCargos.map((cargo) => (
                  <option key={cargo} value={cargo}>
                    {cargo}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
            </div>
            {errors.localChurch ? (
              <p className="mt-1 text-xs text-rose-600">{errors.localChurch}</p>
            ) : !formData.ecclesiasticalDistrict ? (
              <p
                id="localChurch-hint"
                className="mt-1 text-xs text-slate-400"
              >
                Seleccione a Intendência para ver os Cargos Pastorais disponíveis.
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {/* ================================================================
          SECÇÃO 3: Função e Participação
      ================================================================ */}
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
              <div className="relative">
                <select
                  id="participantCategory"
                  name="participantCategory"
                  value={formData.participantCategory}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className={selectBase}
                >
                  {PARTICIPANT_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
              </div>
            </div>

            {/* Função na Organização */}
            <div data-error={!!errors.organizationalRole}>
              <label
                htmlFor="organizationalRole"
                className="block text-xs font-medium text-slate-700 mb-1.5"
              >
                Função na Organização <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <select
                  id="organizationalRole"
                  name="organizationalRole"
                  value={formData.organizationalRole}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className={selectBase}
                >
                  {ORGANIZATIONAL_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
              </div>
              {errors.organizationalRole && (
                <p className="mt-1 text-xs text-rose-600">
                  {errors.organizationalRole}
                </p>
              )}
            </div>
          </div>

          {/* Campo adicional quando Função = "Outro" */}
          {isOtherRole && (
            <div data-error={!!errors.customRole}>
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
                className={`${inputBase} ${errors.customRole ? inputError : inputNormal}`}
              />
              {errors.customRole && (
                <p className="mt-1 text-xs text-rose-600">{errors.customRole}</p>
              )}
            </div>
          )}

          {/* Responsável da Delegação (condicional para Delegados) */}
          {isDelegate && (
            <div
              className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 space-y-2"
              data-error={!!errors.delegationResponsible}
            >
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
                className={`${inputBase} ${
                  errors.delegationResponsible ? inputError : inputNormal
                }`}
              />
              {errors.delegationResponsible ? (
                <p className="text-xs text-rose-600">
                  {errors.delegationResponsible}
                </p>
              ) : (
                <p className="text-xs text-slate-500">
                  Obrigatório para delegados conforme as normas de representação.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Botão de Submissão */}
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

        <p className="text-center text-xs text-slate-400 mt-3 leading-relaxed">
          Ao submeter, os seus dados serão registados de forma confidencial para a III Sessão
          Bienal. Será gerado um código único de inscrição para credenciamento no evento.
        </p>
      </div>
    </form>
  );
}
