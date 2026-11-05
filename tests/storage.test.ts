import { afterEach, describe, expect, it, vi } from "vitest";

const storageStore = new Map<string, string>();
const mockStorage = {
  getItem: (key: string) => storageStore.get(key) ?? null,
  setItem: (key: string, value: string) => {
    storageStore.set(key, value);
  },
  removeItem: (key: string) => {
    storageStore.delete(key);
  },
  clear: () => {
    storageStore.clear();
  },
};

Object.defineProperty(globalThis, "localStorage", {
  value: mockStorage,
  configurable: true,
});

Object.defineProperty(globalThis, "window", {
  value: { localStorage: mockStorage },
  configurable: true,
});

import {
  addHistoryEntry,
  clearHistory,
  clearRememberedCv,
  getHistoryEntries,
  getRememberedCv,
  removeHistoryEntry,
  saveRememberedCv,
} from "@/lib/storage";
import type { AnalysisResult } from "@/lib/types";

function makeAnalysis(overrides: Partial<AnalysisResult> = {}): AnalysisResult {
  return {
    uyumPuani: 80,
    gereksinimler: [],
    eksikBeceriler: [],
    anahtarKelimeler: [],
    onerilenCvMaddeleri: [],
    onYazi: "Merhaba",
    ...overrides,
  };
}

describe("storage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    storageStore.clear();
    mockStorage.getItem = (key: string) => storageStore.get(key) ?? null;
    mockStorage.setItem = (key: string, value: string) => {
      storageStore.set(key, value);
    };
    mockStorage.removeItem = (key: string) => {
      storageStore.delete(key);
    };
    mockStorage.clear = () => {
      storageStore.clear();
    };
  });

  it("kayıt ekler ve 30 kayıt sınırını korur", () => {
    for (let index = 0; index < 35; index += 1) {
      const next = addHistoryEntry({
        id: `entry-${index}`,
        date: new Date(2024, 0, index + 1).toISOString(),
        baslik: `İlan ${index + 1}`,
        puan: index + 1,
        analysis: makeAnalysis({ uyumPuani: index + 1 }),
        ilan: `İlan ${index + 1}`,
      });

      expect(next.length).toBe(Math.min(index + 1, 30));
    }

    expect(getHistoryEntries()).toHaveLength(30);
    expect(getHistoryEntries()[0].baslik).toBe("İlan 35");
  });

  it("tek kayıt siler", () => {
    const added = addHistoryEntry({
      id: "a1",
      date: new Date().toISOString(),
      baslik: "Başlık A",
      puan: 75,
      analysis: makeAnalysis({ uyumPuani: 75 }),
      ilan: "İlan A",
    });
    expect(added).toHaveLength(1);

    const afterRemove = removeHistoryEntry("a1");
    expect(afterRemove).toHaveLength(0);
    expect(getHistoryEntries()).toHaveLength(0);
  });

  it("tüm geçmiş ve kayıtlı CV'yi siler", () => {
    addHistoryEntry({
      id: "a1",
      date: new Date().toISOString(),
      baslik: "Başlık",
      puan: 90,
      analysis: makeAnalysis({ uyumPuani: 90 }),
      ilan: "İlan",
    });
    expect(saveRememberedCv("cv metni")).toBe(true);
    expect(getRememberedCv()).toBe("cv metni");

    clearHistory();
    clearRememberedCv();

    expect(getHistoryEntries()).toHaveLength(0);
    expect(getRememberedCv()).toBe("");
  });

  it("localStorage hatası olduğunda çökmez", () => {
    mockStorage.setItem = () => {
      throw new Error("blocked");
    };

    const entries = addHistoryEntry({
      id: "broken",
      date: new Date().toISOString(),
      baslik: "Broken",
      puan: 60,
      analysis: makeAnalysis({ uyumPuani: 60 }),
      ilan: "Broken",
    });
    expect(entries).toEqual([]);
    expect(() => saveRememberedCv("abc")).not.toThrow();
    expect(getRememberedCv()).toBe("");

    mockStorage.getItem = () => {
      throw new Error("read blocked");
    };
    expect(() => getHistoryEntries()).not.toThrow();
    expect(getHistoryEntries()).toEqual([]);
  });
});
