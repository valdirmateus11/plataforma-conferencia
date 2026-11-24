import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "III Sessão Bienal Ordinária da Conferência Distrital da Juventude de Luanda 2026",
  description:
    "Plataforma oficial da Direcção Distrital da Juventude de Luanda (D.D.J.L) — Igreja Metodista Unida. Tema: Avivados e Santificados em Cristo, Sejamos a Carta para o Mundo (Actos 2:42-47, I Coríntios 3:2-3). 21-24 de Janeiro de 2026, Cargo Pastoral Monte Sinai.",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon.png", type: "image/png" },
    ],
    shortcut: "/icon.png",
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/apple-icon.png" />
      </head>
      <body className="min-h-screen flex flex-col bg-[#F1F5F9] text-slate-900 antialiased selection:bg-emerald-100 selection:text-emerald-900">
        {children}
      </body>
    </html>
  );
}
