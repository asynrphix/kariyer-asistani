import { describe, expect, it } from "vitest";

import { classifyGeminiError } from "@/lib/gemini";

describe("classifyGeminiError", () => {
  it("429 hata için kota mesajı döner ve tekrar deneme işareti olmaz", () => {
    const result = classifyGeminiError({ status: 429, message: "RESOURCE_EXHAUSTED" });

    expect(result.status).toBe(429);
    expect(result.userMessage).toBe("Bugünkü ücretsiz kullanım hakkı doldu. Lütfen daha sonra tekrar deneyin.");
    expect(result.shouldRetry).toBe(false);
  });

  it("503 hata için tekrar deneme işareti olur", () => {
    const result = classifyGeminiError({ status: 503, message: "UNAVAILABLE" });

    expect(result.status).toBe(503);
    expect(result.userMessage).toBe("Yapay zekâ servisi şu an çok yoğun. Lütfen birkaç saniye sonra tekrar deneyin.");
    expect(result.shouldRetry).toBe(true);
  });

  it("404 hata için model bulunamadı mesajı döner", () => {
    const result = classifyGeminiError({ status: 404, message: "NOT_FOUND" });

    expect(result.status).toBe(404);
    expect(result.userMessage).toBe("Yapay zekâ modeli bulunamadı.");
    expect(result.shouldRetry).toBe(false);
  });
});
