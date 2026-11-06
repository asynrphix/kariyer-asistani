import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

import { generateWithRetry, GeminiRequestError, getUserFriendlyGeminiErrorMessage } from "@/lib/gemini";
import { redactSensitiveInfo } from "@/lib/redact";

function normalizeMessages(messages: unknown[]) {
  return messages
    .filter((message) => typeof message === "object" && message !== null)
    .map((message) => {
      const candidate = message as { role?: unknown; content?: unknown };
      const role = candidate.role;
      const content = typeof candidate.content === "string" ? candidate.content.trim() : "";
      return {
        role: role === "assistant" || role === "user" ? role : "user",
        content: content.slice(0, 2000),
      };
    })
    .filter((message) => message.content.length > 0)
    .slice(-10);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as {
      messages?: unknown[];
      ilan?: string;
      cv?: string;
      analiz?: unknown;
    };

    const messages = normalizeMessages(Array.isArray(body?.messages) ? body.messages : []);
    const ilan = typeof body?.ilan === "string" ? body.ilan.trim() : "";
    const cv = typeof body?.cv === "string" ? body.cv.trim() : "";
    const analysis = body?.analiz ?? null;

    if (!messages.length || !ilan || !cv || !analysis) {
      return NextResponse.json(
        { error: "İlan, CV ve analiz sonucu gereklidir." },
        { status: 400 },
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY tanımlı değil." },
        { status: 500 },
      );
    }

    const model = process.env.GEMINI_MODEL;
    if (!model) {
      throw new Error("GEMINI_MODEL ortam değişkeni tanımlı değil. Lütfen .env.local içinde tanımlayın.");
    }

    const fallbackModel = process.env.GEMINI_FALLBACK_MODEL;
    const ai = new GoogleGenAI({ apiKey });
    const safeCv = redactSensitiveInfo(cv);
    const today = new Date().toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    const systemInstruction = `Sen bu kullanıcının kariyer asistanısın. Aşağıdaki ilanı, CV'yi ve analiz sonucunu biliyorsun. Sadece CV'de gerçekten yazan bilgileri kullan; deneyim, beceri, tarih veya rakam UYDURMA. Kullanıcının sohbette kendisi açıkça belirttiği deneyim ve becerileri kullanabilirsin; bunları kullandığında cevabın sonunda "📝 Bu bilgileri sohbette sen belirttin, CV'ne de eklemeyi unutma." notunu ekle. Kullanıcının belirtmediği hiçbir bilgiyi uydurma. CV'de olmayan bir şeyi yazman gerekirse bunu açıkça belirt ve kullanıcıya sor. Kariyer, bu başvuru ve iş arama dışındaki konulara kibarca geri dön. Bugünün tarihi: ${today}. Cevapların kısa, net ve Türkçe olsun.`;

    const evidenceText = JSON.stringify(
      {
        ilan,
        cv: safeCv,
        analiz: analysis,
      },
      null,
      2,
    );

    const conversationText = messages
      .map((message) => `${message.role === "user" ? "Kullanıcı" : "Asistan"}: ${message.content}`)
      .join("\n\n");

    const combinedPrompt = `İŞLENEN VERİ:
${evidenceText}

SOHBET GEÇMİŞİ:
${conversationText}`;

    const streamResponse = (await generateWithRetry({
      ai,
      model,
      contents: combinedPrompt,
      config: {
        systemInstruction,
        temperature: 0.3,
      },
      fallbackModel,
      stream: true,
      timeoutMs: 20000,
      totalTimeoutMs: 60000,
    })) as AsyncIterable<{ text?: string }>;

    return new NextResponse(
      new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();
          let receivedAnyChunk = false;

          try {
            const iterator = (streamResponse as AsyncIterable<{ text?: string }>)[Symbol.asyncIterator]();
            const timeoutMs = 20000;

            while (true) {
              const nextChunk = Promise.race([
                iterator.next(),
                new Promise<never>((_, reject) => {
                  setTimeout(() => reject(new GeminiRequestError("İstek zaman aşımına uğradı, lütfen tekrar deneyin.", 504, "TIMEOUT")), timeoutMs);
                }),
              ]);

              const result = await nextChunk;
              if (result.done) {
                break;
              }

              const text = result.value?.text ?? "";
              if (text) {
                receivedAnyChunk = true;
                controller.enqueue(encoder.encode(text));
              }
            }

            if (!receivedAnyChunk) {
              controller.enqueue(encoder.encode("İstek zaman aşımına uğradı, lütfen tekrar deneyin."));
            }
          } catch (error) {
            const message =
              error instanceof GeminiRequestError
                ? error.message
                : getUserFriendlyGeminiErrorMessage(error);
            controller.enqueue(encoder.encode(message));
          } finally {
            controller.close();
          }
        },
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
        },
      },
    );
  } catch (error) {
    const geminiError = error as GeminiRequestError;
    console.error("Chat akışı başarısız oldu.", {
      name: geminiError?.name,
      status: geminiError?.status,
      code: geminiError?.code,
      message: geminiError?.message,
    });

    return NextResponse.json(
      {
        error:
          geminiError?.status === 503
            ? "Yapay zekâ servisi şu an çok yoğun. Lütfen birkaç saniye sonra tekrar deneyin."
            : geminiError?.status === 429
              ? "Kullanım sınırına ulaşıldı. Lütfen biraz sonra tekrar deneyin."
              : "Analiz sırasında bir hata oluştu. Lütfen tekrar deneyin.",
      },
      {
        status: geminiError?.status ?? 500,
      },
    );
  }
}
