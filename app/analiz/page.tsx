"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { AnalysisDashboard } from "@/components/analysis-layout";
import { ChatPanel } from "@/components/ChatPanel";
import demoResult from "@/lib/demo-result.json";
import { DEMO_CV_TEXT, DEMO_ILAN_TEXT } from "@/lib/demo-data";
import { addHistoryEntry, clearHistory, clearRememberedCv, exportHistoryToJson, getHistoryEntries, getRememberedCv, removeHistoryEntry, saveRememberedCv, updateHistoryEntry, type AnalysisHistoryEntry } from "@/lib/storage";
import type { AnalysisResult } from "@/lib/types";

function getResultTitle(result: AnalysisResult | null, fallbackIlan: string): string {
  if (!result) return "Adsız ilan";
  const firma = result.firma ?? result.ilanOzeti?.firma;
  const pozisyon = result.pozisyon ?? result.ilanOzeti?.meslek;
  if (firma && pozisyon) return `${firma} — ${pozisyon}`;
  if (firma) return firma;
  if (pozisyon) return pozisyon;
  const firstLine = fallbackIlan.split(/\r?\n/).map((line) => line.trim()).find(Boolean) ?? "Adsız ilan";
  return firstLine || "Adsız ilan";
}

function AnalysisPageContent() {
  const searchParams = useSearchParams();
  const isDemoMode = searchParams.get("ornek") === "1";
  const rememberedCv = getRememberedCv();
  const [ilan, setIlan] = useState(() => (isDemoMode ? DEMO_ILAN_TEXT : ""));
  const [cv, setCv] = useState(() => (isDemoMode ? DEMO_CV_TEXT : rememberedCv));
  const [rememberCv, setRememberCv] = useState(() => Boolean(rememberedCv));
  const [history, setHistory] = useState<AnalysisHistoryEntry[]>(() => getHistoryEntries());
  const [resultTitle, setResultTitle] = useState<string>(() => getResultTitle(isDemoMode ? (demoResult as AnalysisResult) : null, isDemoMode ? DEMO_ILAN_TEXT : ""));
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(() => (isDemoMode ? (demoResult as AnalysisResult) : null));

  useEffect(() => {
    if (rememberCv) {
      saveRememberedCv(cv);
    } else {
      clearRememberedCv();
    }
  }, [rememberCv, cv]);

  async function handleAnalyze() {
    if (isDemoMode) {
      return;
    }

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

      const nextTitle = resultTitle.trim() || getResultTitle(data, ilan);
      const firma = data.firma ?? data.ilanOzeti?.firma ?? "İlan";
      const entry: AnalysisHistoryEntry = {
        id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        date: new Date().toISOString(),
        firma,
        baslik: nextTitle,
        puan: data.uyumPuani,
        analysis: data,
        ilan,
      };

      setResultTitle(nextTitle);
      setActiveHistoryId(entry.id);
      setHistory(addHistoryEntry(entry));
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

  function handleRestoreHistory(entry: AnalysisHistoryEntry) {
    setActiveHistoryId(entry.id);
    setResultTitle(entry.baslik || getResultTitle(entry.analysis, entry.ilan));
    setIlan(entry.ilan);
    setResult(entry.analysis);
    setError("");
  }

  function handleTitleChange(nextTitle: string) {
    const cleaned = nextTitle.trim() || getResultTitle(result, ilan);
    setResultTitle(cleaned);
    if (!activeHistoryId) {
      return;
    }
    setHistory(() => updateHistoryEntry(activeHistoryId, { baslik: cleaned }));
  }

  function handleDeleteHistory(id: string) {
    setHistory(() => removeHistoryEntry(id));
  }

  function handleDeleteAllHistory() {
    setHistory([]);
    clearHistory();
    clearRememberedCv();
    setRememberCv(false);
  }

  function handleExportHistory() {
    const blob = exportHistoryToJson(history);
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "kariyer-asistani-gecmisi.json";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden">
      {isDemoMode ? (
        <div className="border-b border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-700 shadow-sm dark:border-violet-900 dark:bg-violet-950/40 dark:text-violet-200">
          <span>Bu örnek bir analizdir. Kendi ilanın ve CV&apos;ninle denemek için </span>
          <a href="/analiz" className="font-semibold underline underline-offset-2">Analize başla</a>
        </div>
      ) : null}

      <AnalysisDashboard
        ilan={ilan}
        cv={cv}
        cvFile={cvFile}
        setCvFile={setCvFile}
        setIlan={setIlan}
        setCv={setCv}
        rememberCv={rememberCv}
        setRememberCv={setRememberCv}
        historyEntries={history}
        onRestoreHistory={handleRestoreHistory}
        onDeleteHistory={handleDeleteHistory}
        onDeleteAllHistory={handleDeleteAllHistory}
        onExportHistory={handleExportHistory}
        loading={loading}
        retrying={retrying}
        error={error}
        result={result}
        resultTitle={resultTitle}
        onTitleChange={handleTitleChange}
        onAnalyze={isDemoMode ? async () => undefined : handleAnalyze}
        onCopySummary={copySummary}
        isDemoMode={isDemoMode}
      />

      {isDemoMode ? (
        <div className="pointer-events-none absolute bottom-6 right-6 z-30 rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-sm text-slate-600 shadow-lg backdrop-blur dark:border-slate-700 dark:bg-slate-900/90 dark:text-slate-200">
          Örnek modda sohbet kullanılamaz.
        </div>
      ) : (
        <ChatPanel ilan={ilan} cv={cv} analysis={result} />
      )}
    </div>
  );
}

export default function AnalysisPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#F7F5FF] text-[#1E1B4B] dark:bg-[#1A1730] dark:text-slate-100">Yükleniyor...</div>}>
      <AnalysisPageContent />
    </Suspense>
  );
}
