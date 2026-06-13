import { useState } from "react";
import API from "../services/api";
import { Card, CardBody, CardHeader, CardSubtitle, CardTitle } from "../components/ui/Card";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import Spinner from "../components/ui/Spinner";
import { todayInputValue } from "../utils/date.js";
import { useToast } from "../components/feedback/ToastProvider.jsx";

export default function CsvExport() {
  const toast = useToast();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleQuickSelect = (days) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);

    // Format as YYYY-MM-DD for date inputs
    const formatDateInput = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    setStartDate(formatDateInput(start));
    setEndDate(formatDateInput(end));
  };

  const handleExport = async () => {
    setError("");
    setLoading(true);

    try {
      const res = await API.get("/expenses/filter", {
        params: {
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          sort: "asc", // Export chronological order
        },
      });

      const transactions = Array.isArray(res.data) ? res.data : [];

      if (transactions.length === 0) {
        toast.push({
          tone: "warning",
          title: "No Data",
          message: "No transactions found for the selected date range.",
        });
        setLoading(false);
        return;
      }

      // Convert to CSV
      // Headers: Date, Type, Amount, Currency, Converted Amount, Category, Description
      let csvContent = "Date,Type,Amount,Currency,Converted Amount,Category,Description\n";
      
      transactions.forEach((t) => {
        const dateStr = t.date ? new Date(t.date).toLocaleDateString() : "";
        const type = t.type || "EXPENSE";
        const amount = t.amount ?? 0;
        const currency = t.currency || "INR";
        const converted = t.convertedAmount ?? amount;
        const category = (t.category || "").replace(/"/g, '""');
        const desc = (t.description || "").replace(/"/g, '""');

        csvContent += `"${dateStr}","${type}",${amount},"${currency}",${converted},"${category}","${desc}"\n`;
      });

      // Trigger download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `SpendWise-Transactions-${startDate || "all"}-to-${endDate || "all"}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.push({
        tone: "success",
        title: "Export Successful",
        message: `Exported ${transactions.length} transaction(s) to CSV successfully.`,
      });
    } catch (err) {
      setError(err?.response?.data?.message || "Could not export transactions.");
      toast.push({
        tone: "error",
        title: "Export Failed",
        message: "An error occurred while downloading transactions.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>📊 Export Transactions</CardTitle>
          <CardSubtitle>Download your financial records as a CSV spreadsheet file.</CardSubtitle>
        </CardHeader>
        <CardBody className="space-y-6">
          
          {/* Quick Select Presets */}
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">
              Quick Range Select
            </label>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => handleQuickSelect(7)}>
                Last 1 Week
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleQuickSelect(30)}>
                Last 1 Month
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleQuickSelect(365)}>
                Last 1 Year
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 hover:bg-red-50"
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                }}
              >
                Clear Range
              </Button>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Custom Date Pickers */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Start Date"
              type="date"
              value={startDate}
              max={todayInputValue()}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <Input
              label="End Date"
              type="date"
              value={endDate}
              max={todayInputValue()}
              min={startDate || undefined}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
              {error}
            </div>
          )}

          <Button
            onClick={handleExport}
            className="w-full justify-center gap-2"
            disabled={loading}
          >
            {loading ? (
              <>
                <Spinner className="h-4 w-4 border-t-white" />
                Preparing Export…
              </>
            ) : (
              <>
                <span>📥 Export Data (CSV)</span>
              </>
            )}
          </Button>
        </CardBody>
      </Card>
    </div>
  );
}
