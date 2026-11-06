import { describe, expect, it } from "vitest";

import { formatDate, formatPercent } from "@/lib/format";

describe("format helpers", () => {
  it("yüzde değerlerini %80 biçiminde verir", () => {
    expect(formatPercent(80)).toBe("%80");
    expect(formatPercent(0)).toBe("%0");
  });

  it("tarihleri Türkçe formatta verir", () => {
    expect(formatDate(new Date(2026, 11, 15))).toBe("15 Aralık 2026");
    expect(formatDate("2026-12-15")).toBe("15 Aralık 2026");
  });
});
