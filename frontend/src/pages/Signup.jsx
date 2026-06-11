import { useMemo, useState } from "react";
import API from "../services/api";
import { Link, useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { Card, CardBody, CardHeader, CardSubtitle, CardTitle } from "../components/ui/Card";
import Spinner from "../components/ui/Spinner";
import { setAuthToken } from "../utils/authToken";
import PasswordInput from "../components/ui/PasswordInput";

// ── Terms mini-modal ──────────────────────────────────────────────────────────
function TermsModal({ onClose }) {
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed inset-x-0 bottom-0 z-50 sm:inset-0 sm:flex sm:items-center sm:justify-center sm:p-6">
        <div className="relative w-full max-h-[85vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl sm:max-w-lg animate-[slide-up_0.25s_ease-out]">

          {/* Header */}
          <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 rounded-t-3xl sm:rounded-t-3xl">
            <div>
              <div className="text-base font-extrabold text-slate-900">Terms of Service</div>
              <div className="text-xs text-slate-500">Summary of key points</div>
            </div>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-800"
              aria-label="Close"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Key terms list */}
          <div className="px-6 py-5 space-y-4">
            {[
              {
                icon: "👤",
                title: "Eligibility",
                text: "You must be at least 13 years old to use SpendWise.",
              },
              {
                icon: "📊",
                title: "Personal use only",
                text: "SpendWise is a personal finance tracker. It is not a financial advisory service. We are not responsible for any financial decisions you make.",
              },
              {
                icon: "🔒",
                title: "Your data",
                text: "We store your email and expense data securely. We do not sell your data to anyone. You can delete your account and all data at any time.",
              },
              {
                icon: "✅",
                title: "Your responsibility",
                text: "You are responsible for the accuracy of data you enter and for keeping your account credentials safe.",
              },
              {
                icon: "⚙️",
                title: "Service changes",
                text: "We may update the app or these terms at any time. Continued use after changes means you accept the new terms.",
              },
              {
                icon: "🚫",
                title: "Acceptable use",
                text: "You agree not to misuse the service, attempt to hack it, or use it for any illegal purpose.",
              },
            ].map((item) => (
              <div key={item.title} className="flex gap-3">
                <span className="text-xl flex-shrink-0 mt-0.5">{item.icon}</span>
                <div>
                  <div className="text-sm font-bold text-slate-900">{item.title}</div>
                  <div className="text-xs text-slate-500 mt-0.5 leading-relaxed">{item.text}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 border-t border-slate-200 bg-white px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <Link
              to="/terms"
              target="_blank"
              className="text-sm font-semibold text-indigo-600 hover:text-indigo-500 flex items-center gap-1"
            >
              Read full Terms of Service
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <button
              onClick={onClose}
              className="w-full sm:w-auto rounded-xl bg-slate-900 px-5 py-2 text-sm font-bold text-white transition hover:bg-slate-800"
            >
              Got it
            </button>
          </div>
        </div>
      </div>

      {/* Slide-up animation */}
      <style>{`
        @keyframes slide-up {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>
    </>
  );
}

// ── Main Signup page ──────────────────────────────────────────────────────────
export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const navigate = useNavigate();

  const passwordError = useMemo(() => {
    if (!confirmPassword) return "";
    if (password !== confirmPassword) return "Passwords do not match.";
    return "";
  }, [password, confirmPassword]);

  const handleSignup = async () => {
    if (passwordError || !agreed) return;
    setError("");
    setLoading(true);
    try {
      await API.post("/auth/register", { name, email, password });
      const loginRes = await API.post("/auth/login", { email, password });
      setAuthToken(loginRes.data.token);
      navigate("/dashboard");
    } catch (e) {
      setError(
        e?.response?.data?.message ||
          "Signup failed. Try a different email or try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {showTerms && <TermsModal onClose={() => setShowTerms(false)} />}

      <div className="min-h-screen">
        <div className="relative isolate overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-linear-to-br from-amber-50 via-slate-50 to-indigo-50" />
          <div className="absolute -left-24 -top-24 -z-10 h-72 w-72 rounded-full bg-amber-200/40 blur-3xl" />
          <div className="absolute -right-28 top-20 -z-10 h-72 w-72 rounded-full bg-indigo-200/40 blur-3xl" />

          <div className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-10">
            <div className="grid w-full items-center gap-10 md:grid-cols-2">
              <div className="max-w-xl">
                <div className="inline-flex items-center rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
                  SpendWise
                </div>
                <h1 className="mt-4 text-3xl font-extrabold leading-tight text-slate-900 md:text-4xl">
                  Create your account and start tracking today.
                </h1>
                <p className="mt-3 text-sm leading-relaxed text-slate-600 md:text-base">
                  Signup takes under a minute. You'll get the full dashboard with
                  summaries, charts, and transaction history.
                </p>
                <div className="mt-6 grid grid-cols-2 gap-3 text-sm text-slate-700">
                  <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 shadow-sm">
                    <div className="font-bold text-slate-900">Smart visuals</div>
                    <div className="mt-1 text-slate-600">
                      Understand where money goes.
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 shadow-sm">
                    <div className="font-bold text-slate-900">Simple workflow</div>
                    <div className="mt-1 text-slate-600">
                      Add income &amp; expenses quickly.
                    </div>
                  </div>
                </div>
              </div>

              <Card className="mx-auto w-full max-w-md">
                <CardHeader>
                  <CardTitle>Create account</CardTitle>
                  <CardSubtitle>Use your email and a password to sign up.</CardSubtitle>
                </CardHeader>
                <CardBody>
                  <form
                    className="space-y-4"
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSignup();
                    }}
                  >
                    <Input
                      label="Name"
                      placeholder="Your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      autoComplete="name"
                      required
                    />

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
                      placeholder="Create a password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="new-password"
                      required
                    />

                    <PasswordInput
                      label="Confirm password"
                      placeholder="Repeat your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      autoComplete="new-password"
                      required
                    />

                    {passwordError && (
                      <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                        {passwordError}
                      </div>
                    )}

                    {error && (
                      <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                        {error}
                      </div>
                    )}

                    {/* Terms agreement checkbox */}
                    <label className="flex items-start gap-3 cursor-pointer select-none group">
                      <div className="relative mt-0.5 flex-shrink-0">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={agreed}
                          onChange={(e) => setAgreed(e.target.checked)}
                        />
                        <div className="h-5 w-5 rounded-md border-2 border-slate-300 bg-white transition peer-checked:border-indigo-600 peer-checked:bg-indigo-600 group-hover:border-indigo-400" />
                        <svg
                          className="pointer-events-none absolute inset-0 m-auto h-3 w-3 text-white opacity-0 peer-checked:opacity-100 transition"
                          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-sm text-slate-600 leading-snug">
                        I agree to the{" "}
                        <button
                          type="button"
                          onClick={() => setShowTerms(true)}
                          className="font-semibold text-indigo-600 underline underline-offset-2 hover:text-indigo-500 transition"
                        >
                          Terms &amp; Conditions
                        </button>
                        {" "}and{" "}
                        <Link
                          to="/privacy"
                          target="_blank"
                          className="font-semibold text-indigo-600 underline underline-offset-2 hover:text-indigo-500 transition"
                        >
                          Privacy Policy
                        </Link>
                      </span>
                    </label>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={loading || Boolean(passwordError) || !agreed}
                    >
                      {loading ? (
                        <>
                          <Spinner className="h-4 w-4 border-t-white" />
                          Creating…
                        </>
                      ) : (
                        "Create account"
                      )}
                    </Button>
                  </form>

                  <div className="mt-4 text-sm text-slate-600">
                    Already have an account?{" "}
                    <Link
                      to="/"
                      className="font-semibold text-indigo-700 hover:text-indigo-600"
                    >
                      Sign in
                    </Link>
                    .
                  </div>
                </CardBody>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
