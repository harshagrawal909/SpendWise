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
    <div className="min-h-screen bg-[#FFFBEB] text-[#1E293B] flex flex-col justify-between relative overflow-hidden font-sans">
      {/* Subtle organic background lights */}
      <div className="absolute top-1/4 -left-32 -z-10 h-96 w-96 rounded-full bg-indigo-300/10 blur-3xl" />
      <div className="absolute bottom-1/4 -right-32 -z-10 h-96 w-96 rounded-full bg-amber-400/10 blur-3xl" />

      {/* Top Navbar */}
      <header className="border-b border-[#FEF3C7] bg-[#FFFBEB]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="SpendWise Logo" className="h-9 w-9 object-contain" />
            <span className="text-2xl font-black tracking-tight text-[#1E1B4B]">SpendWise</span>
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
        <div className="mx-auto w-full max-w-7xl px-6 py-12 lg:py-16 grid gap-12 lg:grid-cols-12 items-center">
          
          {/* Right Column: Authentication Card - FIRST on mobile, LAST on desktop */}
          <div className="lg:col-span-5 flex justify-center order-1 lg:order-2">
            <div className="w-full max-w-md bg-[#FFFDF4] border border-[#FEF3C7] rounded-3xl p-8 shadow-xl shadow-slate-300/20 relative">
              <div className="absolute -top-3 -right-3 px-3 py-1 bg-[#1E1B4B] rounded-full text-[10px] font-extrabold uppercase tracking-wider text-white shadow-sm">
                Google Auth Only
              </div>
              <h2 className="text-2xl font-black text-[#1E1B4B]">Welcome Back</h2>
              <p className="text-slate-500 text-xs mt-1 mb-6">Experience the full power of SpendWise. Authenticate using Google single-sign-on.</p>

              {error && (
                <div className="mb-4 rounded-xl border border-rose-100 bg-rose-50 p-3.5 text-xs font-semibold text-rose-600">
                  {error}
                </div>
              )}

              {googleClientId ? (
                <div
                  ref={googleButtonRef}
                  className={googleLoading ? "pointer-events-none opacity-70 w-full flex justify-center py-2 bg-white rounded-2xl border border-slate-200" : "w-full flex justify-center py-2 bg-white rounded-2xl border border-slate-200 hover:border-slate-300 transition"}
                />
              ) : (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-800 leading-normal">
                  Configure VITE_GOOGLE_CLIENT_ID environment variable to enable Google authentication.
                </div>
              )}
            </div>
          </div>

          {/* Left Column: Premium Showcases - LAST on mobile, FIRST on desktop */}
          <div className="lg:col-span-7 space-y-8 order-2 lg:order-1">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3.5 py-1.5 text-xs font-bold text-indigo-700">
              <span className="h-2 w-2 rounded-full bg-indigo-500 animate-ping" />
              Version 1.6.0 Upgrade Complete
            </div>
            
            <h1 className="text-4xl sm:text-5xl font-black leading-tight text-[#1E1B4B] tracking-tight">
              Track expenses, see insights, and stay in control.
            </h1>
            
            <p className="text-slate-600 text-base sm:text-lg leading-relaxed max-w-2xl">
              SpendWise is a premium expense &amp; income ledger built to manage global capital seamlessly. Write transactions in any currency, visualize trends, and export spreadsheets.
            </p>

            {/* Feature list */}
            <div>
              <h2 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-4">Core Ecosystem Features</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                
                {/* Feature 1: Multi-Currency */}
                <div className="rounded-2xl border border-[#FEF3C7] bg-[#FFFDF4] p-5 shadow-xs hover:shadow-md transition duration-300">
                  <div className="text-2xl mb-2">🌍</div>
                  <h3 className="font-extrabold text-[#1E1B4B] text-sm">160+ World Currencies</h3>
                  <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
                    Track transactions in JPY, USD, EUR, or INR. Auto-converts to your display currency using cached real-time API exchange rates.
                  </p>
                </div>

                {/* Feature 2: Reddish Analytics */}
                <div className="rounded-2xl border border-[#FEF3C7] bg-[#FFFDF4] p-5 shadow-xs hover:shadow-md transition duration-300">
                  <div className="text-2xl mb-2">📈</div>
                  <h3 className="font-extrabold text-[#1E1B4B] text-sm">Sleek Reddish Analytics</h3>
                  <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
                    Vibrant chart summaries map out category weights, balances, and monthly cash flow distributions.
                  </p>
                </div>

                {/* Feature 3: Excel SheetJS */}
                <div className="rounded-2xl border border-[#FEF3C7] bg-[#FFFDF4] p-5 shadow-xs hover:shadow-md transition duration-300">
                  <div className="text-2xl mb-2">📊</div>
                  <h3 className="font-extrabold text-[#1E1B4B] text-sm">Genuine Excel Exports</h3>
                  <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
                    Export your date-filtered transaction ledger as a fully-formatted Excel workbook (`.xlsx`) using custom column scaling.
                  </p>
                </div>

                {/* Feature 4: Direct Mobile Downloads */}
                <div className="rounded-2xl border border-[#FEF3C7] bg-[#FFFDF4] p-5 shadow-xs hover:shadow-md transition duration-300">
                  <div className="text-2xl mb-2">📥</div>
                  <h3 className="font-extrabold text-[#1E1B4B] text-sm">Direct Device Downloads</h3>
                  <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
                    Android client downloads files directly to your chosen folder (e.g. `Downloads`) via SAF, skipping sharing chooser panels.
                  </p>
                </div>

                {/* Feature 5: Feedback loops */}
                <div className="rounded-2xl border border-[#FEF3C7] bg-[#FFFDF4] p-5 shadow-xs hover:shadow-md transition duration-300">
                  <div className="text-2xl mb-2">💬</div>
                  <h3 className="font-extrabold text-[#1E1B4B] text-sm">Admin Chat Resolutions</h3>
                  <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
                    Submit bugs or feature ideas from profile settings. Admins reply inline, alerting you via email notifications and push messages.
                  </p>
                </div>

                {/* Feature 6: Offline & Sync */}
                <div className="rounded-2xl border border-[#FEF3C7] bg-[#FFFDF4] p-5 shadow-xs hover:shadow-md transition duration-300">
                  <div className="text-2xl mb-2">⚡</div>
                  <h3 className="font-extrabold text-[#1E1B4B] text-sm">Offline-First &amp; Cloud Sync</h3>
                  <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
                    Logs expenses offline instantly and auto-synchronizes securely with your primary cloud account when back online.
                  </p>
                </div>

              </div>
            </div>

            {/* Upcoming Features */}
            <div className="mt-8 border-t border-[#FEF3C7] pt-6">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Coming Soon Features &amp; Insights</span>
              <div className="grid gap-4 sm:grid-cols-3 mt-3">
                
                {/* Coming Soon 1: Multiple Transaction Accounts */}
                <div className="rounded-2xl border border-[#FEF3C7] bg-[#FFFDF4] p-4 shadow-2xs hover:shadow-sm transition duration-300">
                  <div className="text-lg mb-1">💳</div>
                  <h4 className="font-extrabold text-[#1E1B4B] text-xs">Multiple Accounts</h4>
                  <p className="mt-1 text-[11px] text-slate-500 leading-normal">
                    Isolate your Personal spending from Business or Savings accounts. Keep separate balances and books under one profile.
                  </p>
                </div>
                
                {/* Coming Soon 2: AI Budgeting Helper */}
                <div className="rounded-2xl border border-[#FEF3C7] bg-[#FFFDF4] p-4 shadow-2xs hover:shadow-sm transition duration-300">
                  <div className="text-lg mb-1">🤖</div>
                  <h4 className="font-extrabold text-[#1E1B4B] text-xs">AI Budget Helper</h4>
                  <p className="mt-1 text-[11px] text-slate-500 leading-normal">
                    Get custom alerts, anomalies alerts, and spend thresholds computed from historical habits to reach savings targets.
                  </p>
                </div>

                {/* Coming Soon 3: Receipt Scanner & OCR */}
                <div className="rounded-2xl border border-[#FEF3C7] bg-[#FFFDF4] p-4 shadow-2xs hover:shadow-sm transition duration-300">
                  <div className="text-lg mb-1">📸</div>
                  <h4 className="font-extrabold text-[#1E1B4B] text-xs">Receipt Scanner &amp; OCR</h4>
                  <p className="mt-1 text-[11px] text-slate-500 leading-normal">
                    Auto-extract transaction amounts, dates, and merchant info simply by snapping or uploading receipt photos.
                  </p>
                </div>

              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#FEF3C7] py-6 text-center text-xs text-slate-500 bg-[#FDF8E2]">
        <p>© {new Date().getFullYear()} SpendWise. Track smarter, spend wiser.</p>
      </footer>
    </div>
  );
}
