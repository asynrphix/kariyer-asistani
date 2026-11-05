import type { AnalysisResult } from "@/lib/types";

export const HISTORY_STORAGE_KEY = "kariyer-asistani:v1:history";
export const REMEMBERED_CV_KEY = "kariyer-asistani:v1:remembered-cv";

export interface AnalysisHistoryEntry {
  id: string;
  date: string;
  firma?: string;
  baslik: string;
  puan: number;
  analysis: AnalysisResult;
  ilan: string;
}

function safeStorage() {
  if (typeof window !== "undefined" && window.localStorage) {
    return window.localStorage;
  }

  if (typeof globalThis !== "undefined" && "localStorage" in globalThis) {
    return globalThis.localStorage as Storage;
  }

  return null;
}

function readJson<T>(key: string): T | null {
  try {
    const storage = safeStorage();
    if (!storage) {
      return null;
    }

    const raw = storage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJson<T>(key: string, value: T): boolean {
  try {
    const storage = safeStorage();
    if (!storage) {
      return false;
    }

    storage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function removeKey(key: string): boolean {
  try {
    const storage = safeStorage();
    if (!storage) {
      return false;
    }

    storage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

export function getHistoryEntries(): AnalysisHistoryEntry[] {
  const data = readJson<AnalysisHistoryEntry[]>(HISTORY_STORAGE_KEY);
  return Array.isArray(data) ? data : [];
}

export function addHistoryEntry(entry: AnalysisHistoryEntry): AnalysisHistoryEntry[] {
  const entries = getHistoryEntries();
  const next = [entry, ...entries].slice(0, 30);
  if (!writeJson(HISTORY_STORAGE_KEY, next)) {
    return [];
  }
  return next;
}

export function removeHistoryEntry(id: string): AnalysisHistoryEntry[] {
  const next = getHistoryEntries().filter((item) => item.id !== id);
  if (next.length === 0) {
    removeKey(HISTORY_STORAGE_KEY);
  } else if (!writeJson(HISTORY_STORAGE_KEY, next)) {
    return [];
  }
  return next;
}

export function clearHistory(): void {
  removeKey(HISTORY_STORAGE_KEY);
}

export function saveRememberedCv(content: string): boolean {
  if (!content || !content.trim()) {
    return clearRememberedCv();
  }

  return writeJson(REMEMBERED_CV_KEY, content);
}

export function getRememberedCv(): string {
  const value = readJson<string>(REMEMBERED_CV_KEY);
  return typeof value === "string" ? value : "";
}

export function clearRememberedCv(): boolean {
  return removeKey(REMEMBERED_CV_KEY);
}

export function exportHistoryToJson(entries: AnalysisHistoryEntry[]): Blob {
  return new Blob([JSON.stringify(entries, null, 2)], { type: "application/json" });
}
