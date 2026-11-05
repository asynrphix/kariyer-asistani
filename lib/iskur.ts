import type { IskurSummary } from "./types";

const UYARI_MARKERS = [
  "UYARILAR",
  "İŞSİZLİK ÖDENEĞİ ALIYORSANIZ DİKKAT",
  "SOSYAL YARDIM YARARLANICILARININ DİKKATİNE",
  "TAAHHÜT",
];

function normalizeWhitespace(value: string): string {
  return value.replace(/\r/g, "\n").replace(/\t/g, "\t").replace(/\n{3,}/g, "\n\n").trim();
}

function normalizeKey(value: string): string {
  return value
    .toLocaleLowerCase("tr-TR")
    .replace(/[:\-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseNumber(value?: string): number | undefined {
  if (!value) return undefined;
  const clean = value.replace(/[^0-9,\.]/g, "").replace(",", ".");
  if (!clean) return undefined;
  const parsed = Number(clean);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function extractDate(value?: string): Date | undefined {
  if (!value) return undefined;
  const match = value.match(/(\d{1,2})[\./-](\d{1,2})[\./-](\d{2,4})/);
  if (!match) return undefined;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const fullYear = year < 100 ? 2000 + year : year;
  const date = new Date(fullYear, month - 1, day);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function cleanIskurMetin(raw: string): string {
  let text = normalizeWhitespace(raw);

  for (const marker of UYARI_MARKERS) {
    const index = text.toUpperCase().indexOf(marker);
    if (index > -1) {
      text = text.slice(0, index).trim();
      break;
    }
  }

  text = text.replace(/\n{3,}/g, "\n\n");
  text = text.replace(/\n\s*[-•]\s*/g, "\n");
  text = text.replace(/[ \t]+\n/g, "\n");
  return text.trim();
}

function findField(text: string, patterns: RegExp[]): string | undefined {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return undefined;
}

function extractDayDiff(target?: string): number | undefined {
  if (!target) return undefined;
  const date = extractDate(target);
  if (!date) return undefined;
  const diff = Math.ceil((date.getTime() - Date.now()) / 86400000);
  return diff >= 0 ? diff : 0;
}

function extractSection(text: string, heading: string): string | undefined {
  const normalizedText = normalizeWhitespace(text);
  const headingIndex = normalizedText.toLowerCase().indexOf(heading.toLowerCase());
  if (headingIndex === -1) return undefined;

  const headingEndIndex = headingIndex + heading.length;
  const remainingText = normalizedText.slice(headingEndIndex);
  const nextHeadingIndex = remainingText.search(
    /\n\s*(?:Meslek Bilgileri|Öğrenim ve Kişisel Bilgiler|Çalışma Adresi Bilgisi|İrtibat Bilgileri|Ücret ve Diğer Bilgiler|Önyazı Ekleme|Başvur|İşe Başvuru Detayı|Başvuru|İletişim|Notlar|Açıklama|İlan Özeti|Kriterler|İşe Alınacak Kişide Aranan Nitelikler)/i,
  );

  const sectionText = nextHeadingIndex === -1 ? remainingText : remainingText.slice(0, nextHeadingIndex);
  return sectionText.replace(/^\s*[:\-]?\s*/i, "").trim();
}

function parseTabMappedFields(text: string): Record<string, string> {
  const result: Record<string, string> = {};
  const lines = text.split(/\n+/);

  for (const line of lines) {
    const parts = line
      .split(/\t+/)
      .map((part) => part.replace(/\s+/g, " ").trim())
      .filter(Boolean);

    if (parts.length < 2) continue;

    for (let index = 0; index < parts.length - 1; index += 2) {
      const key = parts[index];
      const value = parts[index + 1];

      if (!key || !value) continue;
      if (/\d/.test(key) && !/\d/.test(value)) continue;
      if (/^\s*(?:Meslek|Deneyim|Yıl)\s*$/i.test(key)) continue;
      if (/^[A-Za-zÇĞİÖŞÜçğıöşü\s]+$/.test(value) && /[A-Za-zÇĞİÖŞÜçğıöşü]/.test(key)) {
        // value may be another label in tabular rows; skip if it's clearly a label
        const nextKey = parts[index + 2];
        if (nextKey && /^[A-Za-zÇĞİÖŞÜçğıöşü\s]+$/.test(nextKey)) {
          continue;
        }
      }

      result[normalizeKey(key)] = value.trim();
    }
  }

  return result;
}

function extractFirma(text: string): string | undefined {
  const lines = text
    .split(/\n+/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  let foundServiceCenter = false;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (/HİZMET MERKEZİ/i.test(line)) {
      foundServiceCenter = true;
      continue;
    }

    if (!foundServiceCenter) continue;
    if (/Yayınlanma Tarihi/i.test(line)) break;
    if (!line || /^\d+$/.test(line)) continue;
    if (/^\s*(?:İş|Türkiye İş Kurumu|ÇANKAYA|ANKARA|TÜRKİYE|Uyarı|Başvur|İşe Başvuru)/i.test(line)) {
      continue;
    }

    return line;
  }

  return undefined;
}

function extractMeslekVeDeneyim(text: string): { meslek?: string; deneyimYili?: number } {
  const lines = text.split(/\n+/).map((line) => line.trim()).filter(Boolean);

  for (let index = 0; index < lines.length - 1; index += 1) {
    const current = lines[index];
    const next = lines[index + 1];

    if (!/Meslek/i.test(current) || !/Deneyim/i.test(current)) continue;

    const row = next
      .split(/\t+/)
      .map((part) => part.trim())
      .filter(Boolean)
      .join(" ");

    const meslekMatch = row.match(/^(.+?)\s*Yıl\s*[:\-]?\s*(\d+)/i);
    const meslek = meslekMatch?.[1]?.trim();
    const deneyimYili = meslekMatch ? Number(meslekMatch[2]) : undefined;

    return { meslek, deneyimYili };
  }

  return {};
}

export function parseIskurIlan(raw: string): IskurSummary | null {
  if (!raw || typeof raw !== "string") return null;

  const normalized = normalizeWhitespace(raw);
  const isIskurFormat = /İlan\s*No|Firma|Yayın\s*Tarihi|Son\s*Başvuru/i.test(normalized);

  if (!isIskurFormat) {
    return null;
  }

  const cleaned = cleanIskurMetin(normalized);
  const tabFields = parseTabMappedFields(cleaned);
  const meslekBilgileri = extractMeslekVeDeneyim(cleaned);

  const ilanNo =
    findField(cleaned, [/İş\s*İlan\s*No\s*\(?\s*(\d+)\s*\)?/i, /İlan\s*No\s*\(?\s*(\d+)\s*\)?/i]) ??
    (cleaned.match(/\(\s*(\d+)\s*\)/)?.[1] ?? undefined);

  const firma = extractFirma(cleaned) ?? findField(cleaned, [/Firma\s*[:\-]?\s*([^\n]+)/i, /İşveren\s*[:\-]?\s*([^\n]+)/i]);
  const yayinTarihi =
    findField(cleaned, [/Yayınlanma\s*Tarihi\s*[:\-]?\s*([^\n]+)/i, /Yayın\s*Tarihi\s*[:\-]?\s*([^\n]+)/i]) ??
    tabFields["yayınlanma tarihi"];
  const sonBasvuruTarihi =
    tabFields["son başvuru tarihi"] ??
    findField(cleaned, [/Son\s*Başvuru\s*Tarihi\s*[:\-]?\s*([^\n]+)/i]);
  const basvuruSayisi = parseNumber(tabFields["başvuru sayısı"] ?? findField(cleaned, [/Başvuru\s*Sayısı\s*[:\-]?\s*([^\n]+)/i]));
  const pozisyonSayisi = parseNumber(tabFields["pozisyon"] ?? findField(cleaned, [/Pozisyon\s*[:\-]?\s*(\d+)/i, /Açık\s*Pozisyon\s*Sayısı\s*[:\-]?\s*(\d+)/i]));
  const goruntulenmeSayisi = parseNumber(tabFields["görüntülenme sayısı"] ?? findField(cleaned, [/Görüntülenme\s*Sayısı\s*[:\-]?\s*(\d+)/i]));
  const calismaSekli = tabFields["çalışma şekli"] ?? findField(cleaned, [/Çalışma\s*Şekli\s*[:\-]?\s*([^\n]+)/i]);
  const meslek = meslekBilgileri.meslek ?? findField(cleaned, [/Meslek\s*[:\-]?\s*([^\n]+)/i]);
  const deneyimYili =
    meslekBilgileri.deneyimYili ??
    parseNumber(tabFields["deneyim"] ?? findField(cleaned, [/Deneyim\s*Yılı\s*[:\-]?\s*(\d+)/i, /Tecrübe\s*[:\-]?\s*(\d+)/i]));
  const enAzOgrenim = findField(cleaned, [/En\s*Az\s*Öğrenim\s*[:\-]?\s*([^\n]+)/i, /Öğrenim\s*Durumu\s*[:\-]?\s*([^\n]+)/i]);
  const calismaAdresi = findField(cleaned, [/Çalışma\s*Adresi\s*[:\-]?\s*([^\n]+)/i, /Adres\s*[:\-]?\s*([^\n]+)/i]);
  const irtibatAdSoyad = findField(cleaned, [/Ad\s*Soyad\s*[:\-]?\s*([^\n]+)/i]);
  const irtibatEposta =
    findField(cleaned, [/E-posta\s*[:\-]?\s*([^\n]+)/i, /E-posta\s*[:\-]?\s*([A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,})/i]) ??
    cleaned.match(/[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}/i)?.[0];

  const pozisyonBasinaBasvuru =
    typeof basvuruSayisi === "number" && typeof pozisyonSayisi === "number" && pozisyonSayisi > 0
      ? Number((basvuruSayisi / pozisyonSayisi).toFixed(2))
      : undefined;

  const summary: IskurSummary = {
    ilanNo,
    firma,
    yayinTarihi,
    sonBasvuruTarihi,
    sonBasvuruyaKalanGun: extractDayDiff(sonBasvuruTarihi),
    pozisyonSayisi,
    basvuruSayisi,
    pozisyonBasinaBasvuru,
    goruntulenmeSayisi,
    calismaSekli,
    meslek,
    deneyimYili,
    enAzOgrenim,
    calismaAdresi,
    irtibatAdSoyad,
    irtibatEposta,
  };

  return summary;
}

export function getIskurGeminiText(raw: string): string {
  const cleaned = cleanIskurMetin(raw);
  const sections: string[] = [];

  const tanim = extractSection(cleaned, "İş Tanımı");
  const nitelik = extractSection(cleaned, "Nitelik ve Beceriler");

  if (tanim) sections.push(`İş Tanımı\n${tanim}`);
  if (nitelik) sections.push(`Nitelik ve Beceriler\n${nitelik}`);

  return sections.join("\n\n").trim();
}
