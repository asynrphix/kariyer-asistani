import { describe, expect, it } from "vitest";

import demoResult from "@/lib/demo-result.json";

describe("demo result", () => {
  it("AnalysisResult tipine uygun JSON üretir", () => {
    expect(typeof demoResult.uyumPuani).toBe("number");
    expect(Array.isArray(demoResult.gereksinimler)).toBe(true);
    expect(Array.isArray(demoResult.eksikBeceriler)).toBe(true);
    expect(Array.isArray(demoResult.anahtarKelimeler)).toBe(true);
    expect(Array.isArray(demoResult.onerilenCvMaddeleri)).toBe(true);
    expect(typeof demoResult.onYazi).toBe("string");
    expect(demoResult.gereksinimler.length).toBeGreaterThan(0);
  });
});
