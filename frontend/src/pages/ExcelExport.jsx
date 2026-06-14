import { useState } from "react";
import * as XLSX from "xlsx";
import API from "../services/api";
import { Card, CardBody, CardHeader, CardSubtitle, CardTitle } from "../components/ui/Card";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import Spinner from "../components/ui/Spinner";
import { todayInputValue } from "../utils/date.js";
import { useToast } from "../components/feedback/ToastProvider.jsx";

export default function ExcelExport() {
  const toast = useToast();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleQuickSelect = (days) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);

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
          sort: "asc",
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

      // Convert to Excel workbook using SheetJS
      const dataRows = transactions.map((t) => ({
        "Date": t.date ? new Date(t.date).toLocaleDateString() : "",
        "Type": t.type || "EXPENSE",
        "Amount": t.amount ?? 0,
        "Currency": t.currency || "INR",
        "Converted Amount": t.convertedAmount ?? (t.amount ?? 0),
        "Category": t.category || "",
        "Description": t.description || "",
      }));

      const worksheet = XLSX.utils.json_to_sheet(dataRows);
      
      // Auto-fit column widths
      const maxLens = {};
      dataRows.forEach((row) => {
        Object.keys(row).forEach((key) => {
          const val = String(row[key] ?? "");
          maxLens[key] = Math.max(maxLens[key] || 10, val.length + 2);
        });
      });
      worksheet["!cols"] = Object.keys(maxLens).map((key) => ({ wch: maxLens[key] }));

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");

      // Trigger browser download
      const fileName = `SpendWise-Transactions-${startDate || "all"}-to-${endDate || "all"}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      toast.push({
        tone: "success",
        title: "Export Successful",
        message: `Exported ${transactions.length} transaction(s) to Excel successfully.`,
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
      <Card className="border border-slate-100/80 shadow-xl shadow-slate-100/40 rounded-3xl overflow-hidden bg-white/80 backdrop-blur-md">
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 h-2" />
        <CardHeader className="pt-6 pb-2">
          <CardTitle className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <span>📈</span> Excel Export
          </CardTitle>
          <CardSubtitle className="text-slate-500 font-medium mt-1">
            Download your financial ledger records as a native Excel workbook spreadsheet (.xlsx).
          </CardSubtitle>
        </CardHeader>
        <CardBody className="space-y-6 pt-4">
          
          <div>
            <label className="mb-2.5 block text-xs font-extrabold uppercase tracking-wider text-slate-400">
              Quick Range Select
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleQuickSelect(7)}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-slate-100 hover:border-slate-200 active:scale-95 transition cursor-pointer"
              >
                Last 1 Week
              </button>
              <button
                type="button"
                onClick={() => handleQuickSelect(30)}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-slate-100 hover:border-slate-200 active:scale-95 transition cursor-pointer"
              >
                Last 1 Month
              </button>
              <button
                type="button"
                onClick={() => handleQuickSelect(365)}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-slate-100 hover:border-slate-200 active:scale-95 transition cursor-pointer"
              >
                Last 1 Year
              </button>
              <button
                type="button"
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                }}
                className="px-4 py-2 text-xs font-bold text-rose-600 bg-rose-50 rounded-2xl border border-rose-100 hover:bg-rose-100 hover:border-rose-200 active:scale-95 transition cursor-pointer ml-auto"
              >
                Clear Range
              </button>
            </div>
          </div>

          <hr className="border-slate-100" />

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
            <div className="rounded-2xl border border-rose-100 bg-rose-50/50 p-4 text-sm font-semibold text-rose-600">
              {error}
            </div>
          )}

          <Button
            onClick={handleExport}
            className="w-full justify-center py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-extrabold hover:from-emerald-600 hover:to-teal-700 hover:shadow-lg hover:shadow-emerald-600/20 active:scale-[0.99] transition duration-300"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Spinner className="h-4 w-4 border-t-white" />
                Compiling Excel Workbook...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                📥 Generate Spreadsheet (.xlsx)
              </span>
            )}
          </Button>
        </CardBody>
      </Card>
    </div>
  );
}
