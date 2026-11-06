"use client";

import Link from "next/link";
import { useEffect } from "react";

import demoResult from "@/lib/demo-result.json";
import { formatPercent } from "@/lib/format";

function PreviewCard() {
  return (
    <div className="w-full max-w-xl rounded-[28px] border border-[#EAE4F8] bg-white p-5 shadow-[0_20px_50px_rgba(91,33,182,0.08)] dark:border-slate-700 dark:bg-[#24203D] dark:shadow-black/20">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-600 dark:text-violet-300">Uyum puanı</p>
          <h3 className="mt-2 text-3xl font-black text-[#1E1B4B] dark:text-slate-100">{formatPercent(demoResult.uyumPuani)}</h3>
        </div>
        <div className="relative h-20 w-20">
          <svg className="h-20 w-20 -rotate-90" viewBox="0 0 100 100" aria-label="Uyum puanı">
            <circle cx="50" cy="50" r="32" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-violet-100 dark:text-violet-950/60" />
            <circle cx="50" cy="50" r="32" stroke="currentColor" strokeWidth="8" strokeLinecap="round" fill="transparent" strokeDasharray={201} strokeDashoffset={30} className="text-violet-600 dark:text-violet-400" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-[#1E1B4B] dark:text-slate-100">{formatPercent(demoResult.uyumPuani)}</div>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {[
          ["Zorunlu", "6/9", "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"],
          ["Tercih", "4/9", "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"],
          ["Görev", "5/6", "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300"],
        ].map(([label, value, classes]) => (
          <div key={label} className="flex items-center justify-between rounded-2xl border border-[#F0EBFA] bg-[#F9F7FF] px-3 py-2 dark:border-slate-700 dark:bg-slate-800/80">
            <span className="text-sm text-[#4B5563] dark:text-slate-300">{label}</span>
            <span className={`rounded-full px-2 py-1 text-xs font-semibold ${classes}`}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ExampleReportPreview() {
  const selectedRequirements = [
    demoResult.gereksinimler.find((item) => item.tur === "zorunlu" && item.durum === "var") ?? demoResult.gereksinimler[0],
    demoResult.gereksinimler.find((item) => item.tur === "zorunlu" && item.durum === "kismen") ?? demoResult.gereksinimler[5],
    demoResult.gereksinimler.find((item) => item.tur === "tercih" && item.durum === "var") ?? demoResult.gereksinimler[10],
    demoResult.gereksinimler.find((item) => item.tur === "gorev" && item.durum === "var") ?? demoResult.gereksinimler[2],
    demoResult.gereksinimler.find((item) => item.durum === "yok") ?? { madde: "Docker veya konteyner araçlarıyla çalışma bilgisi", tur: "tercih", durum: "yok", kanit: "CV'de yok" },
  ].filter(Boolean);

  const statusMap = {
    var: { label: "Var", icon: "✓", className: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300" },
    kismen: { label: "Kısmen", icon: "◐", className: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300" },
    yok: { label: "Yok", icon: "✕", className: "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300" },
  } as const;

  return (
    <div className="w-full rounded-[28px] border border-[#EAE4F8] bg-white p-5 shadow-[0_20px_50px_rgba(91,33,182,0.08)] dark:border-slate-700 dark:bg-[#24203D] dark:shadow-black/20">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-600 dark:text-violet-300">Örnek rapor</p>
          <h3 className="mt-2 text-xl font-black text-[#1E1B4B] dark:text-slate-100">{demoResult.firma || "Örnek Firma"} — {demoResult.pozisyon || "Yazılım Geliştirici"}</h3>
        </div>
        <div className="rounded-full bg-violet-100 px-3 py-1 text-sm font-bold text-violet-700 dark:bg-violet-950/40 dark:text-violet-300">
          {formatPercent(demoResult.uyumPuani)}
        </div>
      </div>

      <div className="space-y-3">
        {selectedRequirements.slice(0, 5).map((item, index) => {
          const detail = statusMap[item.durum as keyof typeof statusMap] ?? statusMap.var;
          const turLabel = item.tur === "zorunlu" ? "Zorunlu" : item.tur === "tercih" ? "Tercih" : "Görev";

          return (
            <div key={`${item.madde}-${index}`} className="flex items-center justify-between gap-3 rounded-2xl border border-[#F0EBFA] bg-[#F9F7FF] px-3 py-2 dark:border-slate-700 dark:bg-slate-800/80">
              <div className="flex min-w-0 items-center gap-2">
                <span className={`inline-flex items-center justify-center rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-[0.12em] ${detail.className}`} title={detail.label}>{detail.icon} {detail.label}</span>
                <span className="line-clamp-1 text-sm text-[#4B5563] dark:text-slate-300">{item.madde}</span>
              </div>
              <span className="rounded-full bg-violet-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-violet-700 dark:bg-violet-950/40 dark:text-violet-300">
                {turLabel}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {demoResult.anahtarKelimeler.map((keyword) => (
          <span
            key={keyword.kelime}
            title={keyword.cvdeVar ? "CV'de eşleşen anahtar kelime" : "CV'de yok"}
            className={keyword.cvdeVar
              ? "rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
              : "rounded-full border border-dashed border-slate-300 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-500 dark:border-slate-600 dark:bg-slate-900/70 dark:text-slate-400"}
          >
            {keyword.kelime}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  useEffect(() => {
    const elements = document.querySelectorAll(".reveal-section");
    if (!elements.length) {
      return;
    }

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      elements.forEach((element) => {
        element.classList.add("is-visible");
      });
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
          }
        });
      },
      { threshold: 0.15 },
    );

    elements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, []);

  return (
    <main className="min-h-screen bg-[#F7F5FF] text-[#1E1B4B] dark:bg-[#1A1730] dark:text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-4 rounded-full border border-[#EAE4F8] bg-white/80 px-4 py-3 shadow-sm backdrop-blur-sm dark:border-slate-700 dark:bg-[#24203D]/80 sm:px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-600 text-lg font-bold text-white" aria-hidden="true">K</div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-600 dark:text-violet-300">Kariyer Asistanı</p>
              <p className="text-sm font-semibold">İlan–CV Uyumu</p>
            </div>
          </div>
          <nav className="hidden items-center gap-6 text-sm text-[#4B5563] md:flex dark:text-slate-300">
            <Link href="/analiz" className="transition hover:text-violet-600 dark:hover:text-violet-300">Analiz</Link>
            <Link href="/gizlilik" className="transition hover:text-violet-600 dark:hover:text-violet-300">Gizlilik</Link>
            <a href="https://github.com/asynrphix/kariyer-asistani" target="_blank" rel="noreferrer" className="transition hover:text-violet-600 dark:hover:text-violet-300">GitHub</a>
          </nav>
        </header>

        <section className="reveal-section grid items-center gap-10 pb-14 pt-10 sm:pt-12 lg:grid-cols-[1.1fr_0.9fr] lg:pb-20 lg:pt-18">
          <div>
            <div className="mb-5 inline-flex items-center rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700 dark:border-violet-900 dark:bg-violet-950/40 dark:text-violet-300">
              Ücretsiz ve açık kaynak
            </div>
            <h1 className="max-w-xl text-4xl font-black tracking-tight text-[#1E1B4B] sm:text-5xl dark:text-slate-100">
              İlanı yapıştır, CV&apos;ni ekle, eksiklerini 30 saniyede gör.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-[#4B5563] dark:text-slate-300">
              İŞKUR ve LinkedIn ilanlarıyla çalışan, ücretsiz ve açık kaynak ilan–CV uyum asistanı.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/analiz" className="inline-flex min-h-11 items-center justify-center rounded-full bg-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-500 dark:shadow-violet-900/30">
                Analize başla
              </Link>
              <Link href="/analiz?ornek=1" className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#D9D3EE] bg-white px-6 py-3 text-sm font-semibold text-[#1E1B4B] transition hover:bg-violet-50 dark:border-slate-700 dark:bg-[#24203D] dark:text-slate-100 dark:hover:bg-slate-800">
                Örnek analizi gör
              </Link>
            </div>

            <div className="mt-8 text-sm text-[#4B5563] dark:text-slate-300">
              <span className="font-semibold text-violet-700 dark:text-violet-300">Puanlar tahminidir;</span> gerçek işe alım sistemleri farklı çalışabilir.
            </div>
          </div>

          <div className="flex justify-center lg:justify-end">
            <PreviewCard />
          </div>
        </section>

        <section className="reveal-section py-8">
          <div className="mb-8 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-600 dark:text-violet-300">Nasıl çalışır</p>
            <h2 className="mt-3 text-3xl font-black text-[#1E1B4B] dark:text-slate-100">3 adımda net sonuç</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {[
              ["1", "İlanı yapıştır", "İŞKUR veya LinkedIn ilan metnini kopyala ve analiz alanına koy."],
              ["2", "CV&apos;ni ekle", "Metni yapıştır veya PDF/Word dosyasını yükle; içeriği tarayıcıda okunur."],
              ["3", "Sonuçları gör", "Uygunluk puanı, boşlukları, önerilen CV maddelerini ve ön yazıyı izle."],
            ].map(([step, title, desc]) => (
              <div key={step} className="rounded-3xl border border-[#EAE4F8] bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-[#24203D]">
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-100 text-sm font-bold text-violet-700 dark:bg-violet-950/40 dark:text-violet-300">{step}</div>
                <h3 className="text-xl font-bold text-[#1E1B4B] dark:text-slate-100">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#4B5563] dark:text-slate-300">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="reveal-section py-8">
          <div className="mb-8 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-600 dark:text-violet-300">Örnek rapor</p>
            <h2 className="mt-3 text-3xl font-black text-[#1E1B4B] dark:text-slate-100">Gerçek örnek analiz önizlemesi</h2>
          </div>
          <div className="mx-auto max-w-3xl">
            <ExampleReportPreview />
          </div>
          <div className="mt-6 flex justify-center">
            <Link href="/analiz?ornek=1" className="inline-flex min-h-11 items-center justify-center rounded-full bg-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-500 dark:shadow-violet-900/30">
              Tam örnek raporu aç
            </Link>
          </div>
        </section>

        <section className="reveal-section py-8">
          <div className="mb-8 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-600 dark:text-violet-300">Özellikler</p>
            <h2 className="mt-3 text-3xl font-black text-[#1E1B4B] dark:text-slate-100">Açık, dürüst ve kullanıcı dostu</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {[
              "Zorunlu/tercih/görev ayrımı ve kanıtlı değerlendirme",
              "Anahtar kelime eşleşmesi ve eksik beceriler",
              "Resim olarak kaydedilmiş PDF uyarısı: ATS bu metni okuyamayabilir",
              "Ön yazı, İŞKUR profil önerileri ve önerilen CV maddeleri",
              "Asistan soruları yanıtlar; kayıt yok, geçmiş sadece senin tarayıcında",
              "Gelişmiş güvenlik: telefon, e-posta ve adres verisi temizlenir",
            ].map((feature) => (
              <div key={feature} className="rounded-3xl border border-[#EAE4F8] bg-white p-5 text-sm leading-6 text-[#4B5563] shadow-sm dark:border-slate-700 dark:bg-[#24203D] dark:text-slate-300">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300" aria-hidden="true">✓</span>
                <p className="mt-4">{feature}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="reveal-section py-8">
          <div className="mb-8 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-600 dark:text-violet-300">SSS</p>
            <h2 className="mt-3 text-3xl font-black text-[#1E1B4B] dark:text-slate-100">ATS bana puan mı veriyor?</h2>
          </div>
          <div className="mx-auto max-w-3xl rounded-[28px] border border-[#EAE4F8] bg-white p-6 text-sm leading-7 text-[#4B5563] shadow-sm dark:border-slate-700 dark:bg-[#24203D] dark:text-slate-300">
            Bu oran, ilan gereksinimlerinin CV&apos;nde ne kadar karşılandığının tahminidir. Gerçek ATS sistemleri genellikle tek bir yüzde puanı vermez; CV&apos;yi metne çevirip anahtar kelimelerle arar. Bu araç, iş ilanı ve CV içeriğini karşılaştırırken daha sade ve anlaşılır bir fikir sunar.
          </div>
        </section>
      </div>
    </main>
  );
}
