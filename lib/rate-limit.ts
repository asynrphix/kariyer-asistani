import crypto from "node:crypto";

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export type LimitKind = "analyze" | "chat" | "ocr";

export const PER_USER_DAILY: Record<LimitKind, number> = {
  analyze: 5,
  chat: 20,
  ocr: 3,
};

const GLOBAL_DAILY = Number(process.env.GLOBAL_DAILY_LIMIT ?? 400);
const DAY_MS = 24 * 60 * 60 * 1000;

export type LimitResult = { ok: true } | { ok: false; scope: "user" | "global"; resetAt: number };

function createRedis(): Redis | null {
  // Upstash'ten doğrudan veya Vercel entegrasyonundan gelen değişken adlarının ikisini de kabul et
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

const redis = createRedis();

const limiters = redis
  ? {
      analyze: new Ratelimit({ redis, limiter: Ratelimit.fixedWindow(PER_USER_DAILY.analyze, "1 d"), prefix: "ka:user:analyze" }),
      chat: new Ratelimit({ redis, limiter: Ratelimit.fixedWindow(PER_USER_DAILY.chat, "1 d"), prefix: "ka:user:chat" }),
      ocr: new Ratelimit({ redis, limiter: Ratelimit.fixedWindow(PER_USER_DAILY.ocr, "1 d"), prefix: "ka:user:ocr" }),
      global: new Ratelimit({ redis, limiter: Ratelimit.fixedWindow(GLOBAL_DAILY, "1 d"), prefix: "ka:global" }),
    }
  : null;

// Redis yoksa veya hata verirse kullanılan basit bellek sayacı (sunucu yeniden başlarsa sıfırlanır)
const memory = new Map<string, { count: number; windowStart: number }>();

function memoryHit(key: string, max: number, now = Date.now()) {
  const windowStart = Math.floor(now / DAY_MS) * DAY_MS;
  const reset = windowStart + DAY_MS;
  const entry = memory.get(key);

  if (!entry || entry.windowStart !== windowStart) {
    memory.set(key, { count: 1, windowStart });
    return { success: true, reset };
  }
  if (entry.count >= max) {
    return { success: false, reset };
  }
  entry.count += 1;
  return { success: true, reset };
}

/** IP adresini saklamamak için tuzlu SHA-256 özetini döndürür. */
export function getClientId(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  const salt = process.env.RATE_LIMIT_SALT ?? "kariyer-asistani";
  return crypto.createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32);
}

export async function checkLimit(kind: LimitKind, clientId: string): Promise<LimitResult> {
  // Yerel geliştirmede limit kapalı (test etmek için .env.local'e FORCE_RATE_LIMIT=1 ekle)
  if (process.env.NODE_ENV === "development" && !process.env.FORCE_RATE_LIMIT) {
    return { ok: true };
  }

  if (limiters) {
    try {
      const user = await limiters[kind].limit(clientId);
      if (!user.success) return { ok: false, scope: "user", resetAt: user.reset };

      const global = await limiters.global.limit("all");
      if (!global.success) return { ok: false, scope: "global", resetAt: global.reset };

      return { ok: true };
    } catch (error) {
      console.error("Upstash limit kontrolü başarısız, bellek sayacına geçiliyor.", {
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const user = memoryHit(`user:${kind}:${clientId}`, PER_USER_DAILY[kind]);
  if (!user.success) return { ok: false, scope: "user", resetAt: user.reset };

  const global = memoryHit("global", GLOBAL_DAILY);
  if (!global.success) return { ok: false, scope: "global", resetAt: global.reset };

  return { ok: true };
}

const LABELS: Record<LimitKind, string> = {
  analyze: "analiz",
  chat: "sohbet mesajı",
  ocr: "görüntüden okuma",
};

export function limitMessage(result: Extract<LimitResult, { ok: false }>, kind: LimitKind): string {
  const saat = new Intl.DateTimeFormat("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Istanbul",
  }).format(new Date(result.resetAt));

  if (result.scope === "user") {
    return `Bugünlük ücretsiz ${LABELS[kind]} hakkın doldu (günde ${PER_USER_DAILY[kind]}). Yenilenme saati: ${saat}.`;
  }
  return `Bugün uygulamanın günlük toplam kapasitesi doldu. Bu ücretsiz bir proje; yenilenme saati: ${saat}. Anlayışın için teşekkürler!`;
}