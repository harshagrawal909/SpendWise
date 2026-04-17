import { useEffect, useMemo, useState } from "react";
import API from "../services/api";
import { Card, CardBody, CardHeader, CardSubtitle, CardTitle } from "../components/ui/Card";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Button from "../components/ui/Button";
import Spinner from "../components/ui/Spinner";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from "recharts";

const PIE_COLORS = [
  "#4f46e5",
  "#0ea5e9",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#a855f7",
  "#14b8a6",
  "#64748b",
];

function currencyINR(value) {
  const n = Number(value ?? 0);
  if (Number.isNaN(n)) return "₹0";
  return `₹${n.toLocaleString("en-IN")}`;
}

function toMonthlyData(expenses) {
  const monthly = new Map();
  for (const e of expenses) {
    if ((e?.type ?? "EXPENSE") !== "EXPENSE") continue;
    const date = new Date(String(e?.date));
    if (Number.isNaN(date.getTime())) continue;
    const key = date.toLocaleString("en-US", { month: "short", year: "numeric" });
    monthly.set(key, (monthly.get(key) ?? 0) + (Number(e.amount) || 0));
  }
  // sort by actual time
  return Array.from(monthly.entries())
    .map(([month, amount]) => ({ month, amount }))
    .sort((a, b) => new Date(a.month) - new Date(b.month));
}

function toCategoryData(expenses) {
  const map = new Map();
  for (const e of expenses) {
    if ((e?.type ?? "EXPENSE") !== "EXPENSE") continue;
    const category = (e?.category ?? "Other").trim() || "Other";
    const amount = Number(e?.amount ?? 0) || 0;
    map.set(category, (map.get(category) ?? 0) + amount);
  }
  return Array.from(map.entries())
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10);
}

export default function Analytics() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // same filters as /expenses/filter
  const [category, setCategory] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sort, setSort] = useState("desc");

  const categoryOptions = useMemo(() => {
    const set = new Set();
    for (const t of items) if (t?.category) set.add(t.category);
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [items]);

  const monthlyData = useMemo(() => toMonthlyData(items), [items]);
  const categoryData = useMemo(() => toCategoryData(items), [items]);

  const fetchData = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await API.get("/expenses/filter", {
        params: {
          category: category || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          sort: sort || undefined,
        },
      });
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setError(e?.response?.data?.message || "Could not load analytics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Analytics</CardTitle>
          <CardSubtitle>Charts update based on your selected filters.</CardSubtitle>
        </CardHeader>
        <CardBody>
          <div className="grid gap-3 md:grid-cols-4">
            <Select label="Category" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">All</option>
              {categoryOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
            <Input label="Start date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            <Input label="End date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            <Select label="Sort" value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="desc">Latest first</option>
              <option value="asc">Oldest first</option>
            </Select>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button onClick={fetchData} disabled={loading}>
              Apply
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setCategory("");
                setStartDate("");
                setEndDate("");
                setSort("desc");
                setTimeout(fetchData, 0);
              }}
              disabled={loading}
            >
              Reset
            </Button>
            {loading ? (
              <div className="ml-auto flex items-center gap-2 text-sm text-slate-600">
                <Spinner />
                Loading…
              </div>
            ) : null}
          </div>

          {error ? (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}
        </CardBody>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Category distribution</CardTitle>
            <CardSubtitle>Top categories by spend (expenses only)</CardSubtitle>
          </CardHeader>
          <CardBody>
            <div className="h-96">
                {loading ? (
                  <div className="flex h-full items-center justify-center text-slate-600">
                    <Spinner />
                    <span className="ml-2 text-sm">Loading…</span>
                  </div>
                ) : categoryData.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        dataKey="amount"
                        nameKey="category"
                        outerRadius="80%"
                        innerRadius="55%"
                        paddingAngle={2}
                      >
                        {categoryData.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v, name) => [currencyINR(v), name]} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-600">
                    No data for selected filters.
                  </div>
                )}
            </div>

            {/* Compact legend below chart (color + name) */}
            {!loading && categoryData.length ? (
              <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
                {categoryData.map((c, i) => (
                  <div key={c.category} className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                    />
                    <span className="text-sm font-semibold text-slate-700">
                      {c.category}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly expenses</CardTitle>
            <CardSubtitle>Trend over time (expenses only)</CardSubtitle>
          </CardHeader>
          <CardBody>
            <div className="h-96">
              {loading ? (
                <div className="flex h-full items-center justify-center text-slate-600">
                  <Spinner />
                  <span className="ml-2 text-sm">Loading…</span>
                </div>
              ) : monthlyData.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData} margin={{ left: 8, right: 8 }}>
                    <XAxis dataKey="month" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} width={46} tickFormatter={(v) => `₹${v}`} />
                    <Tooltip formatter={(v) => currencyINR(v)} />
                    <Bar dataKey="amount" radius={[10, 10, 10, 10]} fill="#4f46e5" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-600">
                  No data for selected filters.
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

