/**
 * Utilitário seguro para validação e leitura de variáveis de ambiente do Supabase.
 * Garante que segredos nunca sejam expostos em logs ou no cliente.
 */

export interface EnvDiagnostics {
  supabaseUrl: {
    defined: boolean;
    validFormat: boolean;
    maskedValue: string;
  };
  supabaseAnonKey: {
    defined: boolean;
    length: number;
    isPlaceholder: boolean;
  };
  supabaseServiceRoleKey: {
    defined: boolean;
    length: number;
    isPlaceholder: boolean;
  };
  appUrl: {
    defined: boolean;
    value: string;
  };
  readyForClient: boolean;
  readyForServer: boolean;
}

const PLACEHOLDER_PATTERNS = [
  "your-anon-key",
  "your-anon-key-here",
  "your-service-role-key",
  "your-service-role-key-here",
  "your-project-id",
];

function checkIsPlaceholder(val: string): boolean {
  if (!val) return true;
  return PLACEHOLDER_PATTERNS.some((p) => val.toLowerCase().includes(p));
}

export function getSupabaseEnvDiagnostics(): EnvDiagnostics {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || "";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || "";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || "";

  let validUrl = false;
  let maskedUrl = "";
  try {
    if (url && (url.startsWith("https://") || url.startsWith("http://"))) {
      const parsed = new URL(url);
      validUrl = true;
      const host = parsed.hostname;
      if (host.length > 12) {
        maskedUrl = `${parsed.protocol}//${host.slice(0, 6)}...${host.slice(-6)}`;
      } else {
        maskedUrl = `${parsed.protocol}//${host}`;
      }
    }
  } catch {
    validUrl = false;
  }

  const isAnonPlaceholder = checkIsPlaceholder(anonKey);
  const isServicePlaceholder = checkIsPlaceholder(serviceKey);

  return {
    supabaseUrl: {
      defined: Boolean(url),
      validFormat: validUrl,
      maskedValue: validUrl ? maskedUrl : "indefinido/inválido",
    },
    supabaseAnonKey: {
      defined: Boolean(anonKey),
      length: anonKey.length,
      isPlaceholder: isAnonPlaceholder,
    },
    supabaseServiceRoleKey: {
      defined: Boolean(serviceKey),
      length: serviceKey.length,
      isPlaceholder: isServicePlaceholder,
    },
    appUrl: {
      defined: Boolean(appUrl),
      value: appUrl || "http://localhost:3000",
    },
    readyForClient: Boolean(url && validUrl && anonKey && !isAnonPlaceholder),
    readyForServer: Boolean(url && validUrl && anonKey && !isAnonPlaceholder),
  };
}

export function validatePublicSupabaseEnv(): { url: string; anonKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !anonKey) {
    throw new Error(
      "As variáveis NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY são obrigatórias."
    );
  }

  if (checkIsPlaceholder(url) || checkIsPlaceholder(anonKey)) {
    throw new Error(
      "As variáveis do Supabase contêm valores placeholder padrão. Configure valores válidos no ficheiro .env.local."
    );
  }

  return { url, anonKey };
}
