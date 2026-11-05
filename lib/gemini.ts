import { GoogleGenAI } from "@google/genai";

export class GeminiRequestError extends Error {
  status?: number;
  code?: string;
  googleStatus?: string;
  model?: string;
  attempt?: number;
  elapsedMs?: number;

  constructor(
    message: string,
    status?: number,
    code?: string,
    googleStatus?: string,
    model?: string,
    attempt?: number,
    elapsedMs?: number,
  ) {
    super(message);
    this.name = "GeminiRequestError";
    this.status = status;
    this.code = code;
    this.googleStatus = googleStatus;
    this.model = model;
    this.attempt = attempt;
    this.elapsedMs = elapsedMs;
  }
}

function getRetryStatus(error: unknown): number | undefined {
  const candidate = error as {
    status?: number | string;
    code?: number | string;
    error?: { status?: number | string; code?: number | string };
    message?: string;
  };

  const rawStatus = candidate?.status ?? candidate?.error?.status ?? candidate?.code ?? candidate?.error?.code;

  if (typeof rawStatus === "number") return rawStatus;

  if (typeof rawStatus === "string") {
    if (/429/.test(rawStatus)) return 429;
    if (/503/.test(rawStatus)) return 503;
    if (/404/.test(rawStatus)) return 404;
    if (/RESOURCE_EXHAUSTED/i.test(rawStatus)) return 429;
    if (/UNAVAILABLE/i.test(rawStatus)) return 503;
    if (/NOT_FOUND/i.test(rawStatus)) return 404;
  }

  const message = candidate?.message ?? "";
  if (/RESOURCE_EXHAUSTED/i.test(message) || /429/.test(message)) return 429;
  if (/UNAVAILABLE/i.test(message) || /503/.test(message)) return 503;
  if (/NOT_FOUND/i.test(message) || /404/.test(message)) return 404;

  return undefined;
}

function getGoogleStatus(error: unknown): string | undefined {
  const candidate = error as {
    status?: string | number;
    code?: string | number;
    error?: { status?: string | number; code?: string | number };
    message?: string;
  };

  const raw = candidate?.error?.status ?? candidate?.status ?? candidate?.code ?? candidate?.error?.code;
  if (typeof raw === "string") {
    return raw.toUpperCase();
  }

  if (typeof raw === "number") {
    const resolved = String(raw);
    if (/429/.test(resolved)) return "RESOURCE_EXHAUSTED";
    if (/503/.test(resolved)) return "UNAVAILABLE";
    if (/404/.test(resolved)) return "NOT_FOUND";
  }

  if (typeof candidate?.message === "string") {
    if (/RESOURCE_EXHAUSTED/i.test(candidate.message)) return "RESOURCE_EXHAUSTED";
    if (/UNAVAILABLE/i.test(candidate.message)) return "UNAVAILABLE";
    if (/NOT_FOUND/i.test(candidate.message)) return "NOT_FOUND";
  }

  return undefined;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function runWithTimeout<T>(task: Promise<T>, timeoutMs: number, timeoutMessage: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new GeminiRequestError(timeoutMessage, 504, "TIMEOUT"));
    }, timeoutMs);

    task.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

export function classifyGeminiError(error: unknown) {
  const status = getRetryStatus(error);
  const googleStatus = getGoogleStatus(error);

  if (status === 429 || googleStatus === "RESOURCE_EXHAUSTED") {
    return {
      status: 429,
      googleStatus: googleStatus ?? "RESOURCE_EXHAUSTED",
      userMessage: "Bugünkü ücretsiz kullanım hakkı doldu. Lütfen daha sonra tekrar deneyin.",
      shouldRetry: false,
      shouldFallback: true,
    };
  }

  if (status === 503 || googleStatus === "UNAVAILABLE") {
    return {
      status: 503,
      googleStatus: googleStatus ?? "UNAVAILABLE",
      userMessage: "Yapay zekâ servisi şu an çok yoğun. Lütfen birkaç saniye sonra tekrar deneyin.",
      shouldRetry: true,
      shouldFallback: true,
    };
  }

  if (status === 404 || googleStatus === "NOT_FOUND") {
    return {
      status: 404,
      googleStatus: googleStatus ?? "NOT_FOUND",
      userMessage: "Yapay zekâ modeli bulunamadı.",
      shouldRetry: false,
      shouldFallback: true,
    };
  }

  return {
    status,
    googleStatus,
    userMessage: "Analiz sırasında bir hata oluştu. Lütfen tekrar deneyin.",
    shouldRetry: false,
    shouldFallback: false,
  };
}

