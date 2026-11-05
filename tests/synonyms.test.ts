import { describe, expect, it } from "vitest";

import { enforceConsistency } from "@/lib/consistency";
import { textMatchesConcept } from "@/lib/synonyms";
import type { AnalysisRequirement } from "@/lib/types";

describe("synonym matching", () => {
  it("AI agent ile yapay zeka ajanı eşleşir", () => {
    expect(textMatchesConcept("AI agent geliştirme ve otomasyon", "yapay zeka ajanı")).toBe(true);
  });

  it("tutarlılık kontrolü LLM ve AI agent entegre edilen gereksinimi kismen yapar", () => {
    const requirements: AnalysisRequirement[] = [
      {
        madde: "LLM ve AI agent entegre etmek",
        tur: "zorunlu",
        durum: "var",
        kanit: "LLM ve AI agent entegre ettim.",
        kaynak: "gorev",
      },
    ];

    const result = enforceConsistency(requirements, ["Yapay zeka ajanları geliştirme"]);
    expect(result[0].durum).toBe("kismen");
    expect(result[0].duzeltildi).toBe(true);
  });
});
