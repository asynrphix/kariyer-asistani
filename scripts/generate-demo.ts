import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { DEMO_CV_TEXT } from "../lib/demo-data";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const ilan = readFileSync(path.join(rootDir, "tests", "fixtures", "demo-ilan.txt"), "utf8");
const cv = DEMO_CV_TEXT;

const payload = {
  uyumPuani: 74,
  gereksinimler: [
    { madde: "Web tabanlı ürünlerde arka uç ve API geliştirme süreçlerine katkıda bulunmak", tur: "gorev", durum: "var", kanit: "React ve Next.js ile uygulama akışı kurdu; API entegrasyonu ve arayüz mantığını birlikte geliştirdi.", kaynak: "gorev", duzeltildi: false, kanitGucu: "guclu" },
    { madde: "Kullanıcı ihtiyaçlarını anlama, teknik tasarımı geliştirme ve kod üretmek", tur: "gorev", durum: "var", kanit: "Mevcut projelerde kullanıcı akışı ve arayüz gereksinimlerini çözmeye odaklandı.", kaynak: "gorev", duzeltildi: false, kanitGucu: "guclu" },
    { madde: "Takım içinde görev paylaşımı yaparak hızlı ve temiz yazılım teslim etmek", tur: "gorev", durum: "var", kanit: "Takım içinde görevi paylaşma ve öğrenme odaklı çalışma yaklaşımı gösterdi.", kaynak: "gorev", duzeltildi: false, kanitGucu: "guclu" },
    { madde: "Hata ayıklama, test ve bakım süreçlerinde aktif rol almak", tur: "gorev", durum: "kismen", kanit: "Hata ayıklama ve temel test yaklaşımı var; otomasyon ve bakım deneyimi sınırlı.", kaynak: "gorev", duzeltildi: false, kanitGucu: "zayif" },
    { madde: "Mevcut sistemlerde iyileştirme ve optimizasyon çalışmaları yürütmek", tur: "gorev", durum: "kismen", kanit: "İyileştirme ve veri akışı düzenlemeleri var; optimizasyon derinliği sınırlı.", kaynak: "gorev", duzeltildi: false, kanitGucu: "zayif" },
    { madde: "JavaScript ve TypeScript bilgisine sahip olmak", tur: "zorunlu", durum: "var", kanit: "CV'de JavaScript ve TypeScript kullanımına dair net bilgiler yer alıyor.", kaynak: "nitelik", duzeltildi: false, kanitGucu: "guclu" },
    { madde: "HTML, CSS, React ve Node.js ile çalışma deneyimi bulunmak", tur: "zorunlu", durum: "var", kanit: "React ve Node.js i içeren web geliştirme bilgisi CV'de açıkça belirtilmiş.", kaynak: "nitelik", duzeltildi: false, kanitGucu: "guclu" },
    { madde: "REST API tasarımı ve backend geliştirme becerisi göstermek", tur: "zorunlu", durum: "kismen", kanit: "API entegrasyonu bilgisi var; tam arka uç tasarımı değil.", kaynak: "nitelik", duzeltildi: false, kanitGucu: "zayif" },
    { madde: "SQL ve veritabanı temel kavramlarına hâkim olmak", tur: "zorunlu", durum: "var", kanit: "SQL ve veri modelleme bilgisi CV'de yer alıyor.", kaynak: "nitelik", duzeltildi: false, kanitGucu: "guclu" },
    { madde: "Temel test ve hata ayıklama becerisi göstermek", tur: "zorunlu", durum: "kismen", kanit: "Hata ayıklama ve test mantığı var; otomasyon deneyimi yok.", kaynak: "nitelik", duzeltildi: false, kanitGucu: "zayif" },
    { madde: "Ekip içi iletişim, öğrenme isteği ve problem çözme becerisine sahip olmak", tur: "zorunlu", durum: "var", kanit: "Takım çalışması ve öğrenmeye açıklık belirtilmiş.", kaynak: "nitelik", duzeltildi: false, kanitGucu: "guclu" },
    { madde: "Next.js veya benzeri modern web framework deneyimi", tur: "tercih", durum: "var", kanit: "Next.js kullanımı CV'de net şekilde belirtilmiş.", kaynak: "nitelik", duzeltildi: false, kanitGucu: "guclu" },
    { madde: "Tailwind CSS kullanımı ve arayüz geliştirme bilgisi", tur: "tercih", durum: "yok", kanit: "CV'de Tailwind kullanımına dair uygun kanıt bulunmuyor.", kaynak: "nitelik", duzeltildi: false, kanitGucu: "zayif" },
    { madde: "Git ve iş akışı yönetimi bilgisi", tur: "tercih", durum: "var", kanit: "Git/GitHub kullanımı CV'de yer alıyor.", kaynak: "nitelik", duzeltildi: false, kanitGucu: "guclu" },
    { madde: "Test otomasyonu veya UI test becerisi", tur: "tercih", durum: "yok", kanit: "CV'de otomasyon veya UI test deneyimi gösterilmiyor.", kaynak: "nitelik", duzeltildi: false, kanitGucu: "zayif" },
    { madde: "API entegrasyonu ve üçüncü taraf servislerle bağlanma deneyimi", tur: "tercih", durum: "var", kanit: "CV'de API entegrasyonu ve proje bazlı web geliştirme deneyimi var.", kaynak: "nitelik", duzeltildi: false, kanitGucu: "guclu" },
    { madde: "Docker veya konteyner araçlarıyla çalışma bilgisi", tur: "tercih", durum: "yok", kanit: "CV'de Docker kullanımına dair kanıt yok.", kaynak: "nitelik", duzeltildi: false, kanitGucu: "zayif" }
  ],
  eksikBeceriler: ["Docker", "UI test otomasyonu"],
  anahtarKelimeler: [
    { kelime: "JavaScript", cvdeVar: true, eslesenTerim: "javascript" },
    { kelime: "TypeScript", cvdeVar: true, eslesenTerim: "typescript" },
    { kelime: "React", cvdeVar: true, eslesenTerim: "react" },
    { kelime: "Next.js", cvdeVar: true, eslesenTerim: "next.js" },
    { kelime: "Node.js", cvdeVar: true, eslesenTerim: "node.js" },
    { kelime: "REST API", cvdeVar: true, eslesenTerim: "rest api" },
    { kelime: "SQL", cvdeVar: true, eslesenTerim: "sql" },
    { kelime: "Git", cvdeVar: true, eslesenTerim: "git" },
    { kelime: "Tailwind", cvdeVar: false, eslesenTerim: "tailwind" },
    { kelime: "Docker", cvdeVar: false, eslesenTerim: "docker" }
  ],
  onerilenCvMaddeleri: [
    "React ve Next.js üzerinde kullanıcı arayüzleri geliştirdim; modern web arayüzleri ve sayfa akışı tasarladım.",
    "TypeScript ve REST API entegrasyonlarıyla veri akışı kurup uygulama mantığını geliştirdim.",
    "SQL ve veri modelleme temellerini kullanarak projelerde yapılabilir çözümler ürettim.",
    "Takım çalışması içinde kod paylaşımı, hata ayıklama ve öğrenme odaklı geliştirme yaptım.",
    "Arayüz ve iş mantığı üzerinde iyileştirmeler yürüterek kullanıcı odaklı geliştirme yaptım."
  ],
  onYazi: "Örnek Teknoloji A.Ş. için Junior Yazılım Geliştirici pozisyonuna uygunluk yüksek. Özellikle React, Next.js, TypeScript, Node.js ve API entegrasyonu alanlarında temel güçlü yönler mevcut. CV'deki deneyim ve beceriler ilan metnindeki ana gereksinimlerle örtüşüyor. Tailwind ve otomasyon alanında daha fazla güçlenme katkı sağlayabilir; bu alanlara kısa odaklı gelişim planı hazırlanabilir.",
  firma: "Örnek Teknoloji A.Ş.",
  pozisyon: "Junior Yazılım Geliştirici",
  cached: false,
  ilanOzeti: {
    firma: "Örnek Teknoloji A.Ş.",
    meslek: "Junior Yazılım Geliştirici",
    sonBasvuruTarihi: "2026-12-15",
    sonBasvuruyaKalanGun: 39,
    basvuruSayisi: 62,
    pozisyonSayisi: 2,
    pozisyonBasinaBasvuru: 31,
  }
};

const outputPath = path.join(rootDir, "lib", "demo-result.json");
writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
console.log(`Demo analizi kaydedildi: ${outputPath}`);
console.log(`İlan: ${ilan.split(/\r?\n/).slice(0, 2).join(" — ")}`);
console.log(`CV: ${cv.split(/\r?\n/).find(Boolean) ?? "Örnek Aday"}`);
