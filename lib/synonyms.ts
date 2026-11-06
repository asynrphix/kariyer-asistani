export const SYNONYM_GROUPS = [
  ["ai agent", "yapay zeka ajanı", "yapay zeka ajani", "agent", "ajan"],
  ["yapay zeka", "ai", "artificial intelligence", "yapay zekâ"],
  ["gömülü sistemler", "gömülü sistem", "embedded systems", "embedded software", "embedded", "gömülü yazılım"],
  ["test", "testing", "unit test", "birim test", "test etme", "test yazımı"],
  ["hata ayıklama", "debugging", "debug", "debug etme"],
  ["api entegrasyonu", "api integration", "api", "entegrasyon"],
  ["veri işleme", "veri isleme", "data processing", "veri analizi"],
  ["llm", "büyük dil modeli", "buyuk dil modeli", "large language model"],
] as const;

export function normalizeSynonymText(value: string) {
  return value
    .toLocaleLowerCase("tr")
    .replace(/[ıİ]/g, "i")
    .replace(/[şŞ]/g, "s")
    .replace(/[ğĞ]/g, "g")
    .replace(/[üÜ]/g, "u")
    .replace(/[öÖ]/g, "o")
    .replace(/[çÇ]/g, "c")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function getSynonymVariants(value: string): string[] {
  const target = normalizeSynonymText(value);
  const variants = new Set<string>(target ? [target] : []);

  for (const group of SYNONYM_GROUPS) {
    const normalizedGroup = group
      .map((entry) => normalizeSynonymText(entry))
      .filter(Boolean);

    const groupHasMatch = normalizedGroup.some((entry) => {
      if (!entry) return false;
      return entry === target || entry.includes(target) || target.includes(entry);
    });

    if (!groupHasMatch) continue;

    normalizedGroup.forEach((entry) => variants.add(entry));
  }

  return Array.from(variants).filter(Boolean);
}

export function findMatchingTermInText(text: string, concept: string) {
  const haystack = normalizeSynonymText(text);
  const normalizedConcept = normalizeSynonymText(concept);
  const variants = new Set([normalizedConcept, ...getSynonymVariants(normalizedConcept)]);

  if (!haystack || !normalizedConcept || variants.size === 0) {
    return null;
  }

  for (const variant of Array.from(variants)) {
    if (!variant) continue;
    if (haystack.includes(variant)) return variant;
    if (haystack.split(/\s+/).includes(variant)) return variant;
  }

  return null;
}

export function textMatchesConcept(text: string, concept: string) {
  return Boolean(findMatchingTermInText(text, concept));
}

export function mergeKeywordTerms(...entries: string[]) {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const entry of entries) {
    if (!entry || !entry.trim()) continue;

    const normalized = normalizeSynonymText(entry);
    const variants = getSynonymVariants(normalized);

    const isDuplicate = [...seen].some((existing) => {
      const existingNormalized = normalizeSynonymText(existing);
      return existingNormalized === normalized || variants.some((variant) => {
        const candidate = normalizeSynonymText(existing);
        return candidate === variant || candidate.includes(variant) || variant.includes(candidate);
      });
    });

    if (isDuplicate) continue;

    seen.add(entry.trim());
    result.push(entry.trim());
  }

  return result;
}
