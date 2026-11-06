import type { AnalysisRequirement } from "@/lib/types";
import { textMatchesConcept } from "@/lib/synonyms";

export function enforceConsistency(
  requirements: AnalysisRequirement[],
  missingSkills: string[] = [],
): AnalysisRequirement[] {
  const missingTokens = missingSkills.map((skill) => skill.trim()).filter(Boolean);

  return requirements.map((requirement) => {
    if (requirement.durum !== "var") {
      return requirement;
    }

    const requirementText = `${requirement.madde} ${requirement.kanit}`;
    const wasFlagged = missingTokens.some((token) => textMatchesConcept(requirementText, token));

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
