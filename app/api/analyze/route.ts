import crypto from "node:crypto";

import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

import { generateWithRetry, getUserFriendlyGeminiErrorMessage, GeminiRequestError } from "@/lib/gemini";
import { getIskurGeminiText, parseIskurIlan } from "@/lib/iskur";
import { cleanLinkedInJobText } from "@/lib/linkedin";
import { extractRequirements } from "@/lib/requirements";
import { enforceConsistency } from "@/lib/consistency";
import { calculateCompatibilityScore, filterKeywordsByJobText } from "@/lib/scoring";
import { mergeKeywordTerms, normalizeSynonymText } from "@/lib/synonyms";
import { redactSensitiveInfo } from "@/lib/redact";
import type { AnalysisResult, AnalysisRequirement } from "@/lib/types";

export { extractRequirements as extractRequirementsFromJobText } from "@/lib/requirements";

const CACHE_VERSION = 2;
const analysisCache = new Map<string, { expiresAt: number; result: AnalysisResult }>();

function getCacheKey(ilan: string, cv: string) {
  return crypto.createHash("sha256").update(`${ilan}\n---\n${cv}`).digest("hex");
}

function finalizeAnalysisResult({
  base,
  jobText,
  cvText,
  extractedRequirements,
}: {
  base: Partial<AnalysisResult>;
  jobText: string;
  cvText: string;
  extractedRequirements: AnalysisRequirement[];
}) {
  const normalized = normalizeGeminiResponse(base as Partial<AnalysisResult>);

  if (extractedRequirements.length > 0) {
    normalized.gereksinimler = mergeExtractedRequirements(extractedRequirements, normalized.gereksinimler);
  }

  const mergedKeywords = mergeKeywordTerms(
    ...normalized.anahtarKelimeler.map((item) => item.kelime),
    ...normalized.eksikBeceriler,
  );

  const validatedKeywords = filterKeywordsByJobText(
    mergedKeywords
      .filter(Boolean)
      .map((kelime) => ({
        kelime,
        cvdeVar: normalized.anahtarKelimeler.some((item) => item.kelime.toLowerCase() === kelime.toLowerCase() && item.cvdeVar),
      })),
    jobText,
  );

  normalized.anahtarKelimeler = validatedKeywords.map((entry) => ({
    kelime: entry.kelime,
    cvdeVar: entry.cvdeVar,
    eslesenTerim: entry.eslesenTerim,
  }));

  const consistentRequirements = enforceConsistency(normalized.gereksinimler, normalized.eksikBeceriler);
  normalized.gereksinimler = consistentRequirements;

  const score = calculateCompatibilityScore({
    requirements: consistentRequirements,
    keywords: normalized.anahtarKelimeler,
    cvText,
  });
  normalized.uyumPuani = score.overall;

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

  return {
    ...normalized,
    cached: Boolean(base?.cached),
    iskurProfilOnerileri: iskurProfilOnerileri.length > 0 ? iskurProfilOnerileri : undefined,
    ilanOzeti: base?.ilanOzeti,
  } satisfies AnalysisResult;
}

function normalizeHeadingKey(value: string) {
  return normalizeSynonymText(value).replace(/\s+/g, " ").trim();
}

