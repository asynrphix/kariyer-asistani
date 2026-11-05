import { describe, expect, it } from "vitest";

import { isTextSufficient, validateCvFile } from "@/lib/extract-cv";

describe("extractCv helpers", () => {
  it("metin yetersizse false döner", () => {
    const text = "Bu CV kısa bir özet içerir. Çok az kelime vardır.";
    expect(isTextSufficient(text, 30)).toBe(false);
  });

  it("PDF ve DOCX dosyaları kabul edilir", () => {
    const pdf = new File(["pdf-metni"], "cv.pdf", { type: "application/pdf" });
    const docx = new File(["docx-metni"], "cv.docx", { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });

    expect(() => validateCvFile(pdf)).not.toThrow();
    expect(() => validateCvFile(docx)).not.toThrow();
  });

  it("yanlış türde dosya ve büyük dosya reddedilir", () => {
    const txt = new File(["merhaba"], "cv.txt", { type: "text/plain" });
    const giant = new File(["x".repeat(6 * 1024 * 1024)], "large.pdf", { type: "application/pdf" });

    expect(() => validateCvFile(txt)).toThrow("Sadece PDF veya DOCX dosyaları yüklenebilir.");
    expect(() => validateCvFile(giant)).toThrow("Dosya boyutu 5 MB'den küçük olmalıdır.");
  });
});
