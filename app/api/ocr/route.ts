import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

import { generateWithRetry, GeminiRequestError } from "@/lib/gemini";
import { validateCvFile } from "@/lib/extract-cv";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "PDF dosyası eksik." }, { status: 400 });
    }

    const fileInfo = validateCvFile(file);

    if (fileInfo.kind !== "pdf") {
      return NextResponse.json({ error: "Sadece PDF dosyaları desteklenir." }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY tanımlı değil." }, { status: 500 });
    }

    const model = process.env.GEMINI_MODEL;
    if (!model) {
      return NextResponse.json({ error: "GEMINI_MODEL ortam değişkeni tanımlı değil." }, { status: 500 });
    }

    const fallbackModel = process.env.GEMINI_FALLBACK_MODEL;
    const ai = new GoogleGenAI({ apiKey });
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    const response = (await generateWithRetry({
      ai,
      model,
      contents: [
        {
          role: "user",
          parts: [
            {
              text: "Bu PDF içindeki metni okunabilir Türkçe metne çevir. Sadece metni yaz, ek açıklama ekleme. Çok kısa, eksiksiz ve net olsun.",
            },
            {
              inlineData: {
                mimeType: "application/pdf",
                data: base64,
              },
            },
          ],
        },
      ],
      config: {
        temperature: 0.1,
      },
      fallbackModel,
      timeoutMs: 30000,
      totalTimeoutMs: 60000,
    })) as { text?: string };

    const text = (response?.text ?? "").trim();
    if (!text) {
      return NextResponse.json({ error: "PDF içinden metin okunamadı." }, { status: 400 });
    }

    return NextResponse.json({ text }, { status: 200 });
  } catch (error) {
    const geminiError = error as GeminiRequestError;
    console.error("OCR başarısız oldu.", {
      status: geminiError?.status,
      code: geminiError?.code,
      googleStatus: geminiError?.googleStatus,
      model: geminiError?.model,
      message: geminiError?.message,
    });

    return NextResponse.json(
      {
        error:
          geminiError?.status === 429
            ? "Bugünkü ücretsiz kullanım hakkı doldu. Lütfen daha sonra tekrar deneyin."
            : geminiError?.status === 503
              ? "Yapay zekâ servisi şu an çok yoğun. Lütfen birkaç saniye sonra tekrar deneyin."
              : geminiError?.status === 404
                ? "Yapay zekâ modeli bulunamadı."
                : "İçerik okunurken bir hata oluştu. Lütfen tekrar deneyin.",
      },
      { status: geminiError?.status ?? 500 },
    );
  }
}
