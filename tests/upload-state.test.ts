import { describe, expect, it } from "vitest";

import { getUploadState } from "@/lib/upload-state";

describe("getUploadState", () => {
  it("0 kelimeli PDF için OCR gerekiyor", () => {
    expect(getUploadState(0)).toBe("ocr-gerekli");
  });

  it("200 kelimeli PDF için metin hazır", () => {
    expect(getUploadState(200)).toBe("metin-hazir");
  });
});
