import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F7F5FF] px-6 py-12 text-[#1E1B4B] dark:bg-[#1A1730] dark:text-slate-100">
      <div className="w-full max-w-xl rounded-[32px] border border-[#EAE4F8] bg-white p-8 text-center shadow-[0_20px_50px_rgba(91,33,182,0.08)] dark:border-slate-700 dark:bg-[#24203D] dark:shadow-black/20">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-100 text-2xl text-violet-700 dark:bg-violet-950/40 dark:text-violet-300">
          404
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-600 dark:text-violet-300">Sayfa bulunamadı</p>
        <h1 className="mt-3 text-3xl font-black">Bu sayfa taşınmış veya mevcut değil.</h1>
        <p className="mt-4 text-sm text-[#4B5563] dark:text-slate-300">
          Gerekli bilgiyi bulmak için ana sayfaya veya analiz ekranına geri dönebilirsiniz.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link href="/" className="inline-flex min-h-11 items-center justify-center rounded-full bg-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-500 dark:shadow-violet-900/30">
            Ana sayfa
          </Link>
          <Link href="/analiz" className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#D9D3EE] bg-white px-6 py-3 text-sm font-semibold text-[#1E1B4B] transition hover:bg-violet-50 dark:border-slate-700 dark:bg-[#24203D] dark:text-slate-100 dark:hover:bg-slate-800">
            Analiz sayfası
          </Link>
        </div>
      </div>
    </main>
  );
}
