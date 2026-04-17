import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import { clearAuthToken, getAuthToken } from "../utils/authToken";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { Card, CardBody, CardHeader, CardSubtitle, CardTitle } from "../components/ui/Card";
import Spinner from "../components/ui/Spinner";
import { useToast } from "../components/feedback/ToastProvider.jsx";
import PasswordInput from "../components/ui/PasswordInput";

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

export default function Profile() {
  const navigate = useNavigate();
  const toast = useToast();
  const token = getAuthToken();
  const email = useMemo(() => decodeJwtEmail(token), [token]);

  // Password Change State
  const [passForm, setPassForm] = useState({ currentPassword: "", newPassword: "" });
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    try {
      await API.post("/auth/logout");
    } catch {
      // ignore
    } finally {
      clearAuthToken();
      navigate("/", { replace: true });
    }
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
        message: "Password updated successfully!" 
      });
      setPassForm({ currentPassword: "", newPassword: "" });
    } catch (err) {
      toast.push({ 
        tone: "error", 
        title: "Update Failed", 
        message: err?.response?.data?.message || "Could not change password." 
      });
    } finally {
      setLoading(false);
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
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Signed in as
              </div>
              <div className="mt-1 text-sm font-extrabold text-slate-900">
                {email || "—"}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                (decoded from JWT token)
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
        </CardBody>
      </Card>
    </div>
  );
}