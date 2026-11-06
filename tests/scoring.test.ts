import { describe, expect, it } from "vitest";

import { calculateCompatibilityScore, filterKeywordsByJobText } from "@/lib/scoring";
import type { AnalysisRequirement } from "@/lib/types";

const allVarRequirements: AnalysisRequirement[] = [
  { madde: "Python", tur: "zorunlu", durum: "var", kanit: "Python kullanıyorum", kaynak: "nitelik" },
  { madde: "SQL", tur: "zorunlu", durum: "var", kanit: "SQL ile sorgulama yaptım", kaynak: "nitelik" },
];

const allMissingRequirements: AnalysisRequirement[] = [
  { madde: "Python", tur: "zorunlu", durum: "yok", kanit: "", kaynak: "nitelik" },
  { madde: "SQL", tur: "zorunlu", durum: "yok", kanit: "", kaynak: "nitelik" },
];

describe("calculateCompatibilityScore", () => {
  it("hepsi var ise puan 100 olur", () => {
    const result = calculateCompatibilityScore({
      requirements: allVarRequirements,
      keywords: [
        { kelime: "python", cvdeVar: true },
        { kelime: "sql", cvdeVar: true },
      ],
      cvText: "Python ve SQL", 
    });

    expect(result.meaning).toBe(100);
    expect(result.keyword).toBe(100);
    expect(result.overall).toBe(100);
  });

  it("hepsi yok ise puan 0 olur", () => {
    const result = calculateCompatibilityScore({
      requirements: allMissingRequirements,
      keywords: [
        { kelime: "python", cvdeVar: false },
        { kelime: "sql", cvdeVar: false },
      ],
      cvText: "Deneyim yok",
    });

    expect(result.meaning).toBe(0);
    expect(result.keyword).toBe(0);
    expect(result.overall).toBe(0);
  });

  it("karışık bir durumda beklenen puan hesaplanır", () => {
    const requirements: AnalysisRequirement[] = [
      { madde: "Python", tur: "zorunlu", durum: "var", kanit: "Python biliyorum", kaynak: "nitelik" },
      { madde: "SQL", tur: "tercih", durum: "kismen", kanit: "Kısmi SQL deneyimi", kaynak: "nitelik" },
      { madde: "Yapay Zeka", tur: "zorunlu", durum: "yok", kanit: "", kaynak: "gorev" },
    ];

    const result = calculateCompatibilityScore({
      requirements,
      keywords: [
        { kelime: "python", cvdeVar: true },
        { kelime: "sql", cvdeVar: true },
        { kelime: "yapay zeka", cvdeVar: false },
      ],
      cvText: "Python kullanıyorum; yapay zeka yok.",
    });

    expect(result.meaning).toBe(50);
    expect(result.keyword).toBe(67);
    expect(result.overall).toBe(59);
  });

  it("Türkçe normalizasyon ve eştir anlamlar eşleşir", () => {
    const result = calculateCompatibilityScore({
      requirements: [
        { madde: "İŞKUR deneyimi", tur: "zorunlu", durum: "var", kanit: "işkur'da çalıştım", kaynak: "gorev" },
      ],
      keywords: [
        { kelime: "İŞKUR", cvdeVar: true },
        { kelime: "Yapay Zekâ", cvdeVar: true },
      ],
      cvText: "İŞKUR deneyimim var. Yapay zeka ve AI çalışmaları yaptım.",
    });

    expect(result.keyword).toBe(100);
  });

  it("zayıf kanıtlı var maddeler 0.75 değerindedir", () => {
    const result = calculateCompatibilityScore({
      requirements: [
        { madde: "Python", tur: "zorunlu", durum: "var", kanit: "Python listede var", kanitGucu: "zayif", kaynak: "nitelik" },
      ],
      keywords: [{ kelime: "python", cvdeVar: true }],
      cvText: "Python",
    });

    expect(result.meaning).toBe(75);
    expect(result.overall).toBe(88);
  });

  it("ilan içinde geçmeyen anahtar kelimeler elenir", () => {
    const filtered = filterKeywordsByJobText(
      [
        { kelime: "Modbus", cvdeVar: true },
        { kelime: "Python", cvdeVar: true },
      ],
      "Python ve FastAPI ile mikroservisler geliştiriyoruz.",
    );

    expect(filtered.map((item) => item.kelime)).toEqual(["Python"]);
  });
});
