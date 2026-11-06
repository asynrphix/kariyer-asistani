import { describe, expect, it } from "vitest";

import { checkLimit, getClientId } from "../lib/rate-limit";

function fakeRequest(ip: string) {
  return new Request("http://localhost/api/analyze", {
    headers: { "x-forwarded-for": `${ip}, 10.0.0.1` },
  });
}

describe("kullanım limiti (bellek modu)", () => {
  it("kişi başı günde 5 analize izin verir, 6.'yı reddeder", async () => {
    const id = getClientId(fakeRequest("203.0.113.5"));
    for (let i = 0; i < 5; i++) {
      expect((await checkLimit("analyze", id)).ok).toBe(true);
    }
    const sixth = await checkLimit("analyze", id);
    expect(sixth.ok).toBe(false);
    if (!sixth.ok) expect(sixth.scope).toBe("user");
  });

  it("farklı kullanıcıları ayrı sayar", async () => {
    const other = getClientId(fakeRequest("203.0.113.99"));
    expect((await checkLimit("analyze", other)).ok).toBe(true);
  });

  it("IP adresini açık halde tutmaz", () => {
    const id = getClientId(fakeRequest("203.0.113.5"));
    expect(id).not.toContain("203.0.113.5");
    expect(id).toHaveLength(32);
  });
});