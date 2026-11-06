function normalizeLinkedInLine(line: string) {
  return line.replace(/\s+/g, " ").trim();
}

export function extractLinkedInMeta(text: string) {
  if (!text) return { firma: "", pozisyon: "" };

  const lines = text
    .split(/\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  const positionIndex = lines.findIndex((line) => /(?:mühendisi|engineer|developer|software|embedded|analyst)/i.test(line));
  const position = positionIndex >= 0 ? lines[positionIndex] : "";

  let firma = "";
  if (positionIndex > 0) {
    const before = lines[positionIndex - 1].replace(/^company logo for,?\s*/i, "").trim();
    if (before && !/^(?:about the job|iş hakkında|search|home|network|jobs|messaging|notifications|show match details|tailor my resume|premium|saved)$/i.test(before)) {
      firma = before;
    }
  }

  return { firma, pozisyon: position };
}

export function parseLinkedInCompetitionMeta(text: string) {
  if (!text) return null;

  const exp = /(?:over\s+)?(\d{1,3}\+?)\s+(?:applicants|başvuru)(?:\s+.*)?/i;
  const applicantsMatch = text.match(exp) ?? text.match(/(\d{1,3}\+?)\s*(?:applicants|başvuruda|başvuru)/i);
  const recentMatch = text.match(/(\d+)\s+(?:days?\s+ago|gün\s+önce|gun\s+once)/i);

  const value = applicantsMatch ? applicantsMatch[1].replace("+", "") : null;
  const applicantCount = value ? Number(value) : 0;
  const daysAgo = recentMatch ? Number(recentMatch[1]) : null;
  const labelBase = applicantsMatch ? `${value === "100" ? "100+" : value} başvuru` : null;
  const whenText = recentMatch ? `${recentMatch[1]} gün önce` : null;

  if (!labelBase && !whenText) {
    return null;
  }

  return {
    value: applicantCount,
    applicantCount,
    daysAgo,
    label: `${labelBase ?? "100+ başvuru"} · ${whenText ?? "az önce"} (LinkedIn)`,
  };
}

export function cleanLinkedInJobText(text: string) {
  if (!text) return "";

  let cleaned = text.replace(/\r/g, "\n");

  const startRegex = /(?:^|\n)\s*(?:About the job|İş hakkında)\s*[:\-]?\s*(?:\n|$)/i;
  const startMatch = cleaned.match(startRegex);
  if (startMatch) {
    const startIndex = cleaned.indexOf(startMatch[0]);
    cleaned = cleaned.slice(startIndex + startMatch[0].length);
  }

  const endRegex = /(?:^|\n)\s*(?:About the company|Hakkımızda|Başvuru|How to apply|Questions\?|Visit our Help Center|Select language|About\b|Accessibility|Careers|Privacy & Terms|Advertising|Mobile|LinkedIn Corporation|More jobs|See more jobs like this|Looking for talent\?|Post a job)\b/i;
  const endMatch = cleaned.match(endRegex);
  if (endMatch) {
    const endIndex = cleaned.indexOf(endMatch[0]);
    cleaned = cleaned.slice(0, endIndex);
  }

  const lines = cleaned
    .split(/\n/)
    .map((line) => normalizeLinkedInLine(line))
    .filter(Boolean)
    .filter((line) => !/^(?:show match details|tailor my resume|show more|daha fazla göster|premium|linkedin|apply now|notifications|search|home|network|jobs|messaging|me|for business|get hired for|saved|help me stand out|more company details|more jobs|status is online|0 notifications|Aselsan|Off|Set alert for similar jobs|About|Company logo for|Follow|1,843 followers|2-10 employees|7 on LinkedIn)$/i.test(line))
    .filter((line) => !/status is online/i.test(line))
    .filter((line) => !/\b(?:online|status is online)\b/i.test(line))
    .filter((line) => !/\b(?:over\s+\d+\s+applicants|\d+\s+days?\s+ago|\d+\s+gün\s+önce|\d+\s+gun\s+once|\d+\s+başvuru|\d+\s+başvuruda)\b/i.test(line))
    .filter((line) => !/https?:\/\/[^\s]+/i.test(line))
    .filter((line) => !/^\d+\s+notifications?$/i.test(line))
    .filter((line) => !/^more jobs$/i.test(line))
    .filter((line) => !/^aselsan$/i.test(line))
    .filter((line) => !/premium/i.test(line));

  const firstSectionIndex = lines.findIndex((line) => /^(?:İş Tanımı|Job Description|Görev Tanımı|Sorumluluklar|Responsibilities|Aranan Nitelikler|Nitelikler|Gereksinimler|Requirements|Qualifications|Tercih Sebebi|Tercih Sebebi Olacak Yetkinlikler|Preferred|Nice to have|Bonus|Artı|Tercihen)/i.test(line));
  const relevantLines = firstSectionIndex >= 0 ? lines.slice(firstSectionIndex) : lines;

  return relevantLines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}
