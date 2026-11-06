export function redactSensitiveInfo(value: string) {
  const text = value ?? "";

  return text
    .replace(/(?:\+?\d[\d\s().-]{7,}\d)/g, "[telefon]")
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[e-posta]")
    .replace(/\b(?:Adres|Adresim|Mahalle|İlçe|Şehir|City|Street|Address)\s*[:\-]\s*[^\n]+/gi, "[adres]")
    .replace(/\b(?:\d{4,5}\s+[A-Za-zÇĞİÖŞÜçğıöşü\.\s-]+(?:Mahallesi|Cadde|Sokak|Bulvar|Sk\.|Cd\.|No\.|\d+))\b/gi, "[adres]")
    .replace(/\s{2,}/g, " ")
    .trim();
}
