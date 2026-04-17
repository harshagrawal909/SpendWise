import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import { Card, CardBody, CardHeader, CardSubtitle, CardTitle } from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Badge from "../components/ui/Badge";
import Spinner from "../components/ui/Spinner";
import Skeleton from "../components/ui/Skeleton";
import { useToast } from "../components/feedback/ToastProvider.jsx";

function currencyINR(value) {
  const n = Number(value ?? 0);
  if (Number.isNaN(n)) return "₹0";
  return `₹${n.toLocaleString("en-IN")}`;
}

export default function Dashboard() {
  const toast = useToast();
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [recent, setRecent] = useState([]);

  const [form, setForm] = useState({
    amount: "",
    category: "",
    date: "",
    description: "",
    type: "EXPENSE",
  });
  const navigate = useNavigate();

  const fetchData = async () => {
    setError("");
    setLoading(true);
    try {
      const [summaryRes, expenseRes] = await Promise.all([
        API.get("/expenses/summary"),
        API.get("/expenses"),
      ]);

      setSummary(summaryRes.data ?? {});
      const all = Array.isArray(expenseRes.data) ? expenseRes.data : [];
      const sorted = [...all].sort((a, b) => String(b?.date ?? "").localeCompare(String(a?.date ?? "")));
      setRecent(sorted.slice(0, 5));
    } catch (e) {
      setError(
        e?.response?.data?.message ||
          "Could not load dashboard data. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAdd = async () => {
    setError("");
    setActionLoading(true);
    try {
      await API.post("/expenses", form);
      setForm({
        amount: "",
        category: "",
        date: "",
        description: "",
        type: "EXPENSE",
      });
      toast.push({ tone: "success", title: "Saved", message: "Transaction added." });
      await fetchData();
    } catch (e) {
      setError(
        e?.response?.data?.message ||
          "Could not add transaction. Please check the form and try again."
      );
      toast.push({ tone: "error", title: "Save failed", message: "Please try again." });
    } finally {
      setActionLoading(false);
    }
  };

  const quickStats = useMemo(() => {
    const income = Number(summary?.income ?? 0) || 0;
    const expense = Number(summary?.expense ?? 0) || 0;
    const balance = Number(summary?.balance ?? income - expense) || 0;
    return { income, expense, balance };
  }, [summary]);

  return (
    <div className="space-y-4">
      {error ? (
        <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xl font-extrabold text-slate-900">Dashboard</div>
          <div className="mt-1 text-sm text-slate-600">Clean overview + quick actions.</div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => navigate("/expenses")}>
            Manage expenses
          </Button>
          <Button variant="outline" onClick={() => navigate("/analytics")}>
            View analytics
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {loading ? (
          <>
            <Card><CardBody><Skeleton className="h-6 w-24" /><Skeleton className="mt-3 h-8 w-40" /><Skeleton className="mt-3 h-4 w-28" /></CardBody></Card>
            <Card><CardBody><Skeleton className="h-6 w-24" /><Skeleton className="mt-3 h-8 w-40" /><Skeleton className="mt-3 h-4 w-28" /></CardBody></Card>
            <Card><CardBody><Skeleton className="h-6 w-24" /><Skeleton className="mt-3 h-8 w-40" /><Skeleton className="mt-3 h-4 w-28" /></CardBody></Card>
          </>
        ) : (
          <>
            <Card className="overflow-hidden">
              <div className="h-1 bg-emerald-500" />
              <CardBody>
                <div className="text-sm font-semibold text-slate-600">Income</div>
                <div className="mt-1 text-2xl font-extrabold text-slate-900">
                  {currencyINR(quickStats.income)}
                </div>
                <div className="mt-1 text-xs text-slate-500">Total received</div>
              </CardBody>
            </Card>
            <Card className="overflow-hidden">
              <div className="h-1 bg-red-500" />
              <CardBody>
                <div className="text-sm font-semibold text-slate-600">Expenses</div>
                <div className="mt-1 text-2xl font-extrabold text-slate-900">
                  {currencyINR(quickStats.expense)}
                </div>
                <div className="mt-1 text-xs text-slate-500">Total spent</div>
              </CardBody>
            </Card>
            <Card className="overflow-hidden">
              <div className="h-1 bg-indigo-600" />
              <CardBody>
                <div className="text-sm font-semibold text-slate-600">Balance</div>
                <div className="mt-1 text-2xl font-extrabold text-slate-900">
                  {currencyINR(quickStats.balance)}
                </div>
                <div className="mt-1 text-xs text-slate-500">Income − expenses</div>
              </CardBody>
            </Card>
          </>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Quick add</CardTitle>
            <CardSubtitle>Add a new expense or income</CardSubtitle>
          </CardHeader>
          <CardBody>
            <div className="grid gap-3">
              <Input
                label="Amount"
                placeholder="e.g. 499"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                inputMode="decimal"
              />
              <Input
                label="Category"
                placeholder="e.g. Food, Rent, Salary"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              />
              <Input
                label="Date"
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
              <Select
                label="Type"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                <option value="EXPENSE">Expense</option>
                <option value="INCOME">Income</option>
              </Select>
              <Input
                label="Description"
                placeholder="Optional notes"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
              <Button onClick={handleAdd} disabled={actionLoading} className="w-full">
                {actionLoading ? (
                  <>
                    <Spinner className="h-4 w-4 border-t-white" />
                    Saving…
                  </>
                ) : (
                  "Add transaction"
                )}
              </Button>
            </div>
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle>Recent transactions</CardTitle>
                <CardSubtitle>Latest 5 entries</CardSubtitle>
              </div>
              <Button variant="outline" onClick={fetchData} disabled={loading || actionLoading}>
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardBody>
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : recent.length ? (
              <div className="space-y-2">
                {recent.map((t) => {
                  const isExpense = (t?.type ?? "EXPENSE") === "EXPENSE";
                  return (
                    <div
                      key={t.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-[rgb(var(--surface))] px-4 py-3"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="truncate text-sm font-extrabold text-slate-900">
                            {t?.category ?? "—"}
                          </div>
                          <Badge variant={isExpense ? "danger" : "success"}>
                            {isExpense ? "Expense" : "Income"}
                          </Badge>
                        </div>
                        <div className="mt-1 truncate text-xs text-slate-500">
                          {t?.date ?? "—"} • {t?.description ?? "No description"}
                        </div>
                      </div>
                      <div className={["text-sm font-extrabold", isExpense ? "text-red-600" : "text-emerald-700"].join(" ")}>
                        {currencyINR(t?.amount)}
                      </div>
                    </div>
                  );
                })}
                <div className="pt-2">
                  <Button variant="outline" onClick={() => navigate("/expenses")}>
                    View all transactions
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
                <div className="text-sm font-bold text-slate-900">No transactions yet</div>
                <div className="mt-1 text-sm text-slate-600">
                  Add your first income/expense to start tracking.
                </div>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}