import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";

import { SiteFooter } from "@/components/site-footer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Kariyer Asistanı — Ücretsiz İlan–CV Uyum Analizi",
  description:
    "İŞKUR ve LinkedIn ilanlarını CV'nle karşılaştır; eksik becerileri, anahtar kelimeleri ve önerileri saniyeler içinde gör. Ücretsiz, kayıt yok, açık kaynak.",
  openGraph: {
    title: "Kariyer Asistanı — Ücretsiz İlan–CV Uyum Analizi",
    description:
      "İŞKUR ve LinkedIn ilanlarını CV'nle karşılaştır; eksik becerileri, anahtar kelimeleri ve önerileri saniyeler içinde gör.",
    url: SITE_URL,
    siteName: "Kariyer Asistanı",
    type: "website",
    locale: "tr_TR",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kariyer Asistanı — Ücretsiz İlan–CV Uyum Analizi",
    description:
      "İŞKUR ve LinkedIn ilanlarını CV'nle karşılaştır; eksik becerileri, anahtar kelimeleri ve önerileri saniyeler içinde gör.",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const themeScript = `
    (function() {
      try {
        const saved = localStorage.getItem('career-theme');
        const shouldUseDark = saved === 'dark';
        document.documentElement.classList.toggle('dark', shouldUseDark);
      } catch (e) {
        document.documentElement.classList.remove('dark');
      }
    })();
  `;

  return (
    <html
      lang="tr"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#F7F5FF] text-[#1E1B4B] dark:bg-[#1A1730] dark:text-slate-100">
        <Script id="theme-script" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: themeScript }} />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
