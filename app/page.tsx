"use client";

import { useState } from "react";

import { AnalysisDashboard } from "@/components/analysis-layout";
import { ChatPanel } from "@/components/ChatPanel";
import type { AnalysisResult } from "@/lib/types";

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
    <div className="relative h-screen w-full overflow-hidden">
      <AnalysisDashboard
        ilan={ilan}
        cv={cv}
        setIlan={setIlan}
        setCv={setCv}
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
