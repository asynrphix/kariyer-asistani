import type { AnalysisRequirement } from "@/lib/types";

function normalizeValue(value: string) {
  return value
    .toLocaleLowerCase("tr")
    .replace(/[ıiİ]/g, (char) => (char === "ı" || char === "I" ? "i" : "i"))
    .replace(/[şŞ]/g, "s")
    .replace(/[ğĞ]/g, "g")
    .replace(/[üÜ]/g, "u")
    .replace(/[öÖ]/g, "o")
    .replace(/[çÇ]/g, "c")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function enforceConsistency(
  requirements: AnalysisRequirement[],
  missingSkills: string[] = [],
): AnalysisRequirement[] {
  const missingTokens = missingSkills
    .map((skill) => normalizeValue(skill))
    .filter(Boolean);

  return requirements.map((requirement) => {
    if (requirement.durum !== "var") {
      return requirement;
    }

    const requirementText = normalizeValue(`${requirement.madde} ${requirement.kanit}`);
    const wasFlagged = missingTokens.some((token) => {
      if (!token) return false;
      if (requirementText.includes(token)) return true;
      return requirementText.split(" ").includes(token);
    });

    if (!wasFlagged) {
      return requirement;
    }

    return {
      ...requirement,
      durum: "kismen",
      duzeltildi: true,
    };
  });
}
