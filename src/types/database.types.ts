export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Conference = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  capacity: number;
  registration_open: boolean;
  code_prefix: string;
  timezone: string;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
};

export type Organization = {
  id: string;
  name: string;
  municipality: string;
  ecclesiastical_district: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type RegistrationStatus = "pending" | "approved" | "rejected" | "cancelled";

export type Registration = {
  id: string;
  conference_id: string;
  idempotency_key: string;
  registration_code: string;
  full_name: string;
  sex: string;
  /** Estado civil ('Solteiro' | 'Casado'). Nullable para compatibilidade com registos históricos. */
  marital_status: string | null;
  /** Data de nascimento (YYYY-MM-DD). Nullable para compatibilidade com registos históricos. */
  birth_date: string | null;
  /** Faixa-etária calculada automaticamente ('Adolescente' | 'Jovem Regular'). Nullable para registos históricos. */
  age_group: string | null;
  /** Grau de escolaridade. Nullable para compatibilidade com registos históricos. */
  education_level: string | null;
  phone: string;
  /** E-mail do inscrito. Nullable para compatibilidade com registos anteriores à migração 00009. */
  email: string | null;
  organization_id: string | null;
  /** Cargo Pastoral do inscrito (coluna reutilizada; historicamente: Igreja Local/Congregação). */
  local_church: string;
  /** Intendência Eclesiástica (LC | VC | TBKK; histórico preservado). */
  ecclesiastical_district: string;
  municipality: string;
  /** Categoria de Membro ('Catecúmeno' | 'À Prova' | 'Efectivo'). Nullable para compatibilidade histórica. */
  member_category: string | null;
  organizational_role: string;
  /** Especificação da função histórica quando organizational_role = 'Outro'. Nullable. */
  custom_role: string | null;
  participant_category: string;
  delegation_responsible: string | null;
  status: RegistrationStatus;
  is_suspected_duplicate: boolean;
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  review_reason: string | null;
  created_at: string;
  updated_at: string;
};

export type AdminProfile = {
  id: string;
  display_name: string;
  email: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type AdminRoleName =
  | "super_admin"
  | "registration_admin"
  | "validator"
  | "accreditation_operator"
  | "attendance_operator"
  | "consultant";

export type AdminRole = {
  id: string;
  name: AdminRoleName;
  description: string | null;
};

export type AdminUserRole = {
  user_id: string;
  role_id: string;
};

export type AccreditationStatus = "credentialed" | "revoked";

export type Accreditation = {
  id: string;
  conference_id: string;
  registration_id: string;
  status: AccreditationStatus;
  credentialed_at: string;
  credentialed_by: string;
  revoked_at: string | null;
  revoked_by: string | null;
  reason: string | null;
  created_at: string;
  updated_at: string;
};

export type SessionStatus = "planned" | "open" | "closed" | "cancelled";

export type ConferenceSession = {
  id: string;
  conference_id: string;
  name: string;
  description: string | null;
  session_date: string;
  starts_at: string | null;
  ends_at: string | null;
  status: SessionStatus;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type AttendanceStatus = "present" | "voided";

export type AttendanceRecord = {
  id: string;
  conference_id: string;
  session_id: string;
  registration_id: string;
  status: AttendanceStatus;
  recorded_at: string;
  recorded_by: string;
  voided_at: string | null;
  voided_by: string | null;
  reason: string | null;
  created_at: string;
  updated_at: string;
};

export type AuditLog = {
  id: string;
  actor_user_id: string | null;
  conference_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  before_data: Json | null;
  after_data: Json | null;
  reason: string | null;
  created_at: string;
};

export type EventSetting = {
  id: string;
  conference_id: string;
  setting_key: string;
  setting_value: Json;
  updated_by: string | null;
  updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      conferences: {
        Row: Conference;
        Insert: Partial<Conference> & Pick<Conference, "name" | "slug">;
        Update: Partial<Conference>;
        Relationships: [];
      };
      organizations: {
        Row: Organization;
        Insert: Partial<Organization> &
          Pick<Organization, "name" | "municipality" | "ecclesiastical_district">;
        Update: Partial<Organization>;
        Relationships: [];
      };
      registrations: {
        Row: Registration;
        Insert: Partial<Registration> &
          Pick<
            Registration,
            | "conference_id"
            | "idempotency_key"
            | "registration_code"
            | "full_name"
            | "sex"
            | "phone"
            | "local_church"
            | "ecclesiastical_district"
            | "municipality"
            | "organizational_role"
            | "participant_category"
          >;
        Update: Partial<Registration>;
        Relationships: [];
      };
      admin_profiles: {
        Row: AdminProfile;
        Insert: Partial<AdminProfile> &
          Pick<AdminProfile, "id" | "display_name" | "email">;
        Update: Partial<AdminProfile>;
        Relationships: [];
      };
      admin_roles: {
        Row: AdminRole;
        Insert: Partial<AdminRole> & Pick<AdminRole, "name" | "description">;
        Update: Partial<AdminRole>;
        Relationships: [];
      };
      admin_user_roles: {
        Row: AdminUserRole;
        Insert: Partial<AdminUserRole> &
          Pick<AdminUserRole, "user_id" | "role_id">;
        Update: Partial<AdminUserRole>;
        Relationships: [];
      };
      accreditations: {
        Row: Accreditation;
        Insert: Partial<Accreditation> &
          Pick<
            Accreditation,
            "conference_id" | "registration_id" | "credentialed_by"
          >;
        Update: Partial<Accreditation>;
        Relationships: [];
      };
      sessions: {
        Row: ConferenceSession;
        Insert: Partial<ConferenceSession> &
          Pick<ConferenceSession, "conference_id" | "name" | "session_date">;
        Update: Partial<ConferenceSession>;
        Relationships: [];
      };
      attendance_records: {
        Row: AttendanceRecord;
        Insert: Partial<AttendanceRecord> &
          Pick<
            AttendanceRecord,
            | "conference_id"
            | "session_id"
            | "registration_id"
            | "recorded_by"
          >;
        Update: Partial<AttendanceRecord>;
        Relationships: [];
      };
      audit_logs: {
        Row: AuditLog;
        Insert: Pick<AuditLog, "action" | "entity_type" | "entity_id"> &
          Partial<AuditLog>;
        Update: never; // Imutável
        Relationships: [];
      };
      event_settings: {
        Row: EventSetting;
        Insert: Partial<EventSetting> &
          Pick<EventSetting, "conference_id" | "setting_key" | "setting_value">;
        Update: Partial<EventSetting>;
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      submit_public_registration: {
        Args: {
          p_conference_id: string;
          p_idempotency_key: string;
          p_full_name: string;
          p_sex: string;
          p_phone: string;
          p_email?: string | null;
          p_marital_status?: string | null;
          p_birth_date?: string | null;
          p_age_group?: string | null;
          p_education_level?: string | null;
          p_local_church?: string | null;
          p_ecclesiastical_district?: string | null;
          p_municipality?: string | null;
          p_member_category?: string | null;
          p_organizational_role?: string | null;
          p_custom_role?: string | null;
          p_participant_category?: string | null;
          p_delegation_responsible?: string | null;
          p_organization_id?: string | null;
        };
        Returns: Json;
      };
      change_registration_status: {
        Args: {
          p_registration_id: string;
          p_new_status: string;
          p_reason?: string | null;
        };
        Returns: Json;
      };
      process_accreditation: {
        Args: {
          p_conference_id: string;
          p_registration_id: string;
          p_notes?: string | null;
        };
        Returns: Json;
      };
      record_session_attendance: {
        Args: {
          p_conference_id: string;
          p_session_id: string;
          p_registration_id: string;
        };
        Returns: Json;
      };
      current_user_has_role: {
        Args: {
          required_role: string;
        };
        Returns: boolean;
      };
      is_active_admin: {
        Args: {
          [_ in never]: never;
        };
        Returns: boolean;
      };
    };
    Enums: {
      registration_status: RegistrationStatus;
      accreditation_status: AccreditationStatus;
      session_status: SessionStatus;
      attendance_status: AttendanceStatus;
      admin_role_name: AdminRoleName;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
