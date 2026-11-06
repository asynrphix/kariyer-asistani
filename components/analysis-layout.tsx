"use client";

import { type ChangeEvent, type DragEvent, useEffect, useMemo, useState } from "react";

import { extractCvTextFromFile, validateCvFile } from "@/lib/extract-cv";
import { parseLinkedInCompetitionMeta } from "@/lib/linkedin";
import { getUploadState } from "@/lib/upload-state";
import type { AnalysisHistoryEntry } from "@/lib/storage";
import type { AnalysisResult, RequirementStatus } from "@/lib/types";

const statusStyles: Record<RequirementStatus, string> = {
  var: "border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300",
  kismen: "border border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
  yok: "border border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/60 dark:text-red-300",
};

function CircularProgress({ value, colorClass }: { value: number; colorClass: string }) {
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative h-24 w-24">
      <svg className="h-24 w-24 -rotate-90" viewBox="0 0 100 100" aria-label="Uyum puanı">
        <circle cx="50" cy="50" r={radius} stroke="currentColor" strokeWidth="8" fill="transparent" className="text-violet-100 dark:text-violet-950/60" />
        <circle
          cx="50"
          cy="50"
          r={radius}
          stroke="currentColor"
          strokeWidth="8"
          strokeLinecap="round"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={colorClass}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold text-[#1E1B4B] dark:text-slate-100">{value}</span>
      </div>
    </div>
  );
}

function BadgeDot({ status }: { status: RequirementStatus }) {
  const palette: Record<RequirementStatus, string> = {
    var: "bg-emerald-500",
    kismen: "bg-amber-500",
    yok: "bg-red-500",
  };

  return <span className={`inline-block h-2.5 w-2.5 rounded-full ${palette[status]}`} />;
}

