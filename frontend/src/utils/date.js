export function toLocalDateString(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function todayInputValue() {
  return toLocalDateString(new Date());
}

export function toDateInputValue(v) {
  if (!v) return "";
  const s = String(v);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const parsed = new Date(s);
  if (Number.isNaN(parsed.getTime())) return "";
  return toLocalDateString(parsed);
}

export function formatDisplayDate(v) {
  const input = toDateInputValue(v);
  if (!input) return "—";
  const [y, m, d] = input.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