export function getUserFriendlyGeminiErrorMessage(error: unknown): string {
  return classifyGeminiError(error).userMessage;
}

export async function generateWithRetry({
  ai,
  model,
  contents,
  config,
  fallbackModel,
  maxRetries = 3,
  stream = false,
  timeoutMs = 30000,
  totalTimeoutMs = 60000,
}: {
  ai: GoogleGenAI;
  model: string;
  contents: string;
  config: Record<string, unknown>;
  fallbackModel?: string;
  maxRetries?: number;
  stream?: boolean;
  timeoutMs?: number;
  totalTimeoutMs?: number;
}) {
  const attempts = [model];
  if (fallbackModel && fallbackModel !== model) {
    attempts.push(fallbackModel);
  }

  const overallDeadline = Date.now() + totalTimeoutMs;
  let lastError: unknown = null;

  for (let modelIndex = 0; modelIndex < attempts.length; modelIndex++) {
    const candidateModel = attempts[modelIndex];
    const maxAllowedRetries = modelIndex === 0 ? (maxRetries > 0 ? maxRetries : 0) : 0;

    for (let attempt = 0; attempt <= maxAllowedRetries; attempt++) {
      if (Date.now() >= overallDeadline) {
        throw new GeminiRequestError(
          "İstek zaman aşımına uğradı, lütfen tekrar deneyin.",
          504,
          "TIMEOUT",
          undefined,
          candidateModel,
          attempt + 1,
          totalTimeoutMs,
        );
      }

      const startedAt = Date.now();

      try {
        const request = stream
          ? ai.models.generateContentStream({ model: candidateModel, contents, config })
          : ai.models.generateContent({ model: candidateModel, contents, config });

        const result = await runWithTimeout(
          request,
          Math.min(timeoutMs, Math.max(0, overallDeadline - Date.now())),
          "İstek zaman aşımına uğradı, lütfen tekrar deneyin.",
        );
        return result;
      } catch (error) {
        const elapsedMs = Date.now() - startedAt;
        const classification = classifyGeminiError(error);
        const finalStatus = classification.status ?? getRetryStatus(error) ?? 500;
        const finalGoogleStatus = classification.googleStatus ?? getGoogleStatus(error);

        lastError = error;

        console.error("Gemini isteği başarısız oldu.", {
          model: candidateModel,
          attempt: attempt + 1,
          elapsedMs,
          status: finalStatus,
          googleStatus: finalGoogleStatus,
          code: (error as { code?: string })?.code,
          message: (error as { message?: string })?.message ?? String(error),
        });

        const shouldRetryForStatus =
          finalStatus === 503 ? attempt < 2 : finalStatus === 429 ? attempt < 1 : false;

        if (!classification.shouldRetry || !shouldRetryForStatus) {
          if (modelIndex < attempts.length - 1) {
            continue;
          }

          const message = classification.userMessage || getUserFriendlyGeminiErrorMessage(error);
          throw new GeminiRequestError(
            message,
            finalStatus,
            (error as { code?: string })?.code,
            finalGoogleStatus,
            candidateModel,
            attempt + 1,
            elapsedMs,
          );
        }

        const baseDelay = finalStatus === 503 ? [1000, 2000, 4000][attempt] ?? 4000 : 1000;
        const jitter = Math.floor(Math.random() * 250) + 100;
        await sleep(baseDelay + jitter);
      }
    }
  }

  if (lastError) {
    const error = lastError as { status?: number; code?: string; message?: string };
    const finalStatus = getRetryStatus(lastError) ?? 500;
    const finalGoogleStatus = getGoogleStatus(lastError);
    throw new GeminiRequestError(
      getUserFriendlyGeminiErrorMessage(lastError),
      finalStatus,
      error?.code,
      finalGoogleStatus,
      model,
      1,
      0,
    );
  }

  throw new GeminiRequestError("Analiz sırasında bir hata oluştu. Lütfen tekrar deneyin.");
}
