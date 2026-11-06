export type UploadState = "metin-hazir" | "ocr-gerekli";

export function getUploadState(wordCount: number): UploadState {
  return wordCount >= 30 ? "metin-hazir" : "ocr-gerekli";
}
