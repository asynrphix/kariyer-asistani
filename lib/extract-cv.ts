import * as pdfjsLib from "pdfjs-dist";
import * as mammoth from "mammoth/mammoth.browser";

const MAX_CV_SIZE_BYTES = 5 * 1024 * 1024;

export function validateCvFile(file: File) {
  if (!(file instanceof File)) {
    throw new Error("Geçersiz dosya." );
  }

  const fileName = file.name.toLowerCase();
  const isPdf = file.type === "application/pdf" || fileName.endsWith(".pdf");
  const isDocx =
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    fileName.endsWith(".docx");

  if (!isPdf && !isDocx) {
    throw new Error("Sadece PDF veya DOCX dosyaları yüklenebilir.");
  }

  if (file.size > MAX_CV_SIZE_BYTES) {
    throw new Error("Dosya boyutu 5 MB'den küçük olmalıdır.");
  }

  return {
    kind: isPdf ? "pdf" : "docx",
    fileName,
    sizeBytes: file.size,
  };
}

export function isTextSufficient(text: string, minWords = 30) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  return words.length >= minWords;
}

export function normalizeExtractedText(text: string) {
  return text.replace(/\r/g, "").replace(/\s+/g, " ").trim();
}

export async function extractTextFromPdf(file: File) {
  validateCvFile(file);

  if (typeof window !== "undefined") {
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
  }

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const parts: string[] = [];

  for (let pageIndex = 1; pageIndex <= pdf.numPages; pageIndex += 1) {
    const page = await pdf.getPage(pageIndex);
    const content = await page.getTextContent();
    const text = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");

    if (text.trim()) {
      parts.push(text);
    }
  }

  return normalizeExtractedText(parts.join("\n"));
}

export async function extractTextFromDocx(file: File) {
  validateCvFile(file);
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return normalizeExtractedText(result.value || "");
}

export async function extractCvTextFromFile(file: File) {
  const { kind } = validateCvFile(file);

  if (kind === "pdf") {
    return extractTextFromPdf(file);
  }

  return extractTextFromDocx(file);
}
