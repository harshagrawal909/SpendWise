import { useEffect, useState } from "react";
import API from "../services/api";
import { Card, CardBody, CardHeader, CardSubtitle, CardTitle } from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Spinner from "../components/ui/Spinner";
import Badge from "../components/ui/Badge";
import { useToast } from "../components/feedback/ToastProvider.jsx";
import { formatCurrency } from "../utils/currency.js";

const PRESET_COLORS = [
  { value: "#4F46E5", label: "Indigo" },
  { value: "#10B981", label: "Emerald" },
  { value: "#EF4444", label: "Rose" },
  { value: "#F59E0B", label: "Amber" },
  { value: "#3B82F6", label: "Blue" },
  { value: "#8B5CF6", label: "Violet" },
  { value: "#EC4899", label: "Pink" },
  { value: "#06B6D4", label: "Cyan" }
];

export default function AccountsPage() {
  const toast = useToast();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [userCurrency, setUserCurrency] = useState("INR");

  // Form State
  const [isEditing, setIsEditing] = useState(false); // false (add mode) or account object (edit mode)
  const [form, setForm] = useState({
    name: "",
    balance: "",
    color: "#4F46E5",
    isDefault: false
  });

  const fetchAccountsAndUser = async () => {
    setLoading(true);
    setError("");
    try {
      const [accountsRes, userRes] = await Promise.all([
        API.get("/accounts"),
        API.get("/users/me").catch(() => ({ data: { currency: "INR" } }))
      ]);
      setAccounts(accountsRes.data || []);
      setUserCurrency(userRes.data?.currency || "INR");
    } catch (e) {
      setError(e?.response?.data?.message || "Could not fetch accounts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccountsAndUser();
  }, []);

  const handleCreateOrUpdate = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.push({ tone: "error", title: "Validation error", message: "Account name is required." });
      return;
    }

    setActionLoading(true);
    try {
      if (isEditing) {
        // Update account
        const res = await API.put(`/accounts/${isEditing._id}`, {
          name: form.name,
          balance: Number(form.balance) || 0,
          color: form.color,
          isDefault: form.isDefault
        });
        toast.push({ tone: "success", title: "Account Updated", message: `Successfully updated ${res.data.name}` });
      } else {
        // Create account
        if (accounts.length >= 3) {
          toast.push({ tone: "error", title: "Limit reached", message: "You can have a maximum of 3 accounts." });
          return;
        }
        const res = await API.post("/accounts", {
          name: form.name,
          balance: Number(form.balance) || 0,
          color: form.color,
          isDefault: form.isDefault
        });
        toast.push({ tone: "success", title: "Account Created", message: `Successfully created ${res.data.name}` });
      }
      // Reset Form
      setForm({ name: "", balance: "", color: "#4F46E5", isDefault: false });
      setIsEditing(false);
      await fetchAccountsAndUser();
    } catch (err) {
      toast.push({
        tone: "error",
        title: "Action failed",
        message: err?.response?.data?.message || "Something went wrong."
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditClick = (account) => {
    setIsEditing(account);
    setForm({
      name: account.name,
      balance: account.balance || 0,
      color: account.color || "#4F46E5",
      isDefault: account.isDefault
    });
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setForm({ name: "", balance: "", color: "#4F46E5", isDefault: false });
  };

  const handleDelete = async (id, name) => {
    const ok = window.confirm(
      `Are you sure you want to delete "${name}"?\nAll transactions associated with this account will be automatically reassigned to your default account.`
    );
    if (!ok) return;

    setActionLoading(true);
    try {
      await API.delete(`/accounts/${id}`);
      toast.push({ tone: "success", title: "Account Deleted", message: "Successfully deleted account." });
      if (isEditing && isEditing._id === id) {
        handleCancelEdit();
      }
      await fetchAccountsAndUser();
    } catch (err) {
      toast.push({
        tone: "error",
        title: "Delete failed",
        message: err?.response?.data?.message || "Could not delete account."
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSetDefault = async (account) => {
    setActionLoading(true);
    try {
      await API.put(`/accounts/${account._id}`, { ...account, isDefault: true });
      toast.push({ tone: "success", title: "Default Account Set", message: `"${account.name}" is now your default account.` });
      await fetchAccountsAndUser();
    } catch (err) {
      toast.push({
        tone: "error",
        title: "Action failed",
        message: err?.response?.data?.message || "Could not update default status."
      });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {error ? (
        <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xl font-extrabold text-slate-900">Manage Accounts</div>
          <div className="mt-1 text-sm text-slate-600">Handle up to 3 transaction accounts/wallets.</div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Left column: List of accounts */}
        <div className="lg:col-span-2 space-y-4">
          {loading ? (
            <Card>
              <CardBody className="flex items-center justify-center py-10">
                <Spinner className="h-8 w-8 text-indigo-600" />
              </CardBody>
            </Card>
          ) : accounts.length === 0 ? (
            <Card>
              <CardBody className="text-center py-10">
                <div className="text-sm font-bold text-slate-950">No accounts set up</div>
                <div className="mt-1 text-sm text-slate-500">Creating your first account...</div>
              </CardBody>
            </Card>
          ) : (
            accounts.map((acc) => {
              return (
                <Card key={acc._id} className="relative overflow-hidden group transition hover:border-slate-300">
                  {/* Color stripe */}
                  <div className="absolute left-0 top-0 bottom-0 w-2.5" style={{ backgroundColor: acc.color }} />
                  <CardBody className="pl-6">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-lg font-extrabold text-slate-900">{acc.name}</h3>
                          {acc.isDefault ? (
                            <Badge variant="success">Default</Badge>
                          ) : (
                            <button
                              onClick={() => handleSetDefault(acc)}
                              disabled={actionLoading}
                              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition"
                            >
                              Make default
                            </button>
                          )}
                        </div>
                        <div className="mt-2 text-2xl font-black text-slate-900">
                          {formatCurrency(acc.balance || 0, userCurrency)}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          Initial/Current balance in {userCurrency}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditClick(acc)}
                          disabled={actionLoading}
                        >
                          Edit
                        </Button>
                        {!acc.isDefault && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:bg-red-50"
                            onClick={() => handleDelete(acc._id, acc.name)}
                            disabled={actionLoading}
                          >
                            Delete
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardBody>
                </Card>
              );
            })
          )}
        </div>

        {/* Right column: Create / Edit Form */}
        <Card className="lg:col-span-1 h-fit">
          <CardHeader>
            <CardTitle>{isEditing ? "Edit Account" : "Add Account"}</CardTitle>
            <CardSubtitle>
              {isEditing
                ? `Modify account settings for "${isEditing.name}"`
                : "Create a new wallet/transaction account (max 3)"}
            </CardSubtitle>
          </CardHeader>
          <CardBody>
            {accounts.length >= 3 && !isEditing ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                <span className="font-bold">Limit Reached:</span> You have reached the maximum limit of 3 transaction accounts. Please edit or delete an existing account to make changes.
              </div>
            ) : (
              <form onSubmit={handleCreateOrUpdate} className="space-y-4">
                <Input
                  label="Account Name"
                  placeholder="e.g. Cash, HDFC Bank, Credit Card"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
                
                <Input
                  label="Initial Balance"
                  placeholder="e.g. 5000"
                  type="number"
                  value={form.balance}
                  onChange={(e) => setForm({ ...form, balance: e.target.value })}
                />

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">
                    Account Color
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {PRESET_COLORS.map((c) => {
                      const isSelected = form.color === c.value;
                      return (
                        <button
                          key={c.value}
                          type="button"
                          className={`h-8 rounded-xl border transition-all ${
                            isSelected ? "border-slate-900 scale-110 shadow-sm" : "border-transparent opacity-80 hover:opacity-100"
                          }`}
                          style={{ backgroundColor: c.value }}
                          title={c.label}
                          onClick={() => setForm({ ...form, color: c.value })}
                        />
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center gap-2.5 pt-2">
                  <input
                    id="isDefault"
                    type="checkbox"
                    checked={form.isDefault}
                    onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
                    disabled={isEditing && isEditing.isDefault} // cannot untoggle default from checkbox directly
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="isDefault" className="text-sm font-semibold text-slate-700 cursor-pointer">
                    Set as default account
                  </label>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    type="submit"
                    disabled={actionLoading}
                    className="flex-1 justify-center"
                  >
                    {actionLoading ? <Spinner className="h-4 w-4 border-t-white" /> : isEditing ? "Save changes" : "Create Account"}
                  </Button>
                  {isEditing && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancelEdit}
                      disabled={actionLoading}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