function EmptyState() {
  return (
    <div className="flex h-full items-center justify-center p-8 text-center">
      <div className="max-w-md space-y-3">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-100 text-violet-600 dark:bg-violet-950/60 dark:text-violet-300">
          <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v9A2.5 2.5 0 0 1 17.5 17H9l-5 4v-15.5Z" />
            <path d="M8 8h8M8 12h5" strokeLinecap="round" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-[#1E1B4B] dark:text-slate-100">İlanı ve CV'ni sol taraftan yapıştırın</h3>
        <p className="text-sm text-[#4B5563] dark:text-slate-400">
          Analiz Et’e bastığınızda uyum puanı, gereksinim karşılaştırması ve öneriler burada görünür.
        </p>
      </div>
    </div>
  );
}

function SkeletonCard({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl border border-[#ECE8F7] bg-[#F5F3FF] dark:border-slate-700 dark:bg-slate-800 ${className}`} />;
}

function MetricIcon({ kind }: { kind: "match" | "time" | "spark" | "trend" }) {
  const common = "h-4 w-4";

  if (kind === "match") {
    return (
      <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M8 12.5 10.6 15 16 9.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="12" cy="12" r="8" />
      </svg>
    );
  }

  if (kind === "time") {
    return (
      <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="12" cy="12" r="8" />
      </svg>
    );
  }

  if (kind === "spark") {
    return (
      <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 3v6m0 6v6M3 12h6m6 0h6" strokeLinecap="round" />
        <circle cx="12" cy="12" r="2.5" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 18.5V9.5m8 9V4.5m8 14V7.5" strokeLinecap="round" />
    </svg>
  );
}

export function AnalysisDashboard({
  ilan,
  cv,
  cvFile,
  setCvFile,
  setIlan,
  setCv,
  rememberCv,
  setRememberCv,
  historyEntries,
  onRestoreHistory,
  onDeleteHistory,
  onDeleteAllHistory,
  onExportHistory,
  loading,
  retrying,
  error,
  result,
  onAnalyze,
  onCopySummary,
}: {
  ilan: string;
  cv: string;
  cvFile: File | null;
  setCvFile: (value: File | null) => void;
  setIlan: (value: string) => void;
  setCv: (value: string) => void;
  rememberCv: boolean;
  setRememberCv: (value: boolean) => void;
  historyEntries: AnalysisHistoryEntry[];
  onRestoreHistory: (entry: AnalysisHistoryEntry) => void;
  onDeleteHistory: (id: string) => void;
  onDeleteAllHistory: () => void;
  onExportHistory: () => void;
  loading: boolean;
  retrying: boolean;
  error: string;
  result: AnalysisResult | null;
  onAnalyze: () => Promise<void> | void;
  onCopySummary: () => Promise<void> | void;
}) {
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [pendingDeleteAll, setPendingDeleteAll] = useState(false);
  const [activeTab, setActiveTab] = useState<"cv" | "onYazi" | "iskur" | "ozet">("cv");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [cvMode, setCvMode] = useState<"paste" | "file">("paste");
  const [cvFileName, setCvFileName] = useState("");
  const [cvFileMessage, setCvFileMessage] = useState("");
  const [cvFileError, setCvFileError] = useState("");
  const [cvLoadingFile, setCvLoadingFile] = useState(false);
  const [cvDropActive, setCvDropActive] = useState(false);

  const countWords = (value: string) => value.trim().split(/\s+/).filter(Boolean).length;

  async function handleCvFile(file: File) {
    try {
      setCvLoadingFile(true);
      setCvFileError("");
      setCvFileMessage("");
      validateCvFile(file);
      const extracted = await extractCvTextFromFile(file);
      const wordCount = countWords(extracted);
      setCvFile(file);
      setCvFileName(file.name);

      if (getUploadState(wordCount, file.type || file.name) === "metin-hazir") {
        setCv(extracted);
        setCvMode("paste");
        setCvFileMessage(`${file.name} dosyasından ${wordCount} kelime okundu. Lütfen kontrol et.`);
        return;
      }

      setCv("");
      setCvFileError("⚠️ Bu PDF'te seçilebilir metin yok. Şirketlerin ATS sistemleri bu CV'yi okuyamayabilir! CV'ni Word'den 'PDF olarak kaydet' ile yeniden oluşturmanı öneririz.");
    } catch (error) {
      setCvFile(null);
      setCvFileName("");
      setCvFileError(error instanceof Error ? error.message : "CV dosyası okunamadı.");
    } finally {
      setCvLoadingFile(false);
    }
  }

  async function handleCvFileSelection(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    await handleCvFile(file);
    event.target.value = "";
  }

  async function handleFileDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setCvDropActive(false);
    const file = event.dataTransfer.files?.[0];
    if (!file) return;
    await handleCvFile(file);
  }

  async function handleOcrFromPdf() {
    if (!cvFile) {
      setCvFileError("Görüntüden okunacak PDF bulunamadı.");
      return;
    }

    try {
      setCvLoadingFile(true);
      setCvFileError("");

      const formData = new FormData();
      formData.append("file", cvFile);
      const response = await fetch("/api/ocr", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json()) as { text?: string; error?: string };
      if (!response.ok || !payload.text) {
        throw new Error(payload.error ?? "PDF okunamadı.");
      }

      setCv(payload.text);
      setCvMode("paste");
      setCvFileMessage("Metin görüntüden okundu (OCR). Hatalar olabilir, lütfen dikkatlice kontrol et.");
      setCvFileName(cvFile.name);
      setCvFile(null);
    } catch (error) {
      setCvFile(null);
      setCvFileName("");
      setCvFileError(error instanceof Error ? error.message : "PDF görüntüden okunamadı.");
    } finally {
      setCvLoadingFile(false);
    }
  }

  useEffect(() => {
    try {
      const savedTheme = window.localStorage.getItem("career-theme");
      if (savedTheme === "dark" || savedTheme === "light") {
        setTheme(savedTheme);
      }
    } catch {
      // ignore storage issues
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");

    try {
      window.localStorage.setItem("career-theme", theme);
    } catch {
      // ignore storage issues
    }
  }, [theme]);

  const keywordMatch = useMemo(() => {
    if (!result?.anahtarKelimeler?.length) return { matches: 0, total: 0, percent: 0 };
    const matches = result.anahtarKelimeler.filter((item) => item.cvdeVar).length;
    return {
      matches,
      total: result.anahtarKelimeler.length,
      percent: Math.round((matches / result.anahtarKelimeler.length) * 100),
    };
  }, [result]);

  const scoreColor = useMemo(() => {
    const value = result?.uyumPuani ?? 0;
    if (value >= 75) return "text-emerald-600 dark:text-emerald-400";
    if (value >= 50) return "text-amber-600 dark:text-amber-400";
    return "text-red-600 dark:text-red-400";
  }, [result]);

  const linkedInCompetition = parseLinkedInCompetitionMeta(ilan);
  const competitionValue =
    result?.ilanOzeti?.pozisyonBasinaBasvuru !== undefined && result?.ilanOzeti?.pozisyonBasinaBasvuru !== null
      ? Number(result.ilanOzeti.pozisyonBasinaBasvuru)
      : linkedInCompetition ? Number(linkedInCompetition.value) : null;

  const competitionLevel = competitionValue === null ? "—" : competitionValue <= 5 ? "Düşük" : competitionValue <= 20 ? "Orta" : "Yüksek";
  const competitionTone =
    competitionValue === null ? "bg-slate-200 text-slate-600" : competitionValue <= 5 ? "bg-emerald-100 text-emerald-700" : competitionValue <= 20 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700";

  const requirementSummary = useMemo(() => {
    const required = result?.gereksinimler.filter((item) => item.tur === "zorunlu") ?? [];
    const preferred = result?.gereksinimler.filter((item) => item.tur === "tercih") ?? [];
    const tasks = result?.gereksinimler.filter((item) => item.tur === "gorev") ?? [];
    const requiredMet = required.filter((item) => item.durum === "var").length;
    const preferredMet = preferred.filter((item) => item.durum === "var").length;
    const taskMet = tasks.filter((item) => item.durum === "var").length;
    return {
      requiredMet,
      requiredTotal: required.length,
      preferredMet,
      preferredTotal: preferred.length,
      taskMet,
      taskTotal: tasks.length,
      hasMissingMandatory: required.some((item) => item.durum === "yok"),
    };
  }, [result]);

  const summaryCards = [
    {
      title: "Uyum Puanı",
      value: result ? `${result.uyumPuani}` : "--",
      hint: result
        ? `Zorunlu: ${requirementSummary.requiredMet}/${requirementSummary.requiredTotal} · Tercih: ${requirementSummary.preferredMet}/${requirementSummary.preferredTotal} · Görev: ${requirementSummary.taskMet}/${requirementSummary.taskTotal} · Anahtar kelime: %${keywordMatch.percent}`
        : "İlan ile CV eşleşmesi",
      tone: "violet" as const,
      icon: "spark" as const,
    },
    {
      title: "Anahtar Kelime Eşleşmesi",
      value: result ? `${keywordMatch.matches}/${keywordMatch.total}` : "--",
      hint: result ? `${keywordMatch.percent}% uyum` : "",
      tone: "teal" as const,
      icon: "match" as const,
    },
    {
      title: "Son Başvuruya Kalan Gün",
      value: result?.ilanOzeti?.sonBasvuruyaKalanGun !== undefined ? `${result.ilanOzeti.sonBasvuruyaKalanGun}` : "—",
      hint: result?.ilanOzeti?.sonBasvuruTarihi ?? "İlan İŞKUR değilse gösterilmez",
      tone: "pink" as const,
      icon: "time" as const,
    },
    {
      title: "Rekabet",
      value: competitionValue === null ? "—" : `~${Math.round(competitionValue)} aday`,
      hint:
        result?.ilanOzeti?.basvuruSayisi !== undefined && result?.ilanOzeti?.pozisyonSayisi !== undefined
          ? `${result.ilanOzeti.basvuruSayisi} başvuru · ${result.ilanOzeti.pozisyonSayisi} pozisyon`
          : linkedInCompetition
            ? `${linkedInCompetition.label}`
            : "",
      tone: "peach" as const,
      icon: "trend" as const,
    },
  ];

  const cardPalette: Record<string, { wrap: string; icon: string; value: string }> = {
    violet: {
      wrap: "bg-[#F3EEFF] text-violet-700 border border-violet-100 dark:bg-violet-950/30 dark:text-violet-200 dark:border-violet-900",
      icon: "bg-violet-100 text-violet-600 dark:bg-violet-900/50 dark:text-violet-300",
      value: "text-[#1E1B4B] dark:text-slate-100",
    },
    teal: {
      wrap: "bg-[#E6FAF7] text-teal-700 border border-teal-100 dark:bg-teal-950/30 dark:text-teal-200 dark:border-teal-900",
      icon: "bg-teal-100 text-teal-600 dark:bg-teal-900/50 dark:text-teal-300",
      value: "text-[#1E1B4B] dark:text-slate-100",
    },
    pink: {
      wrap: "bg-[#FFEEF6] text-pink-700 border border-pink-100 dark:bg-pink-950/30 dark:text-pink-200 dark:border-pink-900",
      icon: "bg-pink-100 text-pink-500 dark:bg-pink-900/50 dark:text-pink-300",
      value: "text-[#1E1B4B] dark:text-slate-100",
    },
    peach: {
      wrap: "bg-[#FFF3E8] text-orange-600 border border-orange-100 dark:bg-orange-950/30 dark:text-orange-200 dark:border-orange-900",
      icon: "bg-orange-100 text-orange-500 dark:bg-orange-900/50 dark:text-orange-300",
      value: "text-[#1E1B4B] dark:text-slate-100",
    },
  };

  return (
    <main className="h-screen overflow-hidden bg-[#F7F5FF] text-[#1E1B4B] transition-colors duration-200 dark:bg-[#1A1730] dark:text-slate-100">
      <div className="relative flex h-full flex-col lg:flex-row">
        <button
          type="button"
          onClick={() => setTheme((prev) => (prev === "light" ? "dark" : "light"))}
          className="absolute right-4 top-4 z-20 inline-flex items-center gap-2 rounded-full border border-[#E7E2F7] bg-white/90 px-3 py-1.5 text-xs font-semibold text-[#1E1B4B] shadow-sm backdrop-blur-sm transition hover:bg-violet-50 dark:border-slate-700 dark:bg-[#24203D]/90 dark:text-slate-100 dark:hover:bg-slate-700"
        >
          <span>{theme === "light" ? "Koyu tema ☾" : "Açık tema ☀"}</span>
        </button>

        <aside
          className={`flex shrink-0 flex-col border-r border-[#EAE4F8] bg-white/95 backdrop-blur-sm transition-all duration-200 dark:border-slate-700 dark:bg-[#24203D]/95 ${
            leftCollapsed ? "w-full max-w-[88px] lg:w-[88px]" : "w-full max-w-[360px] lg:w-[360px]"
          }`}
        >
          <div className="flex items-center justify-between border-b border-[#F0EBFA] px-4 py-4 dark:border-slate-700">
            <div className={`${leftCollapsed ? "hidden" : "block"}`}>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-violet-600">Kariyer Asistanı</p>
              <div className="mt-2 flex items-center gap-2">
                <h1 className="text-2xl font-bold text-[#1E1B4B] dark:text-slate-100">İlan–CV Uyum</h1>
                <button
                  type="button"
                  onClick={() => setShowHistory((prev) => !prev)}
                  className="rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-violet-700 transition hover:bg-violet-100 dark:border-violet-900 dark:bg-violet-950/40 dark:text-violet-200"
                >
                  Geçmiş
                </button>
              </div>
            </div>
            {result ? (
              <button
                type="button"
                onClick={() => setLeftCollapsed((prev) => !prev)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#EAE4F8] bg-[#F5F3FF] text-[#4B5563] transition hover:bg-violet-100 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
                aria-label="Paneli daralt/genişlet"
              >
                {leftCollapsed ? "→" : "←"}
              </button>
            ) : null}
          </div>

          {!leftCollapsed && showHistory ? (
            <div className="border-b border-[#F0EBFA] bg-[#F9F7FF] p-4 dark:border-slate-700 dark:bg-slate-800/80">
              <div className="mb-3 rounded-xl border border-violet-100 bg-white px-2.5 py-2 text-[11px] text-violet-700 dark:border-violet-900 dark:bg-slate-900 dark:text-violet-200">
                🔒 Geçmişin sadece bu tarayıcıda saklanır, sunucumuza gönderilmez.
              </div>

              <div className="max-h-72 space-y-2 overflow-y-auto">
                {historyEntries.length === 0 ? (
                  <p className="text-sm text-[#4B5563] dark:text-slate-300">Henüz kayıt yok.</p>
                ) : (
                  historyEntries.map((entry) => (
                    <div key={entry.id} className="flex items-center gap-2 rounded-xl border border-[#EAE4F8] bg-white p-2 dark:border-slate-700 dark:bg-slate-900">
                      <button
                        type="button"
                        onClick={() => {
                          onRestoreHistory(entry);
                          setShowHistory(false);
                        }}
                        className="flex min-w-0 flex-1 items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-violet-50 dark:hover:bg-slate-800"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-[#1E1B4B] dark:text-slate-100">
                            {entry.baslik ?? entry.firma ?? "İlan"}
                          </span>
                          <span className="block text-[11px] text-[#4B5563] dark:text-slate-400">
                            {new Date(entry.date).toLocaleDateString("tr-TR")}
                          </span>
                        </span>
                        <span className={`inline-flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-[11px] font-bold ${entry.puan >= 75 ? "bg-emerald-100 text-emerald-700" : entry.puan >= 50 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
                          {entry.puan}
                        </span>
                      </button>
                      <button
                        type="button"
                        aria-label="Kaydı sil"
                        onClick={() => onDeleteHistory(entry.id)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
                      >
                        🗑️
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={onExportHistory}
                  className="flex-1 rounded-xl border border-violet-200 bg-white px-2.5 py-2 text-xs font-semibold text-violet-700 hover:bg-violet-50 dark:border-violet-900 dark:bg-slate-900 dark:text-violet-200"
                >
                  Verilerimi dışa aktar
                </button>

                <button
                  type="button"
                  onClick={() => setPendingDeleteAll(true)}
                  className="flex-1 rounded-xl border border-red-200 bg-red-50 px-2.5 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
                >
                  Tüm verilerimi sil
                </button>
              </div>
            </div>
          ) : null}

          {pendingDeleteAll ? (
            <div className="border-b border-[#F0EBFA] bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/30">
              <p className="text-sm font-medium text-red-700 dark:text-red-200">
                Tüm analiz geçmişin ve kayıtlı CV'n bu tarayıcıdan silinecek. Bu işlem geri alınamaz.
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onDeleteAllHistory();
                    setPendingDeleteAll(false);
                  }}
                  className="flex-1 rounded-xl bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-500"
                >
                  Sil
                </button>
                <button
                  type="button"
                  onClick={() => setPendingDeleteAll(false)}
                  className="flex-1 rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-700 dark:border-red-800 dark:bg-slate-900 dark:text-red-200"
                >
                  İptal
                </button>
              </div>
            </div>
          ) : null}

          <div className={`flex-1 space-y-5 overflow-y-auto p-4 ${leftCollapsed ? "hidden" : "block"}`}>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-[#4B5563] dark:text-slate-300">İş İlanı</label>
              <textarea
                value={ilan}
                onChange={(event) => setIlan(event.target.value)}
                placeholder="İlan metnini buraya yapıştırın..."
                className="h-52 w-full resize-none rounded-2xl border border-[#EAE4F8] bg-[#F9F7FF] p-3 text-sm leading-6 text-[#1E1B4B] placeholder:text-[#6B7280] outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-400 dark:focus:border-violet-500 dark:focus:ring-violet-900/50"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label className="block text-sm font-semibold text-[#4B5563] dark:text-slate-300">CV</label>
                <div className="inline-flex overflow-hidden rounded-xl border border-[#EAE4F8] bg-[#F7F5FF] p-0.5 dark:border-slate-700 dark:bg-slate-800">
                  {(["paste", "file"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setCvMode(mode)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                        cvMode === mode
                          ? "bg-violet-600 text-white shadow-sm"
                          : "text-[#4B5563] hover:bg-violet-50 dark:text-slate-300 dark:hover:bg-slate-700"
                      }`}
                    >
                      {mode === "paste" ? "Metin yapıştır" : "Dosya yükle"}
                    </button>
                  ))}
                </div>
              </div>

              {cvFileMessage ? (
                <p className="text-xs text-violet-700 dark:text-violet-300">{cvFileMessage}</p>
              ) : null}

              <label className="mt-2 flex items-center gap-2 text-xs text-[#4B5563] dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={rememberCv}
                  onChange={(event) => setRememberCv(event.target.checked)}
                  className="h-4 w-4 rounded border-[#D9D3EE] text-violet-600 focus:ring-violet-500"
                />
                CV'mi bu tarayıcıda hatırla
              </label>

              {cvMode === "paste" ? (
                <textarea
                  value={cv}
                  onChange={(event) => setCv(event.target.value)}
                  placeholder="CV metnini buraya yapıştırın..."
                  className="h-52 w-full resize-none rounded-2xl border border-[#EAE4F8] bg-[#F9F7FF] p-3 text-sm leading-6 text-[#1E1B4B] placeholder:text-[#6B7280] outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-400 dark:focus:border-violet-500 dark:focus:ring-violet-900/50"
                />
              ) : (
                <div
                  onDragOver={(event) => {
                    event.preventDefault();
                    setCvDropActive(true);
                  }}
                  onDragLeave={() => setCvDropActive(false)}
                  onDrop={handleFileDrop}
                  className={`rounded-2xl border border-dashed p-4 text-center ${
                    cvDropActive
                      ? "border-violet-400 bg-violet-50 dark:bg-violet-950/30"
                      : "border-[#EAE4F8] bg-[#F9F7FF] dark:border-slate-600 dark:bg-slate-800"
                  }`}
                >
                  <input
                    type="file"
                    accept=".pdf,.docx"
                    className="hidden"
                    data-cv-file-input="true"
                    onChange={handleCvFileSelection}
                  />
                  <div className="space-y-3">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-600 dark:bg-violet-900/50 dark:text-violet-300">
                      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M12 16V4m0 0 4 4m-4-4-4 4M4 16.5v1A2.5 2.5 0 0 0 6.5 20h11A2.5 2.5 0 0 0 20 17.5v-1" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <p className="text-sm text-[#4B5563] dark:text-slate-300">
                      PDF veya DOCX dosyasını sürükleyip bırakın
                    </p>
                    <button
                      type="button"
                      onClick={() => document.querySelector<HTMLInputElement>('input[data-cv-file-input="true"]')?.click()}
                      className="inline-flex items-center justify-center rounded-xl bg-violet-600 px-3 py-2 text-sm font-semibold text-white hover:bg-violet-500 disabled:cursor-not-allowed disabled:bg-violet-200 disabled:text-violet-700"
                    >
                      Dosya seç
                    </button>
                  </div>
                </div>
              )}

              {cvLoadingFile ? (
                <div className="rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-sm text-violet-700 dark:border-violet-900 dark:bg-violet-950/40 dark:text-violet-300">
                  Dosya okunuyor...
                </div>
              ) : null}

              {cvFileError ? (
                <div className="space-y-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                  <p>{cvFileError}</p>
                  {cvFileError.includes("Bu PDF'te seçilebilir metin yok") ? (
                    <>
                      <button
                        type="button"
                        onClick={handleOcrFromPdf}
                        className="rounded-lg border border-red-200 bg-white px-2.5 py-1.5 font-medium text-red-700 hover:bg-red-50 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200"
                      >
                        Görüntüden oku
                      </button>
                      <p className="text-[11px] text-red-600 dark:text-red-300">
                        PDF, metne çevrilmek üzere Google Gemini'ye gönderilir; görüntüdeki iletişim bilgileri önceden silinemez.
                      </p>
                    </>
                  ) : null}
                </div>
              ) : null}
            </div>

            <button
              type="button"
              onClick={onAnalyze}
              disabled={loading || !ilan.trim() || !cv.trim()}
              className="inline-flex w-full items-center justify-center rounded-2xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:bg-violet-200 disabled:text-violet-700 dark:disabled:bg-violet-900/60 dark:disabled:text-violet-200"
            >
              {loading ? "Analiz ediliyor..." : "Analiz Et"}
            </button>

            {retrying && loading ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                Servis yoğun, tekrar deneniyor...
              </div>
            ) : null}

            {error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/60 dark:text-red-300">
                {error}
              </div>
            ) : null}
          </div>
        </aside>

        <section className="flex-1 overflow-hidden bg-[#F7F5FF] dark:bg-[#1A1730]">
          {!result && !loading ? (
            <EmptyState />
          ) : (
            <div className="h-full overflow-y-auto p-4 md:p-6">
              {loading ? (
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, index) => (
                      <SkeletonCard key={index} className="h-28" />
                    ))}
                  </div>
                  <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
                    <SkeletonCard className="h-[320px]" />
                    <div className="space-y-6">
                      <SkeletonCard className="h-52" />
                      <SkeletonCard className="h-52" />
                    </div>
                  </div>
                  <SkeletonCard className="h-[200px]" />
                </div>
              ) : (
                result && (
                  <div className="space-y-6">
                    {result.cached ? (
                      <div className="flex justify-end pr-16">
                        <span className="inline-flex items-center rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-violet-700 dark:border-violet-900 dark:bg-violet-950/40 dark:text-violet-300">
                          Önbellekten
                        </span>
                      </div>
                    ) : null}
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                      {summaryCards.map((card) => {
                        const palette = cardPalette[card.tone];
                        return (
                          <div key={card.title} className={`rounded-2xl border p-4 shadow-sm ${palette.wrap}`}>
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] opacity-80">{card.title}</p>
                              <div className={`inline-flex h-8 w-8 items-center justify-center rounded-xl ${palette.icon}`}>
                                <MetricIcon kind={card.icon} />
                              </div>
                            </div>

                            {card.title === "Uyum Puanı" ? (
                              <>
                                <div className="mt-4 flex justify-center">
                                  <CircularProgress
                                    value={result.uyumPuani}
                                    colorClass={
                                      result.uyumPuani >= 75
                                        ? "text-emerald-500"
                                        : result.uyumPuani >= 50
                                          ? "text-amber-500"
                                          : "text-red-500"
                                    }
                                  />
                                </div>
                                <div className="mt-3 text-center">
                                  <p className="mt-1 text-[11px] text-violet-700 dark:text-violet-300">{card.hint}</p>
                                  {requirementSummary.hasMissingMandatory ? (
                                    <p className="mt-1 text-[10px] font-semibold text-red-600 dark:text-red-400">Zorunlu şart eksik</p>
                                  ) : null}
                                </div>
                              </>
                            ) : (
                              <>
                                <p className={`mt-3 text-2xl font-bold ${palette.value}`}>{card.value}</p>
                                {card.hint ? <p className="mt-2 text-xs opacity-75">{card.hint}</p> : null}
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
                      <div className="rounded-2xl border border-[#ECE8F7] bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-[#24203D]">
                        <div className="mb-4 flex items-center justify-between">
                          <h2 className="text-lg font-semibold text-[#1E1B4B] dark:text-slate-100">Gereksinimler</h2>
                        </div>
                        <div className="overflow-auto">
                          <table className="min-w-full text-left text-sm">
                            <thead>
                              <tr className="border-b border-[#F0EBFA] text-[#4B5563] dark:border-slate-700 dark:text-slate-300">
                                <th className="pb-3 pr-4 font-medium">Gereksinim</th>
                                <th className="pb-3 pr-4 font-medium">Tür</th>
                                <th className="pb-3 pr-4 font-medium">Durum</th>
                                <th className="pb-3 font-medium">Kanit</th>
                              </tr>
                            </thead>
                            <tbody>
                              {result.gereksinimler.map((item, index) => (
                                <tr key={`${item.madde}-${index}`} className="border-b border-[#F5F3FF] align-top dark:border-slate-800">
                                  <td className="py-3 pr-4">
                                    <div className="flex items-center gap-2">
                                      <span className="inline-flex rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-700 dark:border-violet-900 dark:bg-violet-950/40 dark:text-violet-300">
                                        {item.kaynak === "nitelik" ? "Nitelik" : "Görev"}
                                      </span>
                                      <span className="font-medium text-[#1E1B4B] dark:text-slate-100">{item.madde}</span>
                                    </div>
                                  </td>
                                  <td className="py-3 pr-4 text-[#4B5563] dark:text-slate-300">{item.tur === "zorunlu" ? "Zorunlu" : item.tur === "tercih" ? "Tercih" : "Görev"}</td>
                                  <td className="py-3 pr-4">
                                    <span className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[item.durum]}`}>
                                      <BadgeDot status={item.durum} />
                                      {item.durum === "var" ? "Var" : item.durum === "kismen" ? "Kısmen" : "Yok"}
                                    </span>
                                  </td>
                                  <td className="py-3 text-[#4B5563] dark:text-slate-300">
                                    <div className="space-y-1">
                                      <span>{item.kanit || "-"}</span>
                                      {item.durum === "var" && item.kanitGucu === "zayif" ? (
                                        <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
                                          sadece beceri listesinde
                                        </span>
                                      ) : null}
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="rounded-2xl border border-[#ECE8F7] bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-[#24203D]">
                          <h3 className="mb-4 text-lg font-semibold text-[#1E1B4B] dark:text-slate-100">Eksik Beceriler</h3>
                          <div className="flex flex-wrap gap-2">
                            {result.eksikBeceriler.length ? (
                              result.eksikBeceriler.map((skill) => (
                                <span key={skill} className="rounded-full border border-pink-200 bg-pink-50 px-2.5 py-1 text-xs font-medium text-pink-700 dark:border-pink-900 dark:bg-pink-950/40 dark:text-pink-300">
                                  {skill}
                                </span>
                              ))
                            ) : (
                              <span className="text-sm text-[#4B5563] dark:text-slate-400">Eksik beceri yok.</span>
                            )}
                          </div>
                        </div>

                        <div className="rounded-2xl border border-[#ECE8F7] bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-[#24203D]">
                          <h3 className="mb-4 text-lg font-semibold text-[#1E1B4B] dark:text-slate-100">Anahtar Kelimeler</h3>
                          <div className="flex flex-wrap gap-2">
                            {result.anahtarKelimeler.map((keyword) => (
                              <span
                                key={keyword.kelime}
                                title={keyword.eslesenTerim ? `Eşleşen terim: ${keyword.eslesenTerim}` : undefined}
                                className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                                  keyword.cvdeVar
                                    ? "border border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-900 dark:bg-teal-950/40 dark:text-teal-300"
                                    : "border border-slate-200 bg-slate-100 text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
                                }`}
                              >
                                {keyword.kelime}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-[#ECE8F7] bg-white shadow-sm dark:border-slate-700 dark:bg-[#24203D]">
                      <div className="flex flex-wrap gap-2 border-b border-[#F0EBFA] p-3 dark:border-slate-700">
                        {[
                          { key: "cv", label: "CV Önerileri" },
                          { key: "onYazi", label: "Ön Yazı" },
                          { key: "iskur", label: "İŞKUR Profil Önerileri" },
                          { key: "ozet", label: "İlan Özeti" },
                        ].map((tab) => (
                          <button
                            key={tab.key}
                            type="button"
                            onClick={() => setActiveTab(tab.key as typeof activeTab)}
                            className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
                              activeTab === tab.key
                                ? "bg-violet-600 text-white shadow-sm"
                                : "bg-[#F5F3FF] text-[#4B5563] hover:bg-violet-100 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
                            }`}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>

                      <div className="p-4">
                        {activeTab === "cv" ? (
                          <ul className="list-disc space-y-3 pl-5 text-sm leading-6 text-[#4B5563] dark:text-slate-300">
                            {result.onerilenCvMaddeleri.map((item) => (
                              <li key={item}>{item}</li>
                            ))}
                          </ul>
                        ) : null}

                        {activeTab === "onYazi" ? (
                          <div className="space-y-4">
                            <div className="flex justify-end">
                              <button
                                type="button"
                                onClick={onCopySummary}
                                className="rounded-xl border border-[#EAE4F8] bg-[#F7F5FF] px-3 py-2 text-sm font-medium text-[#1E1B4B] transition hover:bg-violet-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
                              >
                                Kopyala
                              </button>
                            </div>
                            <p className="whitespace-pre-line text-sm leading-7 text-[#4B5563] dark:text-slate-300">
                              {result.onYazi}
                            </p>
                          </div>
                        ) : null}

                        {activeTab === "iskur" ? (
                          result.iskurProfilOnerileri && result.iskurProfilOnerileri.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {result.iskurProfilOnerileri.map((item) => (
                                <span key={item} className="rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700 dark:border-violet-900 dark:bg-violet-950/40 dark:text-violet-300">
                                  {item}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-[#4B5563] dark:text-slate-400">İŞKUR profili için öneri bulunmadı.</p>
                          )
                        ) : null}

                        {activeTab === "ozet" ? (
                          result.ilanOzeti ? (
                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                              <div className="rounded-xl bg-[#F7F5FF] p-3 dark:bg-slate-800">
                                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#4B5563] dark:text-slate-400">Firma</p>
                                <p className="mt-2 text-sm font-semibold text-[#1E1B4B] dark:text-slate-100">{result.ilanOzeti.firma ?? "-"}</p>
                              </div>
                              <div className="rounded-xl bg-[#F7F5FF] p-3 dark:bg-slate-800">
                                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#4B5563] dark:text-slate-400">İlan no</p>
                                <p className="mt-2 text-sm font-semibold text-[#1E1B4B] dark:text-slate-100">{result.ilanOzeti.ilanNo ?? "-"}</p>
                              </div>
                              <div className="rounded-xl bg-[#F7F5FF] p-3 dark:bg-slate-800">
                                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#4B5563] dark:text-slate-400">Başvuru tarihi</p>
                                <p className="mt-2 text-sm font-semibold text-[#1E1B4B] dark:text-slate-100">{result.ilanOzeti.sonBasvuruTarihi ?? "-"}</p>
                              </div>
                              <div className="rounded-xl bg-[#F7F5FF] p-3 dark:bg-slate-800">
                                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#4B5563] dark:text-slate-400">Deneyim</p>
                                <p className="mt-2 text-sm font-semibold text-[#1E1B4B] dark:text-slate-100">{result.ilanOzeti.deneyimYili ?? "-"}</p>
                              </div>
                              <div className="rounded-xl bg-[#F7F5FF] p-3 dark:bg-slate-800 md:col-span-2 xl:col-span-2">
                                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#4B5563] dark:text-slate-400">İrtibat e-posta</p>
                                <p className="mt-2 break-all text-sm font-semibold text-[#1E1B4B] dark:text-slate-100">{result.ilanOzeti.irtibatEposta ?? "-"}</p>
                              </div>
                              <div className="rounded-xl bg-[#F7F5FF] p-3 dark:bg-slate-800 md:col-span-2 xl:col-span-2">
                                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#4B5563] dark:text-slate-400">Yayın tarihi</p>
                                <p className="mt-2 text-sm font-semibold text-[#1E1B4B] dark:text-slate-100">{result.ilanOzeti.yayinTarihi ?? "-"}</p>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-[#4B5563] dark:text-slate-400">İlan özeti mevcut değil.</p>
                          )
                        ) : null}
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
