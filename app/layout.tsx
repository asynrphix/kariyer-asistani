import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "İlan–CV Uyum Analizi",
  description: "İş ilanı ile CV arasındaki uyumu analiz eden araç.",
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
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
