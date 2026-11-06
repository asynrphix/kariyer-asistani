import { findMatchingTermInText, getSynonymVariants, textMatchesConcept } from "@/lib/synonyms";
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
  const weights = requirements.map((requirement) => {
    if (requirement.tur === "zorunlu") return 2;
    return 1;
  });
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);

  if (totalWeight === 0) {
    return 0;
  }

  const raw = requirements.reduce((sum, requirement, index) => {
    const weight = weights[index] ?? 0;
    let value = requirement.durum === "var" ? 1 : requirement.durum === "kismen" ? 0.5 : 0;

    if (requirement.durum === "var" && requirement.kanitGucu === "zayif") {
      value = 0.75;
    }

    return sum + weight * value;
  }, 0);

  return Math.round((raw / totalWeight) * 100);
}

export function keywordAppearsInText(text: string, keyword: string) {
  const haystack = normalizeTurkishText(text);
  const concept = normalizeTurkishText(keyword);

  if (!haystack || !concept) {
    return false;
  }

  const variants = new Set(getSynonymVariants(concept));
  variants.add(concept);

  return Array.from(variants).some((variant) => {
    if (!variant) return false;
    if (haystack.includes(variant)) return true;
    const words = haystack.split(/\s+/);
    return words.includes(variant);
  });
}

export function filterKeywordsByJobText(keywords: AnalysisKeyword[], jobText: string) {
  if (!jobText) return [];

  return keywords
    .filter((keyword) => {
      const name = String(keyword.kelime ?? "").trim();
      if (!name) return false;
      return keywordAppearsInText(jobText, name);
    })
    .map((keyword) => {
      const term = findMatchingTermInText(jobText, keyword.kelime);
      return {
        ...keyword,
        eslesenTerim: term ?? keyword.eslesenTerim,
      };
    });
}

export function computeKeywordScore(keywords: AnalysisKeyword[], cvText: string) {
  const total = keywords.length;
  if (total === 0) {
    return 0;
  }

  const found = keywords.filter((keyword) => {
    const normalizedKey = normalizeTurkishText(keyword.kelime);
    if (!normalizedKey) return false;
    if (!cvText) return false;
    const matches = textMatchesConcept(cvText, normalizedKey);
    if (matches) {
      keyword.eslesenTerim = findMatchingTermInText(cvText, normalizedKey) ?? keyword.eslesenTerim;
    }
    return matches;
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
