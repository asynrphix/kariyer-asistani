import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#F7F5FF] px-6 py-12 text-[#1E1B4B] dark:bg-[#1A1730] dark:text-slate-100">
      <div className="mx-auto max-w-3xl rounded-[28px] border border-[#EAE4F8] bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-[#24203D]">
        <Link href="/" className="mb-6 inline-flex text-sm font-semibold text-violet-700 underline-offset-2 hover:underline dark:text-violet-300">
          ← Ana sayfaya dön
        </Link>

        <h1 className="text-3xl font-black">Gizlilik</h1>
        <p className="mt-4 text-sm leading-7 text-[#4B5563] dark:text-slate-300">
          Bu uygulama, analiz geçmişi ve hatırlanan CV bilgilerini yalnızca kullanıcının tarayıcısında saklar. Veriler sunucumuza gönderilmez.
        </p>
        <p className="mt-4 text-sm leading-7 text-[#4B5563] dark:text-slate-300">
          Kullanıcı, ilan ve CV metnini Gemini&rsquo;ye analiz ettirmek için gönderebilir. Bu metinlerdeki telefon, e-posta ve açık adres satırları analiz öncesi temizlenir.
        </p>
        <p className="mt-4 text-sm leading-7 text-[#4B5563] dark:text-slate-300">
          Geçmiş ve hatırlanan CV bilgilerini istemediğinizde tarayıcı içindeki silme işlemini kullanabilir veya tüm verileri birlikte temizleyebilirsiniz.
        </p>
      </div>
    </main>
  );
}
