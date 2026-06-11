/**
 * DownloadAppBanner — appears at the bottom of every app page in the sidebar/footer
 * and as a section on the login page.
 *
 * APK_DOWNLOAD_URL: update this when you host the release APK
 */

const APK_DOWNLOAD_URL = "/SpendWise.apk"; // host APK in /public or update to external URL

/** Compact pill badge — use in navbars / sidebars */
export function DownloadAppBadge({ className = "" }) {
  return (
    <a
      href={APK_DOWNLOAD_URL}
      download
      className={`inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-white shadow-md transition hover:bg-slate-800 active:scale-95 ${className}`}
    >
      <PlayIcon />
      <div className="text-left leading-none">
        <div className="text-[9px] font-medium text-slate-400 uppercase tracking-wider">Download for</div>
        <div className="text-sm font-bold">Android</div>
      </div>
    </a>
  );
}

/** Full card — use in footers and login page */
export function DownloadAppCard() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-5 text-white shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">📱</span>
            <span className="text-base font-extrabold">SpendWise for Android</span>
          </div>
          <p className="text-slate-300 text-xs leading-relaxed mb-3">
            Track expenses on the go · Works offline · Syncs automatically
          </p>
          <a
            href={APK_DOWNLOAD_URL}
            download
            className="inline-flex items-center gap-2.5 rounded-xl bg-white px-4 py-2.5 text-slate-900 shadow-md transition hover:bg-slate-100 active:scale-95"
          >
            <PlayIcon dark />
            <div className="text-left leading-none">
              <div className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider">Download APK</div>
              <div className="text-sm font-bold">Get the App</div>
            </div>
          </a>
        </div>
        <PhoneIllustration />
      </div>
    </div>
  );
}

/** Horizontal banner — use in login page bottom */
export function DownloadAppBanner() {
  return (
    <div className="flex flex-col sm:flex-row items-center gap-4 rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-slate-50 px-5 py-4 shadow-sm">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white shadow">
          <svg viewBox="0 0 24 24" className="h-5 w-5 fill-white">
            <path d="M3 18.5v-13A1.5 1.5 0 0 1 5.2 4.1l11 6.5a1.5 1.5 0 0 1 0 2.6l-11 6.5A1.5 1.5 0 0 1 3 18.5z"/>
          </svg>
        </div>
        <div className="min-w-0">
          <div className="text-sm font-bold text-slate-900">Take SpendWise everywhere</div>
          <div className="text-xs text-slate-500 truncate">Offline-first · Auto-sync · Free forever</div>
        </div>
      </div>
      <a
        href={APK_DOWNLOAD_URL}
        download
        className="flex-shrink-0 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-white text-sm font-semibold shadow-md transition hover:bg-slate-800 active:scale-95 whitespace-nowrap"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-white">
          <path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm-1 14.59V7.41l5.29 5.3a1 1 0 0 1 0 1.41L11 16.59z" />
        </svg>
        Download APK
      </a>
    </div>
  );
}

function PlayIcon({ dark = false }) {
  return (
    <svg viewBox="0 0 24 24" className={`h-5 w-5 flex-shrink-0 ${dark ? "fill-slate-900" : "fill-white"}`}>
      <path d="M3 18.5v-13A1.5 1.5 0 0 1 5.2 4.1l11 6.5a1.5 1.5 0 0 1 0 2.6l-11 6.5A1.5 1.5 0 0 1 3 18.5z"/>
    </svg>
  );
}

function PhoneIllustration() {
  return (
    <div className="flex-shrink-0 relative hidden sm:block">
      <div className="w-14 h-24 rounded-xl border-2 border-slate-600 bg-slate-800 flex flex-col overflow-hidden shadow-xl">
        <div className="flex justify-center pt-1">
          <div className="w-6 h-1 rounded-full bg-slate-600" />
        </div>
        <div className="flex-1 m-1 rounded-lg bg-indigo-900 flex flex-col gap-1 p-1">
          <div className="h-2 bg-indigo-400 rounded-sm w-full opacity-80" />
          <div className="h-1 bg-slate-500 rounded-sm w-3/4" />
          <div className="h-1 bg-slate-500 rounded-sm w-1/2" />
          <div className="mt-1 h-6 bg-indigo-600 rounded-sm w-full opacity-60" />
        </div>
        <div className="flex justify-center pb-1">
          <div className="w-4 h-4 rounded-full border border-slate-600" />
        </div>
      </div>
    </div>
  );
}
