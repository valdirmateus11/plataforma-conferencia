import Image from "next/image";
import Link from "next/link";

interface ConferenceLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  variant?: "light" | "dark";
  href?: string;
  className?: string;
}

export function ConferenceLogo({
  size = "md",
  showText = true,
  variant = "light",
  href,
  className = "",
}: ConferenceLogoProps) {
  const dimensions = {
    sm: { px: 32, box: "w-8 h-8", textTitle: "text-xs", textSub: "text-[9px]" },
    md: { px: 44, box: "w-11 h-11", textTitle: "text-sm", textSub: "text-[10px]" },
    lg: { px: 64, box: "w-16 h-16", textTitle: "text-base", textSub: "text-xs" },
    xl: { px: 88, box: "w-22 h-22", textTitle: "text-lg", textSub: "text-xs" },
  }[size];

  const content = (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Logótipo Oficial DDJL */}
      <div
        className={`relative ${dimensions.box} shrink-0 rounded-2xl bg-white shadow-sm ring-1 ring-slate-900/5 flex items-center justify-center overflow-hidden p-0.5`}
      >
        <Image
          src="/images/logo-ddjl-badge.png"
          alt="Logótipo D.D.J.L - Direcção Distrital da Juventude de Luanda"
          width={dimensions.px}
          height={dimensions.px}
          priority
          className="w-full h-full object-contain"
        />
      </div>

      {showText && (
        <div className="overflow-hidden leading-snug">
          <p
            className={`font-black uppercase tracking-wider ${
              variant === "dark" ? "text-white" : "text-slate-900"
            } ${dimensions.textTitle}`}
          >
            DDJL
          </p>
          <p
            className={`font-semibold uppercase tracking-wide truncate ${
              variant === "dark" ? "text-emerald-400" : "text-emerald-800"
            } ${dimensions.textSub}`}
          >
            Igreja Metodista Unida
          </p>
          <p
            className={`truncate text-[9px] ${
              variant === "dark" ? "text-slate-400" : "text-slate-500"
            }`}
          >
            IIIª Sessão Bienal Ordinária
          </p>
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-block transition-opacity hover:opacity-95">
        {content}
      </Link>
    );
  }

  return content;
}
