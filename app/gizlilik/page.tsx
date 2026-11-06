import Link from "next/link";

const sonGuncelleme = "6 Kasım 2026";

function Bolum({ baslik, children }: { baslik: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-bold text-[#1E1B4B] dark:text-slate-100">{baslik}</h2>
      <div className="mt-3 space-y-3 text-sm leading-7 text-[#4B5563] dark:text-slate-300">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#F7F5FF] px-6 py-12 text-[#1E1B4B] dark:bg-[#1A1730] dark:text-slate-100">
      <div className="mx-auto max-w-3xl rounded-[28px] border border-[#EAE4F8] bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-[#24203D]">
        <Link
          href="/"
          className="mb-6 inline-flex text-sm font-semibold text-violet-700 underline-offset-2 hover:underline dark:text-violet-300"
        >
          ← Ana sayfaya dön
        </Link>

        <h1 className="text-3xl font-black">Gizlilik</h1>
        <p className="mt-2 text-xs text-[#6B7280] dark:text-slate-400">Son güncelleme: {sonGuncelleme}</p>

        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-7 text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
          <strong>Kısaca:</strong> Analiz için ilan ve CV metnin Google Gemini’ye gönderilir. Uygulama Gemini’nin
          ücretsiz katmanını kullanır; Google bu katmanda gönderilen içeriği ürünlerini geliştirmek için kullanabilir ve
          insan incelemeciler okuyabilir. Paylaşmak istemediğin bilgileri (ör. adın, kimlik veya sağlık bilgisi) CV’nden
          çıkararak yapıştır. Adını çıkarmak analiz sonucunu değiştirmez.
        </div>

        <Bolum baslik="Hesap, çerez ve izleme">
          <p>Kayıt veya giriş yok. Çerez, reklam ya da analitik/izleme aracı kullanılmaz.</p>
        </Bolum>

        <Bolum baslik="Analiz sırasında ne gönderilir?">
          <p>
            “Analiz Et”e bastığında ilan ve CV metnin sunucumuza, oradan da Google Gemini API’ye gönderilir. Göndermeden
            önce CV’ndeki telefon numarası, e-posta ve adres bilgisi otomatik olarak temizlenmeye çalışılır. Bu temizleme
            her biçimi yakalamayabilir ve adını temizlemez.
          </p>
          <p>
            İŞKUR ilanlarındaki irtibat bilgileri ve uyarı metinleri gönderilmeden önce çıkarılır; yalnızca iş tanımı ve
            nitelikler gönderilir.
          </p>
          <p>
            <strong>İstisna:</strong> Resim olarak kaydedilmiş bir PDF için “Görüntüden oku” seçeneğini kullanırsan, PDF
            dosyası olduğu gibi Gemini’ye gönderilir. Görüntüdeki iletişim bilgileri önceden temizlenemez.
          </p>
          <p>Asistana yazdığın sohbet mesajları ve analiz bağlamı da yanıt üretmek için Gemini’ye gönderilir.</p>
        </Bolum>

        <Bolum baslik="Sunucuda ne tutulur?">
          <p>
            CV ve ilan metni veritabanına veya dosyaya kaydedilmez, içerik loglanmaz. Aynı metin kısa süre içinde tekrar
            gönderilirse gereksiz istek yapmamak için sonuç en fazla 1 saat sunucu belleğinde tutulabilir; bu kayıt
            metnin kendisiyle değil, metnin özetiyle (SHA-256) eşleştirilir.
          </p>
          <p>
            Site Vercel üzerinde barındırılır; barındırma sağlayıcısı IP adresi ve istek zamanı gibi standart erişim
            kayıtları tutabilir.
          </p>
                    <p>
            Kötüye kullanımı önlemek için günlük kullanım sınırı uygulanır. Bunun için IP adresinin kendisi değil, tek
            yönlü özeti (SHA-256) en fazla bir gün boyunca bir sayaç olarak Upstash (Redis) üzerinde tutulur.
          </p>
        </Bolum>

        <Bolum baslik="Tarayıcında ne tutulur?">
          <p>
            Analiz geçmişin (en fazla 30 kayıt), tema tercihin ve yalnızca “CV’mi bu tarayıcıda hatırla” seçeneğini
            işaretlersen CV’n, bu tarayıcının yerel depolamasında (localStorage) tutulur ve sunucumuza gönderilmez.
          </p>
          <p>
            Bunları uygulamadaki “Geçmiş → Tüm verilerimi sil” ile veya tarayıcı verilerini temizleyerek silebilir,
            “Verilerimi dışa aktar” ile JSON olarak indirebilirsin.
          </p>
        </Bolum>

        <Bolum baslik="Google Gemini">
          <p>
            Gemini’ye gönderilen içerik Google’ın{" "}
            <a
              href="https://ai.google.dev/gemini-api/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-violet-700 underline underline-offset-2 dark:text-violet-300"
            >
              Gemini API kullanım şartlarına
            </a>{" "}
            ve{" "}
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-violet-700 underline underline-offset-2 dark:text-violet-300"
            >
              gizlilik politikasına
            </a>{" "}
            tabidir. Ücretsiz katmanda Google içeriği ürünlerini geliştirmek için kullanabilir ve insan incelemeciler
            okuyabilir; Google bu nedenle hassas, gizli veya kişisel bilgi gönderilmemesini önerir.
          </p>
        </Bolum>

        <Bolum baslik="Kimler için?">
          <p>
            Uygulama 18 yaş ve üzeri iş arayanlar için tasarlanmıştır ve Türkiye’deki kullanıcılar düşünülerek
            hazırlanmıştır. Puanlar tahminidir; gerçek işe alım sistemleri farklı çalışabilir.
          </p>
        </Bolum>

        <Bolum baslik="Açık kaynak ve iletişim">
          <p>
            Uygulamanın tüm kodu açık kaynaktır; bu sayfada yazanları{" "}
            <a
              href="https://github.com/asynrphix/kariyer-asistani"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-violet-700 underline underline-offset-2 dark:text-violet-300"
            >
              GitHub’da
            </a>{" "}
            kendin doğrulayabilirsin. Soru ve önerilerin için{" "}
            <a
              href="https://github.com/asynrphix/kariyer-asistani/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-violet-700 underline underline-offset-2 dark:text-violet-300"
            >
              GitHub Issues
            </a>{" "}
            üzerinden yazabilirsin.
          </p>
        </Bolum>
      </div>
    </main>
  );
}