import { GoogleGenAI } from "@google/genai";

export class GeminiRequestError extends Error {
  status?: number;
  code?: string;

  constructor(message: string, status?: number, code?: string) {
    super(message);
    this.name = "GeminiRequestError";
    this.status = status;
    this.code = code;
  }
}

function getRetryStatus(error: unknown): number | undefined {
  const candidate = error as {
    status?: number | string;
    code?: number | string;
    message?: string;
    error?: { status?: number | string; code?: number | string };
  };

  const status = candidate?.status ?? candidate?.error?.status ?? candidate?.code ?? candidate?.error?.code;
  if (typeof status === "number") return status;
  if (typeof status === "string") {
    if (/429/.test(status)) return 429;
    if (/503/.test(status)) return 503;
    if (/RESOURCE_EXHAUSTED/i.test(status)) return 429;
    if (/UNAVAILABLE/i.test(status)) return 503;
  }

  const message = candidate?.message ?? "";
  if (/RESOURCE_EXHAUSTED/i.test(message) || /429/.test(message)) return 429;
  if (/UNAVAILABLE/i.test(message) || /503/.test(message)) return 503;

  return undefined;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function getUserFriendlyGeminiErrorMessage(error: unknown): string {
  const status = getRetryStatus(error);

  if (status === 503) {
    return "Yapay zekâ servisi şu an çok yoğun. Lütfen birkaç saniye sonra tekrar deneyin.";
  }

  if (status === 429) {
    return "Kullanım sınırına ulaşıldı. Lütfen biraz sonra tekrar deneyin.";
  }

  return "Analiz sırasında bir hata oluştu. Lütfen tekrar deneyin.";
}

export async function generateWithRetry({
  ai,
  model,
  contents,
  config,
  fallbackModel,
  maxRetries = 3,
}: {
  ai: GoogleGenAI;
  model: string;
  contents: string;
  config: Record<string, unknown>;
  fallbackModel?: string;
  maxRetries?: number;
}) {
  const attempts = [model];
  if (fallbackModel && fallbackModel !== model) {
    attempts.push(fallbackModel);
  }

  let lastError: unknown = null;

  for (const candidateModel of attempts) {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await ai.models.generateContent({
          model: candidateModel,
          contents,
          config,
        });
      } catch (error) {
        lastError = error;
        const status = getRetryStatus(error);

        if (status !== 429 && status !== 503) {
          throw new GeminiRequestError(
            getUserFriendlyGeminiErrorMessage(error),
            status,
            (error as { code?: string })?.code,
          );
        }

        if (attempt >= maxRetries) {
          break;
        }

        const baseDelay = [1000, 2000, 4000][attempt] ?? 4000;
        const jitter = Math.floor(Math.random() * 300);
        await sleep(baseDelay + jitter);
      }
    }
  }

  if (lastError) {
    const status = getRetryStatus(lastError);
    throw new GeminiRequestError(
      getUserFriendlyGeminiErrorMessage(lastError),
      status,
      (lastError as { code?: string })?.code,
    );
  }

  throw new GeminiRequestError("Analiz sırasında bir hata oluştu. Lütfen tekrar deneyin.");
}
