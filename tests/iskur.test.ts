import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { getIskurGeminiText, parseIskurIlan } from "../lib/iskur";

const fixture = readFileSync(new URL("./fixtures/mentor4b.txt", import.meta.url), "utf8");

describe("parseIskurIlan", () => {
  it("İŞKUR ilanı doğru alanları çıkarır", () => {
    const result = parseIskurIlan(fixture);

    expect(result).not.toBeNull();
    expect(result?.ilanNo).toBe("00009879345");
    expect(result?.firma).toMatch(/^MENTOR4B/);
    expect(result?.yayinTarihi).toBe("29.10.2026");
    expect(result?.sonBasvuruTarihi).toBe("26.11.2026");
    expect(result?.basvuruSayisi).toBe(99);
    expect(result?.pozisyonSayisi).toBe(10);
    expect(result?.goruntulenmeSayisi).toBe(1104);
    expect(result?.calismaSekli).toBe("Tam Zamanlı");
    expect(result?.meslek).toBe("Yapay Zeka Programcısı");
    expect(result?.deneyimYili).toBe(1);
    expect(result?.irtibatEposta).toBe("mehmet.cavus@mentor4b.com");
  });

  it("Gemini için temizlenmiş metin uyarı metinlerini ve iletişim bilgilerini çıkarmaz", () => {
    const cleaned = getIskurGeminiText(fixture);

    expect(cleaned).toContain("Görev ve Sorumluluklar");
    expect(cleaned).toContain("Nitelik ve Beceriler");
    expect(cleaned).not.toMatch(/İŞSİZLİK ÖDENEĞİ/i);
    expect(cleaned).not.toMatch(/SOSYAL YARDIM/i);
    expect(cleaned).not.toMatch(/\b(?:\+?\d[\d\s\-()]{9,}\d)\b/);
    expect(cleaned).not.toMatch(/[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}/i);
  });
});
