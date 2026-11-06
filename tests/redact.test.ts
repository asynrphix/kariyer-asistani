import { describe, expect, it } from "vitest";

import { redactSensitiveInfo } from "@/lib/redact";

describe("redactSensitiveInfo", () => {
  it("telefon ve e-posta bilgilerini temizler", () => {
    const text = "İletişim: +90 (501) 692 63 78, ornek@ornek.com";
    const redacted = redactSensitiveInfo(text);

    expect(redacted).not.toContain("+90");
    expect(redacted).not.toContain("ornek@ornek.com");
    expect(redacted).toContain("[telefon]");
    expect(redacted).toContain("[e-posta]");
  });
});
