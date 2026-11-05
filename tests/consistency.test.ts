import { describe, expect, it } from "vitest";

import { enforceConsistency } from "@/lib/consistency";
import type { AnalysisRequirement } from "@/lib/types";

describe("enforceConsistency", () => {
  it("var olarak işaretlenmiş bir gereksinimi eksik beceriyle kismen'e düşürür", () => {
    const requirements: AnalysisRequirement[] = [
      {
        madde: "AI agent geliştirme",
        tur: "zorunlu",
        durum: "var",
        kanit: "Kendi AI agent çözümlerini tasarladım.",
        kaynak: "gorev",
      },
    ];

    const result = enforceConsistency(requirements, ["AI"]);

    expect(result[0].durum).toBe("kismen");
    expect(result[0].duzeltildi).toBe(true);
  });
});
