import { useMemo, useState } from "react";
import API from "../services/api";
import { Link, useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { Card, CardBody, CardHeader, CardSubtitle, CardTitle } from "../components/ui/Card";
import Spinner from "../components/ui/Spinner";
import { setAuthToken } from "../utils/authToken";
import PasswordInput from "../components/ui/PasswordInput";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const passwordError = useMemo(() => {
    if (!confirmPassword) return "";
    if (password !== confirmPassword) return "Passwords do not match.";
    return "";
  }, [password, confirmPassword]);

  const handleSignup = async () => {
    if (passwordError) return;
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
                Signup takes under a minute. You’ll get the full dashboard with
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
                    Add income & expenses quickly.
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

                  {error ? (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                      {error}
                    </div>
                  ) : null}

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loading || Boolean(passwordError)}
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
  );
}

