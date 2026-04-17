import { useEffect, useMemo, useState } from "react";
import API from "../services/api";
import { Card, CardBody, CardHeader, CardSubtitle, CardTitle } from "../components/ui/Card";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import Spinner from "../components/ui/Spinner";
import { useToast } from "../components/feedback/ToastProvider.jsx";

function currencyINR(value) {
  const n = Number(value ?? 0);
  if (Number.isNaN(n)) return "₹0";
  return `₹${n.toLocaleString("en-IN")}`;
}

function toDateInputValue(v) {
  if (!v) return "";
  // backend returns LocalDate as yyyy-mm-dd
  return String(v).slice(0, 10);
}

function EmptyState({ title, subtitle, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
      <div className="text-sm font-bold text-slate-900">{title}</div>
      {subtitle ? <div className="mt-1 text-sm text-slate-600">{subtitle}</div> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

function EditModal({ open, initial, onClose, onSave }) {
  const [form, setForm] = useState(initial ?? null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setForm(initial ?? null);
    setError("");
    setSaving(false);
  }, [initial, open]);

  if (!open || !form) return null;

  const submit = async () => {
    setError("");
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } catch (e) {
      setError(e?.response?.data?.message || "Could not save changes.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-lg rounded-[var(--radius)] border border-slate-200 bg-[rgb(var(--surface))] shadow-[var(--shadow)]">
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div>
            <div className="text-base font-extrabold text-slate-900">Edit transaction</div>
            <div className="mt-1 text-sm text-slate-500">Update details and save.</div>
          </div>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>

        <div className="px-5 py-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Amount"
              value={String(form.amount ?? "")}
              onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
              inputMode="decimal"
              placeholder="e.g. 499"
            />
            <Input
              label="Category"
              value={form.category ?? ""}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              placeholder="e.g. Food"
            />
            <Input
              label="Date"
              type="date"
              value={toDateInputValue(form.date)}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
            <Select
              label="Type"
              value={form.type ?? "EXPENSE"}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              <option value="EXPENSE">Expense</option>
              <option value="INCOME">Income</option>
            </Select>
            <div className="sm:col-span-2">
              <Input
                label="Description"
                value={form.description ?? ""}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Optional notes"
              />
            </div>
          </div>

          {error ? (
            <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-5 py-4">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? (
              <>
                <Spinner className="h-4 w-4 border-t-white" />
                Saving…
              </>
            ) : (
              "Save changes"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function ExpensesPage() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // filters
  const [category, setCategory] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sort, setSort] = useState("desc");

  // edit
  const [editing, setEditing] = useState(null);

  const categories = useMemo(() => {
    const set = new Set();
    for (const t of items) {
      if (t?.category) set.add(t.category);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [items]);

  const fetchList = async () => {
    setError("");
    setLoading(true);
    try {
      const hasFilter = category || (startDate && endDate) || sort;
      const res = hasFilter
        ? await API.get("/expenses/filter", {
            params: {
              category: category || undefined,
              startDate: startDate || undefined,
              endDate: endDate || undefined,
              sort: sort || undefined,
            },
          })
        : await API.get("/expenses");

      setItems(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setError(e?.response?.data?.message || "Could not load transactions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyFilters = async () => {
    await fetchList();
  };

  const clearFilters = async () => {
    setCategory("");
    setStartDate("");
    setEndDate("");
    setSort("desc");
    // fetch after state flush
    setTimeout(fetchList, 0);
  };

  const handleDelete = async (id) => {
    const ok = window.confirm("Delete this transaction?");
    if (!ok) return;
    setError("");
    setActionLoading(true);
    try {
      await API.delete(`/expenses/${id}`);
      toast.push({ tone: "success", title: "Deleted", message: "Transaction removed." });
      await fetchList();
    } catch (e) {
      setError(e?.response?.data?.message || "Could not delete transaction.");
      toast.push({ tone: "error", title: "Delete failed", message: "Please try again." });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveEdit = async (updated) => {
    setActionLoading(true);
    try {
      const payload = {
        ...updated,
        date: toDateInputValue(updated.date),
      };
      await API.put(`/expenses/${updated.id}`, payload);
      toast.push({ tone: "success", title: "Saved", message: "Changes updated." });
      await fetchList();
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Expenses & income</CardTitle>
          <CardSubtitle>Manage, filter, sort, edit, and delete transactions.</CardSubtitle>
        </CardHeader>
        <CardBody>
          <div className="grid gap-3 md:grid-cols-4">
            <Select
              label="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">All</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>

            <Input
              label="Start date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />

            <Input
              label="End date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />

            <Select label="Sort" value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="desc">Latest first</option>
              <option value="asc">Oldest first</option>
            </Select>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button onClick={applyFilters} disabled={loading || actionLoading}>
              Apply filters
            </Button>
            <Button variant="outline" onClick={clearFilters} disabled={loading || actionLoading}>
              Clear
            </Button>
            <Button variant="outline" onClick={fetchList} disabled={loading || actionLoading}>
              Refresh
            </Button>
            {(loading || actionLoading) && (
              <div className="ml-auto flex items-center gap-2 text-sm text-slate-600">
                <Spinner />
                Working…
              </div>
            )}
          </div>

          {error ? (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
          <CardSubtitle>All transactions for your account</CardSubtitle>
        </CardHeader>
        <CardBody>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Spinner />
              Loading…
            </div>
          ) : items.length ? (
            <div className="-mx-5 overflow-x-auto">
              <table className="w-full min-w-[800px] border-separate border-spacing-0">
                <thead>
                  <tr className="text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    <th className="border-b border-slate-200 px-5 py-3">Date</th>
                    <th className="border-b border-slate-200 px-5 py-3">Category</th>
                    <th className="border-b border-slate-200 px-5 py-3">Type</th>
                    <th className="border-b border-slate-200 px-5 py-3">Amount</th>
                    <th className="border-b border-slate-200 px-5 py-3">Description</th>
                    <th className="border-b border-slate-200 px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((t) => {
                    const isExpense = (t?.type ?? "EXPENSE") === "EXPENSE";
                    const badgeVariant = isExpense ? "danger" : "success";
                    const amountCls = isExpense ? "text-red-600" : "text-emerald-700";
                    return (
                      <tr key={t.id} className="hover:bg-slate-50/60">
                        <td className="border-b border-slate-100 px-5 py-3 text-sm text-slate-700">
                          {toDateInputValue(t?.date) || "—"}
                        </td>
                        <td className="border-b border-slate-100 px-5 py-3 text-sm font-semibold text-slate-900">
                          {t?.category ?? "—"}
                        </td>
                        <td className="border-b border-slate-100 px-5 py-3">
                          <Badge variant={badgeVariant}>{isExpense ? "Expense" : "Income"}</Badge>
                        </td>
                        <td className={["border-b border-slate-100 px-5 py-3 text-sm font-extrabold", amountCls].join(" ")}>
                          {currencyINR(t?.amount)}
                        </td>
                        <td className="border-b border-slate-100 px-5 py-3 text-sm text-slate-600">
                          {t?.description ?? "—"}
                        </td>
                        <td className="border-b border-slate-100 px-5 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              onClick={() => setEditing(t)}
                              disabled={actionLoading}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              className="text-red-600 hover:bg-red-50"
                              onClick={() => handleDelete(t.id)}
                              disabled={actionLoading}
                            >
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              title="No transactions found"
              subtitle="Try adjusting filters, or add your first transaction from the Dashboard."
              action={
                <Button variant="outline" onClick={clearFilters}>
                  Reset filters
                </Button>
              }
            />
          )}
        </CardBody>
      </Card>

      <EditModal
        open={Boolean(editing)}
        initial={editing}
        onClose={() => setEditing(null)}
        onSave={handleSaveEdit}
      />
    </div>
  );
}

