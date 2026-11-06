import { normalizeSynonymText } from "@/lib/synonyms";
import type { AnalysisRequirement } from "@/lib/types";

const requirementSections = {
  gorev: [
    "gorev ve sorumluluklar",
    "gorev tanimi",
    "is tanimi",
    "sorumluluklar",
    "responsibilities",
    "job description",
  ],
  zorunlu: [
    "aranan nitelikler",
    "nitelik ve beceriler",
    "nitelikler",
    "nitelik",
    "gereksinimler",
    "requirements",
    "qualifications",
  ],
  tercih: [
    "tercih sebebi",
    "tercih sebebi olacak yetkinlikler",
    "tercih sebebi olabilecek yetkinlikler",
    "tercihen",
    "arti",
    "preferred",
    "nice to have",
    "bonus",
  ],
} as const;

const endMarkers = ["basvuru", "how to apply", "about the company", "hakkimizda", "başvuru"];

export function normalizeRequirementHeading(value: string) {
  return normalizeSynonymText(value).replace(/[:\-–—]+$/, "").replace(/\s+/g, " ").trim();
}

export function extractRequirements(rawText: string): AnalysisRequirement[] {
  const text = (rawText ?? "").replace(/\r/g, "\n");
  if (!text.trim()) {
    return [];
  }

  const lines = text
    .split(/\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const firstSectionIndex = lines.findIndex((line) => {
    const normalizedLine = normalizeRequirementHeading(line);
    return Object.entries(requirementSections).some(([, patterns]) =>
      patterns.some((pattern) =>
        normalizedLine === pattern ||
        normalizedLine.startsWith(`${pattern}:`) ||
        normalizedLine.startsWith(`${pattern} `),
      ),
    );
  });

  if (firstSectionIndex < 0) {
    return [];
  }

  const requirements: AnalysisRequirement[] = [];
  let currentSection: "gorev" | "zorunlu" | "tercih" | null = null;

  for (const line of lines.slice(firstSectionIndex)) {
    const normalizedLine = normalizeRequirementHeading(line);

    const headingMatch = Object.entries(requirementSections).find(([, patterns]) =>
      patterns.some((pattern) =>
        normalizedLine === pattern ||
        normalizedLine.startsWith(`${pattern}:`) ||
        normalizedLine.startsWith(`${pattern} `),
      ),
    );

    if (headingMatch) {
      currentSection = headingMatch[0] as "gorev" | "zorunlu" | "tercih";
      continue;
    }

    if (endMarkers.some((marker) => normalizedLine.includes(marker))) {
      currentSection = null;
      continue;
    }

    if (!currentSection) {
      continue;
    }

    const cleaned = line
      .replace(/^[\s•*\-–—0-9.()\[\]{}]+/, "")
      .replace(/^[A-Za-z\d]+\s*[:.]\s*/u, "")
      .replace(/\s+/g, " ")
      .trim();

    if (!cleaned) {
      continue;
    }

    if (/^(?:calisma sekli|deneyim|rocksoft a\.s\.|pozisyon ağırlıklı|görevlere|başvuru|on-site|full-time)/i.test(cleaned)) {
      continue;
    }

    requirements.push({
      madde: cleaned,
      tur: currentSection === "gorev" ? "gorev" : currentSection === "tercih" ? "tercih" : "zorunlu",
      durum: "yok",
      kanit: "",
      kaynak: currentSection === "gorev" ? "gorev" : "nitelik",
    });
  }

  return requirements;
}
