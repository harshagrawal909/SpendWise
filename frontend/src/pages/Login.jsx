import { useState } from "react";
import API from "../services/api";
import { Link, useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { Card, CardBody, CardHeader, CardSubtitle, CardTitle } from "../components/ui/Card";
import Spinner from "../components/ui/Spinner";
import { setAuthToken } from "../utils/authToken";
import PasswordInput from "../components/ui/PasswordInput";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await API.post("/auth/login", { email, password });
      setAuthToken(res.data.token);
      navigate("/dashboard");
    } catch (e) {
      setError(
        e?.response?.data?.message ||
          "Login failed. Please check your credentials and try again."
      );
    } finally {
      setLoading(false);
    }
  };

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