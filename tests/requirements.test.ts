import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { cleanLinkedInJobText, extractLinkedInMeta, parseLinkedInCompetitionMeta } from "@/lib/linkedin";
import { extractRequirements } from "@/lib/requirements";

describe("extractRequirements", () => {
  it("RockSoft LinkedIn metninden görev, zorunlu ve tercih maddelerini doğru çıkarır", () => {
    const raw = readFileSync(new URL("./fixtures/rocksoft-linkedin.txt", import.meta.url), "utf8");
    const cleaned = cleanLinkedInJobText(raw);
    const requirements = extractRequirements(cleaned);

    const gorev = requirements.filter((item) => item.kaynak === "gorev").length;
    const zorunlu = requirements.filter((item) => item.kaynak === "nitelik" && item.tur === "zorunlu").length;
    const tercih = requirements.filter((item) => item.kaynak === "nitelik" && item.tur === "tercih").length;

    expect(gorev).toBe(6);
    expect(zorunlu).toBe(9);
    expect(tercih).toBe(9);
    expect(requirements.some((item) => item.madde.includes("C++ programlama deneyimi") && item.tur === "tercih")).toBe(true);
    expect(requirements.some((item) => item.madde.includes("Linux ortamında temel düzeyde çalışma deneyimi") && item.tur === "zorunlu")).toBe(true);

    const zorunluList = requirements.filter((item) => item.kaynak === "nitelik" && item.tur === "zorunlu").map((item) => item.madde);
    const expectedZorunlu = [
      "Elektrik-Elektronik, Bilgisayar, Yazılım Mühendisliği veya ilgili mühendislik bölümlerinden mezun",
      "Yeni mezun veya tercihen 0–2 yıl profesyonel deneyime sahip",
      "C programlama dilinin temel kavramlarına hâkimiyet",
      "Pointer, bellek yönetimi, veri yapıları ve algoritmalar konusunda temel bilgi",
      "İşletim sistemlerinin temel çalışma prensipleri, process ve thread kavramları hakkında bilgi",
      "Linux ortamında temel düzeyde çalışma deneyimi",
      "Git gibi sürüm kontrol araçlarına aşinalık",
      "Analitik düşünme, problem çözme ve teknik konularda araştırma yapma becerisi",
      "Öğrenmeye açık, ekip çalışmasına yatkın ve gömülü yazılım geliştirmeye ilgili",
    ];

    expect(zorunluList).toHaveLength(expectedZorunlu.length);
    expectedZorunlu.forEach((expected, index) => {
      expect(zorunluList[index]).toContain(expected.slice(0, 25));
    });
    expect(zorunluList.some((item) => /çalışma şekli|rocksoft a\.ş\.|görevlere/i.test(item))).toBe(false);
  });

  it("mentor4b metninden görev ve nitelik maddeleri çıkarılır", () => {
    const raw = readFileSync(new URL("./fixtures/mentor4b.txt", import.meta.url), "utf8");
    const requirements = extractRequirements(raw);

    expect(requirements.some((item) => item.kaynak === "gorev")).toBe(true);
    expect(requirements.some((item) => item.tur === "zorunlu")).toBe(true);
  });

  it("başlık içermeyen metin için boş liste döner", () => {
    expect(extractRequirements("Sadece düz metin\n Hiçbir başlık yok")).toEqual([]);
  });
});

describe("cleanLinkedInJobText", () => {
  it("gürültü satırlarını temizler ve firma/pozisyonu çıkarır", () => {
    const raw = readFileSync(new URL("./fixtures/rocksoft-linkedin.txt", import.meta.url), "utf8");
    const cleaned = cleanLinkedInJobText(raw);

    expect(cleaned).not.toContain("notifications");
    expect(cleaned).not.toContain("Premium");
    expect(cleaned).not.toContain("Show match details");
    expect(cleaned).not.toContain("More jobs");
    expect(cleaned).not.toContain("Aselsan");

    const meta = extractLinkedInMeta(raw);
    expect(meta.firma).toBe("RockSoft");
    expect(meta.pozisyon).toContain("Gömülü Yazılım Mühendisi");

    const competition = parseLinkedInCompetitionMeta(raw);
    expect(competition).not.toBeNull();
    expect(competition?.applicantCount).toBeGreaterThan(0);
    expect(competition?.daysAgo).toBeGreaterThan(0);
  });
});
