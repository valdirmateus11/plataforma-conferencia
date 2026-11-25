import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { CONFERENCE_CONFIG } from "@/lib/config";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);

const metaTitle = `${CONFERENCE_CONFIG.editionLabel} da ${CONFERENCE_CONFIG.shortName}`;
const metaDescription = `Plataforma oficial da ${CONFERENCE_CONFIG.orgName} (${CONFERENCE_CONFIG.orgAcronym}) — ${CONFERENCE_CONFIG.churchName}. Tema: ${CONFERENCE_CONFIG.theme} (${CONFERENCE_CONFIG.themeRef}). ${CONFERENCE_CONFIG.dateRange}, ${CONFERENCE_CONFIG.venue}.`;

export const metadata: Metadata = {
  ...(siteUrl ? { metadataBase: new URL(siteUrl) } : {}),
  title: {
    default: metaTitle,
    template: `%s | ${CONFERENCE_CONFIG.orgAcronym} — Conferência Distrital`,
  },
  description: metaDescription,
  openGraph: {
    type: "website",
    locale: "pt_AO",
    title: metaTitle,
    description: metaDescription,
    siteName: `${CONFERENCE_CONFIG.orgAcronym} — ${CONFERENCE_CONFIG.shortName}`,
    images: [
      {
        url: "/images/flyer-oficial.jpg",
        width: 819,
        height: 1024,
        alt: `Flyer Oficial — ${metaTitle}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: metaTitle,
    description: metaDescription,
    images: ["/images/flyer-oficial.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt" className={inter.variable}>
      <body className="min-h-screen flex flex-col bg-[#F1F5F9] font-sans text-slate-900 antialiased selection:bg-emerald-100 selection:text-emerald-900">
        {children}
      </body>
    </html>
  );
}
