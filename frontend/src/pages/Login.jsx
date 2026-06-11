import { useCallback, useEffect, useRef, useState } from "react";
import API from "../services/api";
import { Link, useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { Card, CardBody, CardHeader, CardSubtitle, CardTitle } from "../components/ui/Card";
import Spinner from "../components/ui/Spinner";
import { setAuthToken, getAuthToken } from "../utils/authToken";
import PasswordInput from "../components/ui/PasswordInput";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
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
      if (!redirectUri.startsWith("mobile://") && !redirectUri.startsWith("exp://") && !redirectUri.startsWith("exps://")) {
        setError("Invalid mobile redirect URL.");
        return;
      }

      const delimiter = redirectUri.includes("?") ? "&" : "?";
      window.location.href = `${redirectUri}${delimiter}token=${encodeURIComponent(token)}`;
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


  const handleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await API.post("/auth/login", { email, password });
      handleAuthSuccess(res.data.token);
    } catch (e) {
      setError(
        e?.response?.data?.message ||
          "Login failed. Please check your credentials and try again."
      );
    } finally {
      setLoading(false);
    }
  };

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
    <div className="min-h-screen">
      <div className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-linear-to-br from-indigo-50 via-slate-50 to-emerald-50" />
        <div className="absolute -left-24 -top-24 -z-10 h-72 w-72 rounded-full bg-indigo-200/40 blur-3xl" />
        <div className="absolute -right-28 top-20 -z-10 h-72 w-72 rounded-full bg-emerald-200/40 blur-3xl" />

        <div className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-10">
          <div className="grid w-full items-center gap-10 md:grid-cols-2">
            <div className="max-w-xl">
              <div className="inline-flex items-center rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
                SpendWise
              </div>
              <h1 className="mt-4 text-3xl font-extrabold leading-tight text-slate-900 md:text-4xl">
                Track expenses, see insights, and stay in control.
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 md:text-base">
                A clean dashboard for income/expense balance, category
                distribution, and monthly trends.
              </p>

              {/* Mobile App Download Card */}
              <div className="mt-6 flex flex-col sm:flex-row items-center gap-4 rounded-3xl border border-indigo-100 bg-linear-to-br from-indigo-50/50 to-emerald-50/50 p-6 shadow-xs backdrop-blur-xs">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <h3 className="font-extrabold text-slate-900 text-sm">Download SpendWise Android App</h3>
                  <p className="mt-1 text-xs text-slate-600">Track your finances offline and sync when online!</p>
                </div>
                <a
                  href="/download/spendwise-latest.apk"
                  className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-xs font-extrabold text-white shadow-xs transition hover:bg-slate-800 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>Download APK</span>
                </a>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-3 text-sm text-slate-700">
                <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 shadow-sm">
                  <div className="font-bold text-slate-900">Faster entry</div>
                  <div className="mt-1 text-slate-600">
                    Add expenses in seconds.
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 shadow-sm">
                  <div className="font-bold text-slate-900">Better clarity</div>
                  <div className="mt-1 text-slate-600">
                    Trends and distribution.
                  </div>
                </div>
              </div>
            </div>

            <Card className="mx-auto w-full max-w-md">
              <CardHeader>
                <CardTitle>Welcome back</CardTitle>
                <CardSubtitle>Sign in to continue to your dashboard.</CardSubtitle>
              </CardHeader>
              <CardBody>
                <form
                  className="space-y-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleLogin();
                  }}
                >
                  <Input
                    label="Email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    inputMode="email"
                    required
                  />

                  <PasswordInput
                    label="Password"
                    placeholder="Your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />

                  {error ? (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                      {error}
                    </div>
                  ) : null}

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Spinner className="h-4 w-4 border-t-white" />
                        Signing in…
                      </>
                    ) : (
                      "Sign in"
                    )}
                  </Button>
                </form>

                <div className="my-4 flex items-center gap-3">
                  <div className="h-px flex-1 bg-slate-200" />
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Or
                  </span>
                  <div className="h-px flex-1 bg-slate-200" />
                </div>

                {googleClientId ? (
                  <div
                    ref={googleButtonRef}
                    className={googleLoading ? "pointer-events-none opacity-70" : ""}
                  />
                ) : (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                    Add VITE_GOOGLE_CLIENT_ID to enable Google sign-in.
                  </div>
                )}

                <div className="mt-4 text-sm text-slate-600">
                  Don&apos;t have an account?{" "}
                  <Link
                    to="/signup"
                    className="font-semibold text-indigo-700 hover:text-indigo-600"
                  >
                    Create one
                  </Link>
                  .
                </div>

                <div className="mt-4 text-xs text-slate-500">
                  Tip: if you’re running the backend locally, make sure it’s on{" "}
                  <span className="font-semibold">:8081</span>.
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
