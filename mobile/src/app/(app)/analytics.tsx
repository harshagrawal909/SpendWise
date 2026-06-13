import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ScreenContainer } from '@/components/ScreenContainer';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader, CardSubtitle, CardTitle } from '@/components/ui/Card';
import { DatePickerField } from '@/components/ui/DatePickerField';
import { Select } from '@/components/ui/Select';
import { useTransactionRefresh } from '@/context/TransactionRefreshContext';
import { getTransactions } from '@/services/transactionService';
import { PIE_COLORS, SpendWiseTheme } from '@/constants/theme';
import { currencyINR, toDateInputValue, type Transaction } from '@/utils/format';
import API from '@/services/api';
import { formatCurrency } from '@/utils/currency';

function parseFilterDate(value: string) {
  const input = toDateInputValue(value);
  if (!input) return undefined;
  const [y, m, d] = input.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function toMonthlyData(expenses: Transaction[]) {
  const monthly = new Map<string, number>();
  for (const e of expenses) {
    if ((e?.type ?? 'EXPENSE') !== 'EXPENSE') continue;
    const date = new Date(String(e?.date));
    if (Number.isNaN(date.getTime())) continue;
    const key = date.toLocaleString('en-US', { month: 'short', year: 'numeric' });
    const amount = Number(e?.convertedAmount !== undefined ? e.convertedAmount : e?.amount) || 0;
    monthly.set(key, (monthly.get(key) ?? 0) + amount);
  }
  return Array.from(monthly.entries())
    .map(([month, amount]) => ({ month, amount }))
    .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());
}

function toCategoryData(expenses: Transaction[]) {
  const map = new Map<string, number>();
  for (const e of expenses) {
    if ((e?.type ?? 'EXPENSE') !== 'EXPENSE') continue;
    const category = (e?.category ?? 'Other').trim() || 'Other';
    const amount = Number(e?.convertedAmount !== undefined ? e.convertedAmount : e?.amount) || 0;
    map.set(category, (map.get(category) ?? 0) + amount);
  }
  return Array.from(map.entries())
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10);
}

export default function AnalyticsScreen() {
  const { refreshKey } = useTransactionRefresh();
  const [items, setItems] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [category, setCategory] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sort, setSort] = useState('desc');
  const [userCurrency, setUserCurrency] = useState('INR');

  const categoryOptions = useMemo(() => {
    const set = new Set<string>();
    for (const t of items) if (t?.category) set.add(t.category);
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [items]);

  const monthlyData = useMemo(() => toMonthlyData(items), [items]);
  const categoryData = useMemo(() => toCategoryData(items), [items]);
  const maxMonthly = useMemo(() => Math.max(...monthlyData.map((d) => d.amount), 1), [monthlyData]);
  const maxCategory = useMemo(() => Math.max(...categoryData.map((d) => d.amount), 1), [categoryData]);

  const fetchData = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      const [res, userRes] = await Promise.all([
        getTransactions({
          category: category || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          sort: sort || undefined,
        }),
        API.get('/users/me').catch(() => ({ data: { currency: 'INR' } })),
      ]);
      setItems(res);
      setUserCurrency(userRes.data?.currency || 'INR');
    } catch (e: unknown) {
      const err = e as { message?: string };
      setError(err?.message ?? 'Could not load analytics.');
    } finally {
      setLoading(false);
    }
  }, [category, startDate, endDate, sort]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData, refreshKey]),
  );

  return (
    <ScreenContainer contentContainerStyle={styles.container}>
      <Card>
        <CardHeader>
          <CardTitle>Analytics</CardTitle>
          <CardSubtitle>Charts update based on your selected filters.</CardSubtitle>
        </CardHeader>
        <CardBody>
          <Select
            label="Category"
            value={category}
            onValueChange={setCategory}
            options={[{ label: 'All', value: '' }, ...categoryOptions.map((c) => ({ label: c, value: c }))]}
          />
          <DatePickerField label="Start date" value={startDate} onChange={setStartDate} />
          <DatePickerField
            label="End date"
            value={endDate}
            onChange={setEndDate}
            minimumDate={startDate ? parseFilterDate(startDate) : undefined}
          />
          <Select
            label="Sort"
            value={sort}
            onValueChange={setSort}
            options={[
              { label: 'Latest first', value: 'desc' },
              { label: 'Oldest first', value: 'asc' },
            ]}
          />
          <View style={styles.row}>
            <Button title="Apply" onPress={fetchData} disabled={loading} />
            <Button
              title="Reset"
              variant="outline"
              onPress={() => {
                setCategory('');
                setStartDate('');
                setEndDate('');
                setSort('desc');
              }}
              disabled={loading}
            />
          </View>
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Category distribution</CardTitle>
          <CardSubtitle>Top categories by spend (expenses only)</CardSubtitle>
        </CardHeader>
        <CardBody>
          {loading ? (
            <Text style={styles.muted}>Loading…</Text>
          ) : categoryData.length ? (
            categoryData.map((c, i) => (
              <View key={c.category} style={styles.barRow}>
                <View style={styles.barLabelRow}>
                  <View style={[styles.dot, { backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }]} />
                  <Text style={styles.barLabel}>{c.category}</Text>
                  <Text style={styles.barValue}>{formatCurrency(c.amount, userCurrency)}</Text>
                </View>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        width: `${(c.amount / maxCategory) * 100}%`,
                        backgroundColor: PIE_COLORS[i % PIE_COLORS.length],
                      },
                    ]}
                  />
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.empty}>No data for selected filters.</Text>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Monthly expenses</CardTitle>
          <CardSubtitle>Trend over time (expenses only)</CardSubtitle>
        </CardHeader>
        <CardBody>
          {loading ? (
            <Text style={styles.muted}>Loading…</Text>
          ) : monthlyData.length ? (
            <View style={styles.chartRow}>
              {monthlyData.map((d) => (
                <View key={d.month} style={styles.chartCol}>
                  <View
                    style={[
                      styles.chartBar,
                      { height: Math.max(8, (d.amount / maxMonthly) * 120), backgroundColor: '#ef4444' },
                    ]}
                  />
                  <Text style={styles.chartMonth} numberOfLines={1}>
                    {d.month.split(' ')[0]}
                  </Text>
                  <Text style={styles.chartAmount}>{formatCurrency(d.amount, userCurrency)}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.empty}>No data for selected filters.</Text>
          )}
        </CardBody>
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: 100 },
  row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  error: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
    color: '#B91C1C',
    padding: 10,
    fontSize: 13,
  },
  muted: { color: SpendWiseTheme.muted, fontSize: 14 },
  empty: {
    textAlign: 'center',
    color: SpendWiseTheme.muted,
    fontSize: 14,
    paddingVertical: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: SpendWiseTheme.border,
    backgroundColor: '#F8FAFC',
  },
  barRow: { gap: 6 },
  barLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 999 },
  barLabel: { flex: 1, fontSize: 13, fontWeight: '600', color: SpendWiseTheme.text },
  barValue: { fontSize: 12, fontWeight: '700', color: SpendWiseTheme.muted },
  barTrack: { height: 8, borderRadius: 999, backgroundColor: '#E2E8F0', overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 999 },
  chartRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, minHeight: 160, paddingTop: 8 },
  chartCol: { flex: 1, alignItems: 'center', gap: 4 },
  chartBar: { width: '80%', borderRadius: 10, minHeight: 8 },
  chartMonth: { fontSize: 10, color: SpendWiseTheme.muted, textAlign: 'center' },
  chartAmount: { fontSize: 9, color: '#94A3B8', textAlign: 'center' },
});
