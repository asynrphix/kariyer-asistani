export type RequirementTur = "zorunlu" | "tercih";
export type RequirementStatus = "var" | "kismen" | "yok";
export type RequirementSource = "gorev" | "nitelik";

export interface AnalysisRequirement {
  madde: string;
  tur: RequirementTur;
  durum: RequirementStatus;
  kanit: string;
  kaynak?: RequirementSource;
  duzeltildi?: boolean;
}

export interface AnalysisKeyword {
  kelime: string;
  cvdeVar: boolean;
}

export interface IskurSummary {
  ilanNo?: string;
  firma?: string;
  yayinTarihi?: string;
  sonBasvuruTarihi?: string;
  sonBasvuruyaKalanGun?: number;
  pozisyonSayisi?: number;
  basvuruSayisi?: number;
  pozisyonBasinaBasvuru?: number;
  goruntulenmeSayisi?: number;
  calismaSekli?: string;
  meslek?: string;
  deneyimYili?: number;
  enAzOgrenim?: string;
  calismaAdresi?: string;
  irtibatAdSoyad?: string;
  irtibatEposta?: string;
}

export interface AnalysisResult {
  uyumPuani: number;
  gereksinimler: AnalysisRequirement[];
  eksikBeceriler: string[];
  anahtarKelimeler: AnalysisKeyword[];
  onerilenCvMaddeleri: string[];
  onYazi: string;
  iskurProfilOnerileri?: string[];
  ilanOzeti?: IskurSummary;
}
