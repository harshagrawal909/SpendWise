import { formatCurrency } from './currency';

export function currencyINR(value: unknown) {
  return formatCurrency(value, 'INR');
}

/** Format a Date as local YYYY-MM-DD (no timezone shift). */
export function toLocalDateString(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function todayInputValue() {
  return toLocalDateString(new Date());
}

export function toDateInputValue(v: unknown) {
  if (!v) return '';
  const s = String(v);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const parsed = new Date(s);
  if (Number.isNaN(parsed.getTime())) return '';
  return toLocalDateString(parsed);
}

/** Human-readable date for lists, e.g. "9 Jun 2026". */
export function formatDisplayDate(v: unknown) {
  const input = toDateInputValue(v);
  if (!input) return '—';
  const [y, m, d] = input.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export type Transaction = {
  id: string;
  amount: number;
  category: string;
  date: string;
  description?: string;
  type: 'EXPENSE' | 'INCOME';
  currency?: string;
  convertedAmount?: number;
  account?: any;
};

export type Summary = {
  income?: number;
  expense?: number;
  balance?: number;
};
