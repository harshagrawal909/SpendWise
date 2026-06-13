import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import { clearAuthToken, getAuthToken } from "../utils/authToken";
import Button from "../components/ui/Button";
import { Card, CardBody, CardHeader, CardSubtitle, CardTitle } from "../components/ui/Card";
import Spinner from "../components/ui/Spinner";
import { useToast } from "../components/feedback/ToastProvider.jsx";
import PasswordInput from "../components/ui/PasswordInput";
import Badge from "../components/ui/Badge";
import { SUPPORTED_CURRENCIES } from "../utils/currency";

function decodeJwtEmail(token) {
  try {
    const parts = String(token).split(".");
    if (parts.length < 2) return "";
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
    return payload?.sub || payload?.email || "";
  } catch {
    return "";
  }
}

function formatDate(value) {
  if (!value) return "Not added";

  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export default function Profile() {
  const navigate = useNavigate();
  const toast = useToast();
  const token = getAuthToken();
  const email = useMemo(() => decodeJwtEmail(token), [token]);
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // Password Change State
  const [passForm, setPassForm] = useState({ currentPassword: "", newPassword: "" });
  const [loading, setLoading] = useState(false);
  const [currencyUpdating, setCurrencyUpdating] = useState(false);

  // Delete Account State
  const [deleteStep, setDeleteStep] = useState(0); // 0=idle, 1=confirm
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleCurrencyChange = async (newCurrency) => {
    setCurrencyUpdating(true);
    try {
      const res = await API.put("/users/profile", { currency: newCurrency });
      setProfile(res.data.user);
      toast.push({
        tone: "success",
        title: "Currency Updated",
        message: `Your default display currency is now ${newCurrency}. Past transaction totals have been converted.`,
      });
    } catch (err) {
      toast.push({
        tone: "error",
        title: "Update Failed",
        message: err?.response?.data?.message || "Could not update currency.",
      });
    } finally {
      setCurrencyUpdating(false);
    }
  };

  const displayEmail = profile?.email || email;
  const isGoogleUser = profile?.provider === "google";
  const initial = (profile?.name || displayEmail || "U").trim().charAt(0).toUpperCase();

  useEffect(() => {
    let mounted = true;

    API.get("/users/me")
      .then((res) => {
        if (mounted) setProfile(res.data);
      })
      .catch(() => {
        if (mounted) setProfile(null);
      })
      .finally(() => {
        if (mounted) setProfileLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const handleLogout = async () => {
    clearAuthToken();
    navigate("/", { replace: true });
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!passForm.currentPassword || !passForm.newPassword) return;

    setLoading(true);
    try {
      await API.put("/users/change-password", passForm);
      toast.push({
        tone: "success",
        title: "Success",
        message: "Password updated successfully!",
      });
      setPassForm({ currentPassword: "", newPassword: "" });
    } catch (err) {
      toast.push({
        tone: "error",
        title: "Update Failed",
        message: err?.response?.data?.message || "Could not change password.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    try {
      await API.delete("/users/me");
      clearAuthToken();
      navigate("/", { replace: true });
    } catch (err) {
      toast.push({
        tone: "error",
        title: "Deletion Failed",
        message: err?.response?.data?.message || "Could not delete account. Please try again.",
      });
      setDeleteStep(0);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardSubtitle>Account details & session</CardSubtitle>
        </CardHeader>
        <CardBody>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Signed in as
              </div>
              <div className="mt-1 text-sm font-extrabold text-slate-900">
                {displayEmail || "-"}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Display Currency
              </div>
              <div className="mt-2">
                <select
                  value={profile?.currency || "INR"}
                  onChange={(e) => handleCurrencyChange(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-800 focus:border-indigo-500 focus:outline-none"
                  disabled={currencyUpdating}
                >
                  {SUPPORTED_CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Actions
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button onClick={handleLogout}>Logout</Button>
              </div>
            </div>
          </div>

          {profileLoading ? (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-[rgb(var(--surface))] p-4">
              <Spinner className="h-5 w-5" />
            </div>
          ) : isGoogleUser ? (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-[rgb(var(--surface))] p-4">
              <div className="flex flex-wrap items-center gap-4">
                {profile?.photoUrl ? (
                  <img
                    src={profile.photoUrl}
                    alt=""
                    className="h-16 w-16 rounded-full border border-slate-200 object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-xl font-extrabold text-indigo-700">
                    {initial}
                  </div>
                )}

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-lg font-extrabold text-slate-900">
                      {profile?.name || "Google user"}
                    </div>
                    {profile?.emailVerified ? <Badge variant="success">Verified</Badge> : null}
                  </div>
                  <div className="mt-1 text-sm font-semibold text-slate-600">
                    Signed in with Google
                  </div>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    Email
                  </div>
                  <div className="mt-1 text-sm font-bold text-slate-900">
                    {displayEmail || "-"}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    Date of birth
                  </div>
                  <div className="mt-1 text-sm font-bold text-slate-900">
                    {formatDate(profile?.dateOfBirth)}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    Account created
                  </div>
                  <div className="mt-1 text-sm font-bold text-slate-900">
                    {formatDate(profile?.createdAt)}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    Login method
                  </div>
                  <div className="mt-1 text-sm font-bold text-slate-900">
                    Google
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-[rgb(var(--surface))] p-4">
              <div className="text-sm font-bold text-slate-900">
                Security
              </div>
              <form onSubmit={handleChangePassword} className="mt-4 grid max-w-md gap-4">
                <PasswordInput
                  label="Current Password"
                  required
                  value={passForm.currentPassword}
                  onChange={(e) => setPassForm({ ...passForm, currentPassword: e.target.value })}
                />
                <PasswordInput
                  label="New Password"
                  required
                  value={passForm.newPassword}
                  onChange={(e) => setPassForm({ ...passForm, newPassword: e.target.value })}
                />
                <Button type="submit" disabled={loading}>
                  {loading ? <Spinner className="h-4 w-4 border-t-white" /> : "Update Password"}
                </Button>
              </form>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Danger Zone */}
      <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
        <div className="text-sm font-bold text-red-800 mb-1">Danger Zone</div>
        <p className="text-xs text-red-600 mb-4">
          Permanently delete your account and all expense data. This action cannot be undone.
        </p>
        {deleteStep === 0 ? (
          <Button
            variant="outline"
            className="border-red-300 text-red-700 hover:bg-red-100"
            onClick={() => setDeleteStep(1)}
          >
            Delete Account
          </Button>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-semibold text-red-800">Are you sure? This is permanent.</span>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleDeleteAccount}
              disabled={deleteLoading}
            >
              {deleteLoading ? <Spinner className="h-4 w-4 border-t-white" /> : "Yes, delete everything"}
            </Button>
            <Button variant="outline" onClick={() => setDeleteStep(0)} disabled={deleteLoading}>
              Cancel
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
