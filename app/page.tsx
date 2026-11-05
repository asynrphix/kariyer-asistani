"use client";

import { useState } from "react";

import type { AnalysisResult, RequirementStatus } from "@/lib/types";

const statusStyles: Record<RequirementStatus, string> = {
  var: "border border-emerald-200 bg-emerald-100 text-emerald-800",
  kismen: "border border-amber-200 bg-amber-100 text-amber-800",
  yok: "border border-red-200 bg-red-100 text-red-800",
};

const scoreStyles = (score: number) => {
  if (score >= 80) return "text-emerald-600";
  if (score >= 60) return "text-amber-600";
  return "text-red-600";
};

export default function Home() {
  const [ilan, setIlan] = useState("");
  const [cv, setCv] = useState("");
  const [loading, setLoading] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);

  async function handleAnalyze() {
    setLoading(true);
    setRetrying(true);
    setError("");

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ilan, cv }),
      });

      const data = (await response.json()) as AnalysisResult & { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Analiz sırasında bir hata oluştu.");
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analiz sırasında bir hata oluştu.");
      setResult(null);
    } finally {
      setLoading(false);
      setRetrying(false);
    }
  }

  async function copySummary() {
    if (!result?.onYazi) return;

    await navigator.clipboard.writeText(result.onYazi);
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-800 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-indigo-600">
                Kariyer Asistanı
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                İlan–CV Uyum Analizi
              </h1>
            </div>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-2">
          <label className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <span className="mb-3 block text-lg font-semibold text-slate-900">İş İlanı</span>
            <textarea
              value={ilan}
              onChange={(event) => setIlan(event.target.value)}
              placeholder="İlan metnini buraya yapıştırın..."
              className="min-h-[360px] w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
            />
          </label>

          <label className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <span className="mb-3 block text-lg font-semibold text-slate-900">CV</span>
            <textarea
              value={cv}
              onChange={(event) => setCv(event.target.value)}
              placeholder="CV metnini buraya yapıştırın..."
              className="min-h-[360px] w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
            />
          </label>
        </section>

        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={loading || !ilan.trim() || !cv.trim()}
            className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {loading ? "Analiz ediliyor..." : "Analiz Et"}
          </button>
          <span className="text-sm text-slate-500">Lütfen metinler temiz ve okunabilir olsun.</span>
        </div>

        {retrying && loading ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            Servis yoğun, tekrar deneniyor...
          </div>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {result ? (
          <section className="space-y-6">
            {result.ilanOzeti ? (
              <div className="rounded-3xl bg-indigo-50 p-5 shadow-sm ring-1 ring-indigo-100">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h2 className="text-xl font-semibold text-slate-900">İlan Özeti</h2>
                  <span className="rounded-full bg-indigo-600 px-3 py-1 text-xs font-medium text-white">
                    {result.ilanOzeti.firma ?? "Firma bilgisi yok"}
                  </span>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-2xl bg-white p-4 shadow-sm">
                    <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">İlan no</p>
                    <p className="mt-2 text-base font-semibold text-slate-900">
                      {result.ilanOzeti.ilanNo ?? "-"}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white p-4 shadow-sm">
                    <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Son başvuru</p>
                    <p className="mt-2 text-base font-semibold text-slate-900">
                      {result.ilanOzeti.sonBasvuruTarihi ?? "-"}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white p-4 shadow-sm">
                    <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Kalan gün</p>
                    <p className="mt-2 text-base font-semibold text-slate-900">
                      {result.ilanOzeti.sonBasvuruyaKalanGun ?? "-"}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white p-4 shadow-sm">
                    <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Pozisyon başına başvuru</p>
                    <p className="mt-2 text-base font-semibold text-slate-900">
                      {result.ilanOzeti.pozisyonBasinaBasvuru ?? "-"}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl bg-white p-4 shadow-sm">
                    <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Deneyim</p>
                    <p className="mt-2 text-sm font-semibold text-slate-800">
                      {result.ilanOzeti.deneyimYili ?? "-"}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white p-4 shadow-sm">
                    <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">İrtibat e-posta</p>
                    <p className="mt-2 break-all text-sm font-semibold text-slate-800">
                      {result.ilanOzeti.irtibatEposta ?? "-"}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white p-4 shadow-sm">
                    <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Çalışma şekli</p>
                    <p className="mt-2 text-sm font-semibold text-slate-800">
                      {result.ilanOzeti.calismaSekli ?? "-"}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">
                    Uyum puanı
                  </p>
                  <h2 className="mt-1 text-2xl font-bold text-slate-900">İlan ile CV eşleşmesi</h2>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-5xl font-black ${scoreStyles(result.uyumPuani)}`}>
                    {result.uyumPuani}
                  </span>
                  <span className="text-2xl font-semibold text-slate-500">/ 100</span>
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <h3 className="mb-4 text-xl font-semibold text-slate-900">Gereksinimler</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-600">
                      <th className="pb-3 pr-4 font-medium">Gereksinim</th>
                      <th className="pb-3 pr-4 font-medium">Tür</th>
                      <th className="pb-3 pr-4 font-medium">Durum</th>
                      <th className="pb-3 font-medium">Kanit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.gereksinimler.map((item, index) => (
                      <tr key={`${item.madde}-${index}`} className="border-b border-slate-100 align-top">
                        <td className="py-3 pr-4 font-medium text-slate-800">{item.madde}</td>
                        <td className="py-3 pr-4 text-slate-600">
                          {item.tur === "zorunlu" ? "Zorunlu" : "Tercih"}
                        </td>
                        <td className="py-3 pr-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[item.durum]}`}
                          >
                            {item.durum === "var"
                              ? "Var"
                              : item.durum === "kismen"
                                ? "Kısmen"
                                : "Yok"}
                          </span>
                        </td>
                        <td className="py-3 text-slate-600">{item.kanit || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <h3 className="mb-4 text-xl font-semibold text-slate-900">Eksik beceriler</h3>
                <div className="flex flex-wrap gap-2">
                  {result.eksikBeceriler.length ? (
                    result.eksikBeceriler.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-sm font-medium text-red-700"
                      >
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-slate-500">Eksik beceri bulunamadı.</span>
                  )}
                </div>
              </div>

              <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <h3 className="mb-4 text-xl font-semibold text-slate-900">Anahtar kelimeler</h3>
                <div className="flex flex-wrap gap-2">
                  {result.anahtarKelimeler.map((keyword) => (
                    <span
                      key={keyword.kelime}
                      className={`rounded-full px-3 py-1 text-sm font-medium ${
                        keyword.cvdeVar
                          ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border border-slate-200 bg-slate-100 text-slate-500"
                      }`}
                    >
                      {keyword.kelime}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {result.iskurProfilOnerileri && result.iskurProfilOnerileri.length > 0 ? (
              <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <h3 className="mb-4 text-xl font-semibold text-slate-900">İŞKUR profil önerileri</h3>
                <div className="flex flex-wrap gap-2">
                  {result.iskurProfilOnerileri.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <h3 className="mb-4 text-xl font-semibold text-slate-900">Önerilen CV maddeleri</h3>
              <ul className="list-disc space-y-3 pl-5 text-slate-700">
                {result.onerilenCvMaddeleri.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="text-xl font-semibold text-slate-900">Ön yazı taslağı</h3>
                <button
                  type="button"
                  onClick={copySummary}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  Kopyala
                </button>
              </div>
              <p className="whitespace-pre-line text-base leading-7 text-slate-700">
                {result.onYazi}
              </p>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
