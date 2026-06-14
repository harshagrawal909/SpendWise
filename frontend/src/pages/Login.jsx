import { useCallback, useEffect, useRef, useState } from "react";
import API from "../services/api";
import { useNavigate } from "react-router-dom";
import { Card, CardBody, CardHeader, CardSubtitle, CardTitle } from "../components/ui/Card";
import { setAuthToken, getAuthToken } from "../utils/authToken";

export default function Login() {
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const googleButtonRef = useRef(null);
  const navigate = useNavigate();
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  // Get query params to support redirecting back to mobile app
  const queryParams = new URLSearchParams(window.location.search);
  const redirectUri = queryParams.get("redirect_uri");

  const handleAuthSuccess = useCallback((token) => {
    if (redirectUri) {
      // Redirect via /app-auth page (HTTPS App Link) — avoids Android intent chooser dialog
      window.location.href = `/app-auth?token=${encodeURIComponent(token)}`;
    } else {
      setAuthToken(token);
      navigate("/dashboard");
    }
  }, [redirectUri, navigate]);

  // Auto-redirect to app if already logged in and coming from mobile
  useEffect(() => {
    if (!redirectUri) return;
    const existingToken = getAuthToken();
    if (existingToken) {
      handleAuthSuccess(existingToken);
    }
  }, [redirectUri, handleAuthSuccess]);

  const handleGoogleCredential = useCallback(async (credential) => {
    setError("");
    setGoogleLoading(true);
    try {
      const res = await API.post("/auth/google", { idToken: credential });
      handleAuthSuccess(res.data.token);
    } catch (e) {
      setError(
        e?.response?.data?.message ||
          "Google sign-in failed. Please try again."
      );
    } finally {
      setGoogleLoading(false);
    }
  }, [handleAuthSuccess]);

  useEffect(() => {
    if (!googleClientId || !googleButtonRef.current) return;

    const renderGoogleButton = () => {
      if (!window.google?.accounts?.id || !googleButtonRef.current) return;

      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: (response) => {
          if (response.credential) {
            handleGoogleCredential(response.credential);
          }
        },
      });

      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: "outline",
        size: "large",
        width: googleButtonRef.current.offsetWidth || 360,
        text: "signin_with",
      });
    };

    if (window.google?.accounts?.id) {
      renderGoogleButton();
      return;
    }

    const existingScript = document.querySelector(
      'script[src="https://accounts.google.com/gsi/client"]'
    );
    if (existingScript) {
      existingScript.addEventListener("load", renderGoogleButton, { once: true });
      return () => existingScript.removeEventListener("load", renderGoogleButton);
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = renderGoogleButton;
    document.head.appendChild(script);
  }, [googleClientId, handleGoogleCredential]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-50/50 via-slate-50 to-slate-50" />
      <div className="absolute top-1/4 -left-32 -z-10 h-96 w-96 rounded-full bg-indigo-200/30 blur-3xl animate-pulse duration-[8000ms]" />
      <div className="absolute bottom-1/4 -right-32 -z-10 h-96 w-96 rounded-full bg-rose-200/20 blur-3xl animate-pulse duration-[6000ms]" />

      {/* Top Navbar */}
      <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="SpendWise Logo" className="h-8 w-8 object-contain" />
            <span className="text-xl font-black tracking-tight bg-gradient-to-r from-indigo-600 via-purple-600 to-rose-600 bg-clip-text text-transparent">SpendWise</span>
          </div>
          <div>
            <a
              href={`${import.meta.env.VITE_API_URL?.replace('/api', '') || ''}/api/download/apk`}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center gap-2 shadow-md shadow-slate-900/10"
            >
              <span>📥</span> Download APK
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex items-center">
        <div className="mx-auto w-full max-w-7xl px-6 py-12 lg:py-20 grid gap-12 lg:grid-cols-12 items-center">
          
          {/* Right Column: Authentication Card - FIRST on mobile, LAST on desktop */}
          <div className="lg:col-span-5 flex justify-center order-1 lg:order-2">
            <div className="w-full max-w-md bg-white border border-slate-200/80 rounded-3xl p-8 shadow-xl shadow-slate-200/50 relative">
              <div className="absolute -top-3 -right-3 px-3 py-1 bg-gradient-to-r from-rose-500 to-indigo-600 rounded-full text-[10px] font-extrabold uppercase tracking-wider text-white shadow-sm">
                Google Auth Only
              </div>
              <h2 className="text-2xl font-black text-slate-900">Welcome</h2>
              <p className="text-slate-500 text-xs mt-1 mb-6">Experience SpendWise. Authenticate using your secure Google account.</p>

              {error && (
                <div className="mb-4 rounded-xl border border-rose-100 bg-rose-50 p-3.5 text-xs font-semibold text-rose-600">
                  {error}
                </div>
              )}

              {googleClientId ? (
                <div
                  ref={googleButtonRef}
                  className={googleLoading ? "pointer-events-none opacity-70 w-full flex justify-center py-2 bg-slate-50 rounded-2xl border border-slate-200" : "w-full flex justify-center py-2 bg-slate-50 rounded-2xl border border-slate-200 hover:border-slate-300 transition"}
                />
              ) : (
                <div className="rounded-xl border border-amber-100 bg-amber-50 p-3.5 text-xs text-amber-800 leading-normal">
                  Configure VITE_GOOGLE_CLIENT_ID environment variable to enable Google authentication.
                </div>
              )}
            </div>
          </div>

          {/* Left Column: Premium Showcases - LAST on mobile, FIRST on desktop */}
          <div className="lg:col-span-7 space-y-8 order-2 lg:order-1">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3.5 py-1.5 text-xs font-bold text-indigo-700">
              <span className="h-2 w-2 rounded-full bg-indigo-500 animate-ping" />
              Version 1.6.0 Available
            </div>
            
            <h1 className="text-4xl sm:text-5xl font-black leading-tight text-slate-900 tracking-tight">
              Master your capital with <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-rose-600 bg-clip-text text-transparent">Limitless Power</span>.
            </h1>
            
            <p className="text-slate-600 text-base sm:text-lg leading-relaxed max-w-2xl">
              Track global currencies, analyze transaction distributions with hot-red analytics, export to native spreadsheets, and get direct resolution alerts from administrators.
            </p>

            {/* Showcase Grid */}
            <div className="grid gap-4 sm:grid-cols-2 mt-8">
              {/* Feature 1: Multi-Currency */}
              <div className="rounded-2xl border border-slate-200/80 bg-white/70 p-5 shadow-sm hover:border-indigo-500/30 hover:shadow-md transition duration-300">
                <div className="text-2xl mb-2">🌍</div>
                <h3 className="font-extrabold text-slate-900 text-sm">160+ Currencies Supported</h3>
                <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                  Track in JPY, USD, EUR, or INR and auto-convert to your home denomination with real-time API rates.
                </p>
              </div>

              {/* Feature 2: Reddish Analytics */}
              <div className="rounded-2xl border border-slate-200/80 bg-white/70 p-5 shadow-sm hover:border-rose-500/30 hover:shadow-md transition duration-300">
                <div className="text-2xl mb-2">📈</div>
                <h3 className="font-extrabold text-slate-900 text-sm">Vibrant Reddish Analytics</h3>
                <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                  Stunning visual charts highlight your key income vs. expense categories, showing where your cash flows.
                </p>
              </div>

              {/* Feature 3: Excel SheetJS */}
              <div className="rounded-2xl border border-slate-200/80 bg-white/70 p-5 shadow-sm hover:border-emerald-500/30 hover:shadow-md transition duration-300">
                <div className="text-2xl mb-2">📊</div>
                <h3 className="font-extrabold text-slate-900 text-sm">Genuine Excel Exports</h3>
                <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                  Skip plain CSV format. Download formatted `.xlsx` workbooks directly to analyze, filter, or share.
                </p>
              </div>

              {/* Feature 4: Admin Mentions */}
              <div className="rounded-2xl border border-slate-200/80 bg-white/70 p-5 shadow-sm hover:border-amber-500/30 hover:shadow-md transition duration-300">
                <div className="text-2xl mb-2">💬</div>
                <h3 className="font-extrabold text-slate-900 text-sm">Admin Resolution Alerts</h3>
                <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                  Ask questions or report bugs directly. Receive instant push notifications and emails when admins reply.
                </p>
              </div>
            </div>

            {/* Upcoming Features */}
            <div className="mt-6 border-t border-slate-200 pt-6">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Coming Soon</span>
              <div className="flex flex-wrap gap-3 mt-2">
                <span className="px-3 py-1 rounded-full bg-slate-100 text-[11px] font-semibold text-indigo-700 border border-indigo-200/50">🤖 AI Budgeting Bot</span>
                <span className="px-3 py-1 rounded-full bg-slate-100 text-[11px] font-semibold text-rose-700 border border-rose-200/50">📸 Smart Receipt Scanner</span>
                <span className="px-3 py-1 rounded-full bg-slate-100 text-[11px] font-semibold text-emerald-700 border border-emerald-200/50">🏦 Direct Bank Sync</span>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-500 bg-slate-100">
        <p>© {new Date().getFullYear()} SpendWise. Designed for financial excellence.</p>
      </footer>
    </div>
  );
}
