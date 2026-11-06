import Link from "next/link";

const GITHUB_URL = "https://github.com/asynrphix/kariyer-asistani";
const LINKEDIN_URL = "";
const MIT_URL = "https://opensource.org/licenses/MIT";

export function SiteFooter() {
  const year = 2026;

  return (
    <footer className="border-t border-[#EAE4F8] bg-white/80 dark:border-slate-700 dark:bg-[#201C32]/80">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-6 text-sm text-[#4B5563] sm:flex-row dark:text-slate-300">
        <div className="flex flex-col items-center gap-2 text-center sm:flex-row sm:items-center sm:text-left">
          <p>Ayşenur Aslan tarafından geliştirildi</p>
          <div className="flex items-center gap-2">
            <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="font-semibold text-violet-700 transition hover:text-violet-600 dark:text-violet-300 dark:hover:text-violet-200">
              GitHub
            </a>
            {LINKEDIN_URL ? (
              <>
                <span aria-hidden="true">•</span>
                <a href={LINKEDIN_URL} target="_blank" rel="noreferrer" className="font-semibold text-violet-700 transition hover:text-violet-600 dark:text-violet-300 dark:hover:text-violet-200">
                  LinkedIn
                </a>
              </>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col items-center gap-2 text-center sm:flex-row sm:items-center sm:gap-3 sm:text-right">
          <Link href="/gizlilik" className="font-semibold text-violet-700 transition hover:text-violet-600 dark:text-violet-300 dark:hover:text-violet-200">
            Gizlilik
          </Link>
          <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="font-semibold text-violet-700 transition hover:text-violet-600 dark:text-violet-300 dark:hover:text-violet-200">
            Kaynak kod
          </a>
          <a href={MIT_URL} target="_blank" rel="noreferrer" className="font-semibold text-violet-700 transition hover:text-violet-600 dark:text-violet-300 dark:hover:text-violet-200">
            MIT lisansı
          </a>
          <span aria-label={`Telif hakkı ${year}`} className="text-xs tracking-wide">
            © {year}
          </span>
        </div>
      </div>
    </footer>
  );
}
