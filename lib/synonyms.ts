export const SYNONYM_GROUPS = [
  ["ai agent", "yapay zeka ajanı", "yapay zeka ajani", "agent", "ajan"],
  ["yapay zeka", "ai", "artificial intelligence", "yapay zekâ"],
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

export function textMatchesConcept(text: string, concept: string) {
  const haystack = normalizeSynonymText(text);
  const variants = getSynonymVariants(concept);

  if (!haystack || variants.length === 0) {
    return false;
  }

  return variants.some((variant) => {
    if (!variant) return false;
    if (haystack.includes(variant)) return true;
    return haystack.split(/\s+/).includes(variant);
  });
}
