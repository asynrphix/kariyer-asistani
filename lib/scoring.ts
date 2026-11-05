import type { AnalysisKeyword, AnalysisRequirement } from "@/lib/types";

export function normalizeTurkishText(value: string) {
  return value
    .toLocaleLowerCase("tr")
    .replace(/[ıİ]/g, "i")
    .replace(/[şŞ]/g, "s")
    .replace(/[ğĞ]/g, "g")
    .replace(/[üÜ]/g, "u")
    .replace(/[öÖ]/g, "o")
    .replace(/[çÇ]/g, "c")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function computeMeaningScore(requirements: AnalysisRequirement[]) {
  const weights = requirements.map((requirement) => (requirement.tur === "zorunlu" ? 2 : 1));
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);

  if (totalWeight === 0) {
    return 0;
  }

  const raw = requirements.reduce((sum, requirement, index) => {
    const weight = weights[index] ?? 0;
    const value = requirement.durum === "var" ? 1 : requirement.durum === "kismen" ? 0.5 : 0;
    return sum + weight * value;
  }, 0);

  return Math.round((raw / totalWeight) * 100);
}

export function computeKeywordScore(keywords: AnalysisKeyword[], cvText: string) {
  const total = keywords.length;
  if (total === 0) {
    return 0;
  }

  const normalizedCv = normalizeTurkishText(cvText);
  const found = keywords.filter((keyword) => {
    const normalizedKey = normalizeTurkishText(keyword.kelime);
    if (!normalizedKey) return false;
    if (!normalizedCv) return false;
    return normalizedCv.includes(normalizedKey);
  }).length;

  return Math.round((found / total) * 100);
}

export function calculateCompatibilityScore({
  requirements,
  keywords,
  cvText,
}: {
  requirements: AnalysisRequirement[];
  keywords: AnalysisKeyword[];
  cvText: string;
}) {
  const meaning = computeMeaningScore(requirements);
  const keyword = computeKeywordScore(keywords, cvText);
  const overall = Math.round((meaning + keyword) / 2);

  return { meaning, keyword, overall };
}