function mergeExtractedRequirements(extracted: AnalysisRequirement[], parsed: AnalysisRequirement[]) {
  const normalizedExtracted = extracted.map((item) => ({
    ...item,
    normalized: normalizeHeadingKey(item.madde),
  }));

  const matchedKeys = new Set<string>();
  const result: AnalysisRequirement[] = [];

  for (const item of normalizedExtracted) {
    const match = parsed.find((candidate) => normalizeHeadingKey(candidate.madde) === item.normalized);
    matchedKeys.add(item.normalized);
    result.push({
      ...item,
      madde: item.madde,
      tur: item.tur,
      kaynak: item.kaynak,
      durum: match?.durum ?? "yok",
      kanit: match?.kanit ?? "",
      duzeltildi: match?.duzeltildi,
      kanitGucu: match?.kanitGucu ?? "guclu",
    });
  }

  for (const item of parsed) {
    const key = normalizeHeadingKey(item.madde);
    if (!key || matchedKeys.has(key)) continue;
    result.push({
      ...item,
      madde: item.madde,
      tur: item.tur,
      kaynak: item.kaynak,
      durum: item.durum ?? "yok",
      kanit: item.kanit ?? "",
      kanitGucu: item.kanitGucu ?? "guclu",
    });
  }

  return result;
}

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
          tur: { type: "STRING", enum: ["gorev", "zorunlu", "tercih"] },
          durum: { type: "STRING", enum: ["var", "kismen", "yok"] },
          kanit: { type: "STRING" },
          kaynak: { type: "STRING", enum: ["gorev", "nitelik"] },
          duzeltildi: { type: "BOOLEAN" },
          kanitGucu: { type: "STRING", enum: ["guclu", "zayif"] },
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
          eslesenTerim: { type: "STRING" },
        },
        required: ["kelime", "cvdeVar"],
      },
    },
    onerilenCvMaddeleri: {
      type: "ARRAY",
      items: { type: "STRING" },
    },
    onYazi: { type: "STRING" },
    firma: { type: "STRING" },
    pozisyon: { type: "STRING" },
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
      ? (result.gereksinimler as AnalysisRequirement[]).map((item) => ({
          madde: String(item?.madde ?? ""),
          tur: item?.tur === "tercih" ? "tercih" : item?.tur === "gorev" ? "gorev" : "zorunlu",
          durum: item?.durum === "var" || item?.durum === "kismen" ? item.durum : "yok",
          kanit: String(item?.kanit ?? ""),
          kaynak: item?.kaynak === "nitelik" ? "nitelik" : "gorev",
          duzeltildi: Boolean(item?.duzeltildi),
          kanitGucu: item?.kanitGucu === "zayif" ? "zayif" : "guclu",
        }))
      : [],
    eksikBeceriler: Array.isArray(result.eksikBeceriler)
      ? result.eksikBeceriler.map((item) => String(item))
      : [],
    anahtarKelimeler: Array.isArray(result.anahtarKelimeler)
      ? result.anahtarKelimeler.map((item) => ({
          kelime: String(item?.kelime ?? ""),
          cvdeVar: Boolean(item?.cvdeVar),
          eslesenTerim: typeof item?.eslesenTerim === "string" ? item.eslesenTerim : undefined,
        }))
      : [],
    onerilenCvMaddeleri: Array.isArray(result.onerilenCvMaddeleri)
      ? result.onerilenCvMaddeleri.map((item) => String(item))
      : [],
    onYazi: typeof result.onYazi === "string" ? result.onYazi : "",
    firma: typeof result.firma === "string" ? result.firma : undefined,
    pozisyon: typeof result.pozisyon === "string" ? result.pozisyon : undefined,
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

    const redactedCv = redactSensitiveInfo(cv);

    const primaryModel = process.env.GEMINI_MODEL;
    if (!primaryModel) {
      throw new Error("GEMINI_MODEL ortam değişkeni tanımlı değil. Lütfen .env.local içinde tanımlayın.");
    }

    const fallbackModel = process.env.GEMINI_FALLBACK_MODEL;
    const ai = new GoogleGenAI({ apiKey });
    const cleanedLinkedInIlan = cleanLinkedInJobText(ilan);
    const iskurIlan = parseIskurIlan(cleanedLinkedInIlan);
    const geminiIlanMetni = iskurIlan ? getIskurGeminiText(cleanedLinkedInIlan) : cleanedLinkedInIlan;
    const extractedRequirements = extractRequirements(geminiIlanMetni);
    const cacheKey = `${CACHE_VERSION}:${getCacheKey(ilan, cv)}`;
    const cachedEntry = analysisCache.get(cacheKey);

    if (cachedEntry && cachedEntry.expiresAt > Date.now()) {
      const refreshed = finalizeAnalysisResult({
        base: { ...cachedEntry.result, cached: true },
        jobText: geminiIlanMetni,
        cvText: cv,
        extractedRequirements,
      });
      return NextResponse.json(refreshed, { status: 200 });
    }

    if (cachedEntry) {
      analysisCache.delete(cacheKey);
    }

    const today = new Date().toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    const promptRequirements = extractedRequirements.length
      ? `\n\nGEREKSINIM_LISTESI:\n${extractedRequirements.map((item, index) => `${index + 1}. ${item.madde}`).join("\n")}\n\nYalnızca bu maddeleri değerlendir. Bu listeyi değiştirme, madde ekleme/çıkarma. Her madde için sadece durum, kanit ve kanitGucu döndür. Gereksinim sayısı sabit kalmalı; eksik ya da bulunamayan madde için durum "yok" olsun.`
      : "";

    const systemInstruction = `Sen bir kariyer danışmanısın. Sadece CV'de gerçekten yazan bilgileri kullan. Kesinlikle deneyim, beceri veya tarih uydurma. Bugünün tarihi: ${today}. Mezuniyet tarihi geçmişse adayı "mezun" olarak değerlendir; "öğrenci" deme. "var" sadece CV'de o beceriye/araca dair açık ve doğrudan kanıt varsa kullanılsın. İlgili ama aynı olmayan deneyim "kismen" olsun. Örnek: bir uygulamaya yerel LLM entegre etmek, "Cursor/Claude Code gibi AI kodlama araçlarını kullanmak" için "var" değil, en fazla "kismen"dir. "Görev ve Sorumluluklar" ve "Nitelik ve Beceriler" maddelerinin HER biri ayrı bir gereksinim olarak çıkarılmalı; her gereksinim için "kaynak": "gorev" veya "nitelik" alanı eklenmeli. Görev maddeleri için tur değeri "gorev", nitelik maddeleri için "zorunlu" veya "tercih" olmalı. İlanda "Aranan Nitelikler", "Gereksinimler", "Requirements" gibi bölümlerdeki maddeler zorunlu; "Tercih Sebebi", "Tercih Sebebi Olacak Yetkinlikler", "Artı", "Preferred", "Nice to have", "Bonus" gibi maddeler tercih olarak işaretlenmeli. Her madde işaretini (•, *, -, numaralı) ayrı bir gereksinim olarak çıkar, hiçbirini atlama. Giriş paragrafı, “Çalışma Şekli”, “Deneyim” ve firma/pozisyon satırları gereksinim olarak eklenmemeli. Her "var" gereksinimi için "kanitGucu" alanı "guclu" veya "zayif" olmalı; "sadece beceri listesinde geçiyor" ise "zayif" olsun. İlandaki tüm teknik terimleri (araçlar, diller, protokoller, platformlar, kavramlar) 15-25 anahtar kelime olarak çıkar; anahtar kelimeler listesi sıralı, teknik ve kısa olmalı. Anahtar kelimeleri SADECE ilan metninden çıkar; CV'den asla kelime ekleme. Bu yüzden ilan metninde geçmeyen anahtar kelimeleri listeden çıkar. Önerilen CV maddeleri yalnızca CV'deki mevcut deneyimleri ilanın diline göre yeniden ifade etmeli. CV'de olmayan bir şeyi "yok" olarak işaretle. Eğer özel firma adı ve pozisyon bulunuyorsa "firma" ve "pozisyon" alanlarını da doldur. Sonuç JSON formatında olmalı. onYazi en fazla 120 kelime olmalı ve Türkçe yazılmalıdır. Gereksinimler listesinde her madde için tur değerleri "gorev", "zorunlu" veya "tercih" olmalı; durum sadece "var", "kismen" veya "yok" olmalı.`;

    const response = (await generateWithRetry({
      ai,
      model: primaryModel,
      contents: `İLAN:\n${geminiIlanMetni}\n\nCV:\n${redactedCv}${promptRequirements}`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        temperature: 0.2,
      },
      fallbackModel,
      timeoutMs: 30000,
      totalTimeoutMs: 60000,
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

    if (extractedRequirements.length > 0) {
      normalized.gereksinimler = mergeExtractedRequirements(extractedRequirements, normalized.gereksinimler);
    }

    const mergedKeywords = mergeKeywordTerms(
      ...normalized.anahtarKelimeler.map((item) => item.kelime),
      ...normalized.eksikBeceriler,
    );

    const validatedKeywords = filterKeywordsByJobText(
      mergedKeywords
        .filter(Boolean)
        .map((kelime) => ({
          kelime,
          cvdeVar: normalized.anahtarKelimeler.some((item) => item.kelime.toLowerCase() === kelime.toLowerCase() && item.cvdeVar),
        })),
      geminiIlanMetni,
    );
    normalized.anahtarKelimeler = validatedKeywords.map((entry) => ({
      kelime: entry.kelime,
      cvdeVar: entry.cvdeVar,
      eslesenTerim: entry.eslesenTerim,
    }));

    const consistentRequirements = enforceConsistency(normalized.gereksinimler, normalized.eksikBeceriler);
    normalized.gereksinimler = consistentRequirements;

    const score = calculateCompatibilityScore({
      requirements: consistentRequirements,
      keywords: normalized.anahtarKelimeler,
      cvText: cv,
    });
    normalized.uyumPuani = score.overall;

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
      cached: false,
      iskurProfilOnerileri: iskurProfilOnerileri.length > 0 ? iskurProfilOnerileri : undefined,
      ilanOzeti: iskurIlan
        ? {
            ...iskurIlan,
            sonBasvuruyaKalanGun: iskurIlan.sonBasvuruyaKalanGun,
            pozisyonBasinaBasvuru: iskurIlan.pozisyonBasinaBasvuru,
          }
        : undefined,
    };

    analysisCache.set(cacheKey, {
      expiresAt: Date.now() + 60 * 60 * 1000,
      result: payload,
    });

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
