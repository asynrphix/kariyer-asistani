export const SYNONYM_GROUPS = [
  ["ai agent", "yapay zeka ajani", "agent", "ajan"],
  ["yapay zeka", "ai", "artificial intelligence", "yapay zekâ"],
  ["test", "testing", "test etme", "test yazimi"],
  ["hata ayiklama", "debugging", "debug", "debug etme"],
  ["api entegrasyonu", "api integration", "api", "entegrasyon"],
  ["veri isleme", "data processing", "veri analizi"],
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
    const normalizedGroup = group.map((entry) => normalizeSynonymText(entry));
    const groupHasMatch = normalizedGroup.some((entry) => {
      if (!entry) return false;
      return entry === target || entry.includes(target) || target.includes(entry);
    });

    if (!groupHasMatch) continue;

    normalizedGroup.filter(Boolean).forEach((entry) => variants.add(entry));
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
