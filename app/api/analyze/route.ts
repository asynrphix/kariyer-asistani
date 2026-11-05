import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

import { generateWithRetry, getUserFriendlyGeminiErrorMessage, GeminiRequestError } from "@/lib/gemini";
import { getIskurGeminiText, parseIskurIlan } from "@/lib/iskur";
import type { AnalysisResult, AnalysisRequirement } from "@/lib/types";

const analysisSchema = {
  type: "OBJECT",
  properties: {
    uyumPuani: { type: "INTEGER", minimum: 0, maximum: 100 },
    gereksinimler: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          madde: { type: "STRING" },
          tur: { type: "STRING", enum: ["zorunlu", "tercih"] },
          durum: { type: "STRING", enum: ["var", "kismen", "yok"] },
          kanit: { type: "STRING" },
        },
        required: ["madde", "tur", "durum", "kanit"],
      },
    },
    eksikBeceriler: {
      type: "ARRAY",
      items: { type: "STRING" },
    },
    anahtarKelimeler: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          kelime: { type: "STRING" },
          cvdeVar: { type: "BOOLEAN" },
        },
        required: ["kelime", "cvdeVar"],
      },
    },
    onerilenCvMaddeleri: {
      type: "ARRAY",
      items: { type: "STRING" },
    },
    onYazi: { type: "STRING" },
    iskurProfilOnerileri: {
      type: "ARRAY",
      items: { type: "STRING" },
    },
  },
  required: [
    "uyumPuani",
    "gereksinimler",
    "eksikBeceriler",
    "anahtarKelimeler",
    "onerilenCvMaddeleri",
    "onYazi",
  ],
};

function normalizeGeminiResponse(payload: unknown): AnalysisResult {
  const result = (payload ?? {}) as Partial<AnalysisResult>;

  return {
    uyumPuani: typeof result.uyumPuani === "number" ? result.uyumPuani : 0,
    gereksinimler: Array.isArray(result.gereksinimler)
      ? (result.gereksinimler as AnalysisRequirement[])
      : [],
    eksikBeceriler: Array.isArray(result.eksikBeceriler)
      ? result.eksikBeceriler.map((item) => String(item))
      : [],
    anahtarKelimeler: Array.isArray(result.anahtarKelimeler)
      ? result.anahtarKelimeler.map((item) => ({
          kelime: String(item?.kelime ?? ""),
          cvdeVar: Boolean(item?.cvdeVar),
        }))
      : [],
    onerilenCvMaddeleri: Array.isArray(result.onerilenCvMaddeleri)
      ? result.onerilenCvMaddeleri.map((item) => String(item))
      : [],
    onYazi: typeof result.onYazi === "string" ? result.onYazi : "",
    iskurProfilOnerileri: Array.isArray(result.iskurProfilOnerileri)
      ? result.iskurProfilOnerileri.map((item) => String(item))
      : undefined,
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const ilan = typeof body?.ilan === "string" ? body.ilan.trim() : "";
    const cv = typeof body?.cv === "string" ? body.cv.trim() : "";

    if (!ilan || !cv) {
      return NextResponse.json(
        { error: "İlan ve CV metni boş olamaz." },
        { status: 400 },
      );
    }

    if (ilan.length > 15000 || cv.length > 15000) {
      return NextResponse.json(
        { error: "İlan ve CV metni 15.000 karakterden kısa olmalıdır." },
        { status: 400 },
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY tanımlı değil. Lütfen ortam değişkenini ekleyin." },
        { status: 500 },
      );
    }

    const primaryModel = process.env.GEMINI_MODEL ?? "gemini-flash-latest";
    const fallbackModel = process.env.GEMINI_FALLBACK_MODEL ?? "gemini-flash-lite-latest";
    const ai = new GoogleGenAI({ apiKey });
    const iskurIlan = parseIskurIlan(ilan);
    const geminiIlanMetni = iskurIlan ? getIskurGeminiText(ilan) : ilan;

    const systemInstruction = `Sen bir kariyer danışmanısın. Sadece CV'de gerçekten yazan bilgileri kullan. Kesinlikle deneyim, beceri veya tarih uydurma. Önerilen CV maddeleri yalnızca CV'deki mevcut deneyimleri ilanın diline göre yeniden ifade etmeli. CV'de olmayan bir şeyi "yok" olarak işaretle. Sonuç JSON formatında olmalı. onYazi en fazla 120 kelime olmalı ve Türkçe yazılmalıdır. Gereksinimler listesinde her madde için tur değerleri sadece "zorunlu" veya "tercih" olmalı; durum sadece "var", "kismen" veya "yok" olmalı.`;

    const response = (await generateWithRetry({
      ai,
      model: primaryModel,
      contents: `İLAN:\n${geminiIlanMetni}\n\nCV:\n${cv}`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        temperature: 0.2,
      },
      fallbackModel,
    })) as { text?: string };

    const rawText = response.text ?? "";
    const cleanJsonText = rawText
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```$/i, "")
      .trim();

    if (!cleanJsonText) {
      throw new Error("Gemini'den boş yanıt döndü.");
    }

    const parsed = JSON.parse(cleanJsonText) as Partial<AnalysisResult>;
    const normalized = normalizeGeminiResponse(parsed);

    const iskurProfilOnerileri =
      Array.isArray(normalized.iskurProfilOnerileri) && normalized.iskurProfilOnerileri.length > 0
        ? normalized.iskurProfilOnerileri
        : Array.from(
            new Set(
              [
                ...normalized.eksikBeceriler,
                ...normalized.anahtarKelimeler
                  .filter((item) => item.cvdeVar)
                  .map((item) => item.kelime),
              ].filter(Boolean),
            ),
          ).slice(0, 8);

    const payload: AnalysisResult = {
      ...normalized,
      iskurProfilOnerileri: iskurProfilOnerileri.length > 0 ? iskurProfilOnerileri : undefined,
      ilanOzeti: iskurIlan
        ? {
            ...iskurIlan,
            sonBasvuruyaKalanGun: iskurIlan.sonBasvuruyaKalanGun,
            pozisyonBasinaBasvuru: iskurIlan.pozisyonBasinaBasvuru,
          }
        : undefined,
    };

    return NextResponse.json(payload, { status: 200 });
  } catch (error) {
    const geminiError = error as GeminiRequestError;
    console.error("Gemini analizi başarısız oldu.", {
      name: geminiError?.name,
      status: geminiError?.status,
      code: geminiError?.code,
      message: geminiError?.message,
    });

    const status = geminiError?.status ?? 500;
    const message =
      geminiError?.status === 503
        ? "Yapay zekâ servisi şu an çok yoğun. Lütfen birkaç saniye sonra tekrar deneyin."
        : geminiError?.status === 429
          ? "Kullanım sınırına ulaşıldı. Lütfen biraz sonra tekrar deneyin."
          : getUserFriendlyGeminiErrorMessage(error);

    return NextResponse.json({ error: message }, { status });
  }
}
