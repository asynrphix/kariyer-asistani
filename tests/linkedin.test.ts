import { describe, expect, it } from "vitest";

import { cleanLinkedInJobText } from "@/lib/linkedin";

describe("cleanLinkedInJobText", () => {
  it("LinkedIn reklam ve menü metinlerini keser ve temiz metni döndürür", () => {
    const raw = `
      Premium
      Company Name
      Senior Frontend Engineer
      Show match details
      https://example.com
      About the job
      We are hiring a frontend engineer.
      You will build product features.
      Show more
      Tailor my resume
      More company details
    `;

    const cleaned = cleanLinkedInJobText(raw);

    expect(cleaned).not.toContain("Show match details");
    expect(cleaned).not.toContain("Tailor my resume");
    expect(cleaned).not.toContain("Show more");
    expect(cleaned).not.toContain("https://example.com");
    expect(cleaned).toContain("We are hiring a frontend engineer");
    expect(cleaned).toContain("You will build product features");
  });
});
