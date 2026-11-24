import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "III Sessão Bienal da Conferência Distrital da Juventude de Luanda",
  description:
    "Plataforma oficial de gestão, inscrição, credenciamento e presenças da Conferência Distrital da Juventude de Luanda.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt">
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
