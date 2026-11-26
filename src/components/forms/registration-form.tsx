"use client";

import { useState, useEffect, useMemo } from "react";
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
  Calendar,
  GraduationCap,
  Lock,
  Info,
} from "lucide-react";
import {
  publicRegistrationSchema,
  type PublicRegistrationInput,
} from "@/lib/validations/registration.schema";
import {
  MARITAL_STATUSES,
  EDUCATION_LEVELS,
  LUANDA_MUNICIPALITIES,
  INTENDENCIAS,
  CARGOS_PASTORAIS,
  MEMBER_CATEGORIES,
  PARTICIPANT_CATEGORIES,
  ORGANIZATIONAL_ROLES,
  evaluateBirthDateAndAgeGroup,
  getTodayInLuandaISO,
  type Intendencia,
  type LuandaMunicipality,
  type ParticipantCategory,
  type OrganizationalRole,
  type MaritalStatus,
  type EducationLevel,
  type MemberCategory,
} from "@/lib/constants/conference-data";
import { CONFERENCE_CONFIG } from "@/lib/config";
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
    maritalStatus: "" as MaritalStatus | "",
    birthDate: "",
    educationLevel: "" as EducationLevel | "",
    phone: "",
    email: "",
    municipality: LUANDA_MUNICIPALITIES[0] as LuandaMunicipality,
    ecclesiasticalDistrict: "" as Intendencia | "",
    localChurch: "",
    memberCategory: "" as MemberCategory | "",
    organizationalRole: "" as OrganizationalRole | "",
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

  const todayISO = useMemo(() => getTodayInLuandaISO(), []);

  // Cálculo automático e reactivo da idade e faixa-etária a partir da Data de Nascimento
  const ageEvaluation = useMemo(
    () => evaluateBirthDateAndAgeGroup(formData.birthDate),
    [formData.birthDate]
  );

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
      setFormData((prev) => ({
        ...prev,
        ecclesiasticalDistrict: value as Intendencia | "",
        localChurch: "",
      }));
      setErrors((prev) => ({
        ...prev,
        ecclesiasticalDistrict: undefined,
        localChurch: undefined,
      }));
      return;
    }

    // Quando a Data de Nascimento muda, limpa os erros de data e faixa-etária
    if (name === "birthDate") {
      setFormData((prev) => ({ ...prev, birthDate: value }));
      setErrors((prev) => ({
        ...prev,
        birthDate: undefined,
        ageGroup: undefined,
      }));
      return;
    }

    // Quando a Categoria muda de "Delegado", limpa o responsável da delegação
    if (name === "participantCategory") {
      setFormData((prev) => ({
        ...prev,
        participantCategory: value as ParticipantCategory,
        delegationResponsible:
          value === "Delegado" ? prev.delegationResponsible : "",
      }));
      setErrors((prev) => ({
        ...prev,
        participantCategory: undefined,
        delegationResponsible: undefined,
      }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));

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
      maritalStatus: formData.maritalStatus,
      birthDate: formData.birthDate,
      ageGroup: ageEvaluation.ageGroup,
      educationLevel: formData.educationLevel,
      phone: formData.phone,
      email: formData.email,
      municipality: formData.municipality,
      ecclesiasticalDistrict: formData.ecclesiasticalDistrict,
      localChurch: formData.localChurch,
      memberCategory: formData.memberCategory,
      organizationalRole: formData.organizationalRole,
      customRole: null,
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
        CONFERENCE_CONFIG.successStorageKey,
        JSON.stringify({
          code: result.registrationCode,
          name: result.fullName,
          submittedAt: result.submittedAt,
        })
      );

      router.push(
        `/inscricao/sucesso?code=${encodeURIComponent(result.registrationCode)}`
      );
    } catch {
      setGeneralError(
        "Ocorreu uma falha inesperada na submissão. Por favor, tente novamente."
      );
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

      {/* ================================================================
          SECÇÃO 1: Dados Pessoais
      ================================================================ */}
      <div className="bg-[#F1F5F9] rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
        <div className="border-b border-slate-200/80 pb-3">
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

          {/* Sexo e Estado Civil */}
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

            <div data-error={!!errors.maritalStatus}>
              <label
                htmlFor="maritalStatus"
                className="block text-xs font-medium text-slate-700 mb-1.5"
              >
                Estado Civil <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <select
                  id="maritalStatus"
                  name="maritalStatus"
                  value={formData.maritalStatus}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className={`${selectBase} ${
                    errors.maritalStatus ? "border-rose-300 bg-rose-50/50" : ""
                  } ${!formData.maritalStatus ? "text-slate-400" : "text-slate-900"}`}
                >
                  <option value="" disabled>
                    Seleccione o estado civil...
                  </option>
                  {MARITAL_STATUSES.map((status) => (
                    <option key={status} value={status} className="text-slate-900">
                      {status}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
              </div>
              {errors.maritalStatus && (
                <p className="mt-1 text-xs text-rose-600">
                  {errors.maritalStatus}
                </p>
              )}
            </div>
          </div>

          {/* Data de Nascimento e Faixa-etária (Automática) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div data-error={!!errors.birthDate}>
              <label
                htmlFor="birthDate"
                className="block text-xs font-medium text-slate-700 mb-1.5"
              >
                Data de Nascimento <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  id="birthDate"
                  name="birthDate"
                  value={formData.birthDate}
                  onChange={handleChange}
                  max={todayISO}
                  min="1900-01-01"
                  disabled={isSubmitting}
                  className={`${inputBase} pr-10 ${
                    errors.birthDate ? inputError : inputNormal
                  }`}
                />
                <Calendar className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
              </div>
              {errors.birthDate ? (
                <p className="mt-1 text-xs text-rose-600">{errors.birthDate}</p>
              ) : (
                <p className="mt-1 text-xs text-slate-400">
                  Usada para calcular automaticamente a faixa-etária.
                </p>
              )}
            </div>

            <div data-error={!!errors.ageGroup}>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="ageGroup"
                  className="block text-xs font-medium text-slate-700"
                >
                  Faixa-etária
                </label>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-200/80 text-slate-700">
                  <Lock className="w-2.5 h-2.5" aria-hidden="true" />
                  Automático
                </span>
              </div>
              <input
                type="text"
                id="ageGroup"
                name="ageGroup"
                readOnly
                tabIndex={-1}
                aria-readonly="true"
                value={
                  ageEvaluation.ageGroup
                    ? `${ageEvaluation.ageGroup} (${ageEvaluation.age} anos)`
                    : ""
                }
                placeholder={
                  formData.birthDate
                    ? "Fora das faixas definidas"
                    : "Preenchido após indicar a data"
                }
                className={`w-full rounded-xl border px-3.5 py-2.5 text-sm font-semibold cursor-not-allowed select-none ${
                  ageEvaluation.ageGroup
                    ? "border-emerald-300 bg-emerald-50/70 text-emerald-900"
                    : formData.birthDate && !ageEvaluation.isWithinAllowedRange
                    ? "border-amber-300 bg-amber-50/70 text-amber-800"
                    : "border-slate-300 bg-slate-200/60 text-slate-500"
                }`}
              />
              {formData.birthDate && ageEvaluation.message ? (
                <p className="mt-1.5 text-xs text-amber-700 flex items-start gap-1.5 leading-snug">
                  <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600" />
                  <span>{ageEvaluation.message}</span>
                </p>
              ) : errors.ageGroup ? (
                <p className="mt-1 text-xs text-rose-600">{errors.ageGroup}</p>
              ) : (
                <p className="mt-1 text-xs text-slate-400">
                  11–17 anos: Adolescente • 18–30 anos: Jovem Regular.
                </p>
              )}
            </div>
          </div>

          {/* Telefone e E-mail */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  Contacto e localização no credenciamento.
                </p>
              )}
            </div>

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
                  Comunicações oficiais da Conferência.
                </p>
              )}
            </div>
          </div>

          {/* Grau de Escolaridade */}
          <div data-error={!!errors.educationLevel}>
            <label
              htmlFor="educationLevel"
              className="block text-xs font-medium text-slate-700 mb-1.5"
            >
              Grau de Escolaridade <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <select
                id="educationLevel"
                name="educationLevel"
                value={formData.educationLevel}
                onChange={handleChange}
                disabled={isSubmitting}
                className={`${selectBase} ${
                  errors.educationLevel ? "border-rose-300 bg-rose-50/50" : ""
                } ${!formData.educationLevel ? "text-slate-400" : "text-slate-900"}`}
              >
                <option value="" disabled>
                  Seleccione o grau de escolaridade...
                </option>
                {EDUCATION_LEVELS.map((level) => (
                  <option key={level} value={level} className="text-slate-900">
                    {level}
                  </option>
                ))}
              </select>
              <GraduationCap className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
            </div>
            {errors.educationLevel && (
              <p className="mt-1 text-xs text-rose-600">
                {errors.educationLevel}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ================================================================
          SECÇÃO 2: Dados Eclesiásticos e Localização
      ================================================================ */}
      <div className="bg-[#F1F5F9] rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
        <div className="border-b border-slate-200/80 pb-3">
          <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <Church className="w-4 h-4 text-emerald-700" />
            Dados Eclesiásticos e Localização
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Informações sobre a sua jurisdição eclesiástica, categoria e localização.
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
                  className={`${selectBase} ${
                    errors.ecclesiasticalDistrict
                      ? "border-rose-300 bg-rose-50/50"
                      : ""
                  } ${
                    !formData.ecclesiasticalDistrict
                      ? "text-slate-400"
                      : "text-slate-900"
                  }`}
                >
                  <option value="" disabled>
                    Seleccione a Intendência...
                  </option>
                  {INTENDENCIAS.map((dist) => (
                    <option key={dist} value={dist} className="text-slate-900">
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
                } ${!formData.localChurch ? "text-slate-400" : "text-slate-900"}`}
              >
                <option value="" disabled>
                  {formData.ecclesiasticalDistrict
                    ? "Seleccione o Cargo Pastoral..."
                    : "Seleccione primeiro a Intendência"}
                </option>
                {availableCargos.map((cargo) => (
                  <option key={cargo} value={cargo} className="text-slate-900">
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

          {/* Categoria de Membro (após Intendência e Cargo Pastoral) */}
          <div data-error={!!errors.memberCategory}>
            <label
              htmlFor="memberCategory"
              className="block text-xs font-medium text-slate-700 mb-1.5"
            >
              Categoria de Membro <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <select
                id="memberCategory"
                name="memberCategory"
                value={formData.memberCategory}
                onChange={handleChange}
                disabled={isSubmitting}
                className={`${selectBase} ${
                  errors.memberCategory ? "border-rose-300 bg-rose-50/50" : ""
                } ${!formData.memberCategory ? "text-slate-400" : "text-slate-900"}`}
              >
                <option value="" disabled>
                  Seleccione a categoria de membro...
                </option>
                {MEMBER_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat} className="text-slate-900">
                    {cat}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
            </div>
            {errors.memberCategory && (
              <p className="mt-1 text-xs text-rose-600">
                {errors.memberCategory}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ================================================================
          SECÇÃO 3: Função e Participação
      ================================================================ */}
      <div className="bg-[#F1F5F9] rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
        <div className="border-b border-slate-200/80 pb-3">
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
                  className={`${selectBase} ${
                    errors.organizationalRole
                      ? "border-rose-300 bg-rose-50/50"
                      : ""
                  } ${
                    !formData.organizationalRole
                      ? "text-slate-400"
                      : "text-slate-900"
                  }`}
                >
                  <option value="" disabled>
                    Seleccione a função na organização...
                  </option>
                  {ORGANIZATIONAL_ROLES.map((role) => (
                    <option key={role} value={role} className="text-slate-900">
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
          Ao submeter, os seus dados serão registados de forma confidencial para a{" "}
          {CONFERENCE_CONFIG.editionLabel}. Será gerado um código único de
          inscrição para credenciamento no evento.
        </p>
      </div>
    </form>
  );
}
