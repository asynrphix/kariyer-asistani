"use client";

import { useEffect, useState } from "react";

import { AnalysisDashboard } from "@/components/analysis-layout";
import { ChatPanel } from "@/components/ChatPanel";
import { addHistoryEntry, clearHistory, clearRememberedCv, exportHistoryToJson, getHistoryEntries, getRememberedCv, removeHistoryEntry, saveRememberedCv, type AnalysisHistoryEntry } from "@/lib/storage";
import type { AnalysisResult } from "@/lib/types";

export default function Home() {
  const [ilan, setIlan] = useState("");
  const [cv, setCv] = useState("");
  const [rememberCv, setRememberCv] = useState(false);
  const [history, setHistory] = useState<AnalysisHistoryEntry[]>([]);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);

  useEffect(() => {
    const savedCv = getRememberedCv();
    setRememberCv(Boolean(savedCv));
    if (savedCv) {
      setCv(savedCv);
    }

    setHistory(getHistoryEntries());
  }, []);

  useEffect(() => {
    if (rememberCv) {
      saveRememberedCv(cv);
    } else {
      clearRememberedCv();
    }
  }, [rememberCv, cv]);

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

      const firstLine = ilan.split(/\r?\n/).map((line) => line.trim()).find(Boolean) ?? "İlan";
      const firma = data.firma ?? data.ilanOzeti?.firma ?? "İlan";
      const pozisyon = data.pozisyon ?? data.ilanOzeti?.meslek ?? firstLine;
      const entry: AnalysisHistoryEntry = {
        id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        date: new Date().toISOString(),
        firma,
        baslik: data.pozisyon || data.ilanOzeti?.meslek ? `${pozisyon} — ${firma}` : firstLine,
        puan: data.uyumPuani,
        analysis: data,
        ilan,
      };

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
    setIlan(entry.ilan);
    setResult(entry.analysis);
    setError("");
  }

  function handleDeleteHistory(id: string) {
    setHistory((current) => removeHistoryEntry(id));
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
    <div className="relative h-screen w-full overflow-hidden">
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
        onAnalyze={handleAnalyze}
        onCopySummary={copySummary}
      />
      <ChatPanel ilan={ilan} cv={cv} analysis={result} />
    </div>
  );
}
