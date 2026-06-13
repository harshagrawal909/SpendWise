import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import API from '@/services/api';
import { formatCurrency } from '@/utils/currency';

import { ScreenContainer } from '@/components/ScreenContainer';
import { TransactionActions } from '@/components/TransactionActions';
import { Badge } from '@/components/ui/Badge';
import { Card, CardBody, CardHeader, CardSubtitle, CardTitle } from '@/components/ui/Card';
import { useTransactionRefresh } from '@/context/TransactionRefreshContext';
import { getTransactions, getSummary, deleteTransaction } from '@/services/transactionService';
import { SyncStatusBadge } from '@/components/SyncStatusBadge';
import { SpendWiseTheme } from '@/constants/theme';
import { currencyINR, formatDisplayDate, type Summary, type Transaction } from '@/utils/format';
import { NotificationModal } from '@/components/NotificationModal';

export default function DashboardScreen() {
  const { refreshKey, notifyTransactionChange, syncState, pendingCount, pendingIds, triggerSync } = useTransactionRefresh();
  const [summary, setSummary] = useState<Summary>({});
  const [recent, setRecent] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [notifVisible, setNotifVisible] = useState(false);
  const [userCurrency, setUserCurrency] = useState('INR');

  const fetchData = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      const [summaryData, allTransactions, userRes] = await Promise.all([
        getSummary(),
        getTransactions(),
        API.get('/users/me').catch(() => ({ data: { currency: 'INR' } })),
      ]);
      setSummary(summaryData);
      setUserCurrency(userRes.data?.currency || 'INR');
      const sorted = [...allTransactions].sort((a, b) => String(b?.date ?? '').localeCompare(String(a?.date ?? '')));
      setRecent(sorted.slice(0, 5));
    } catch (e: unknown) {
      console.error('Error in dashboard.tsx fetchData:', e);
      const err = e as { message?: string };
      setError(err?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData, refreshKey]),
  );

  const quickStats = useMemo(() => {
    const income = Number(summary?.income ?? 0) || 0;
    const expense = Number(summary?.expense ?? 0) || 0;
    const balance = Number(summary?.balance ?? income - expense) || 0;
    return { income, expense, balance };
  }, [summary]);

  const handleDelete = (id: string) => {
    Alert.alert('Delete transaction', 'Are you sure you want to delete this transaction?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setDeleting(true);
          try {
            await deleteTransaction(id);
            notifyTransactionChange();
            await fetchData();
          } catch (e: unknown) {
            console.error('Error in dashboard.tsx handleDelete:', e);
            const err = e as { message?: string };
            setError(err?.message ?? String(e));
          } finally {
            setDeleting(false);
          }
        },
      },
    ]);
  };

  return (
    <ScreenContainer contentContainerStyle={styles.container}>
      {error ? <Text style={styles.errorBanner}>{error}</Text> : null}

      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.pageTitle}>Dashboard</Text>
          <Text style={styles.pageSubtitle}>Your financial overview at a glance.</Text>
        </View>
        <TouchableOpacity
          style={styles.bellBtn}
          onPress={() => setNotifVisible(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="notifications-outline" size={22} color={SpendWiseTheme.text} />
          <View style={styles.bellDot} />
        </TouchableOpacity>
        <SyncStatusBadge syncState={syncState} pendingCount={pendingCount} onPress={triggerSync} />
      </View>

      {loading ? (
        <ActivityIndicator color={SpendWiseTheme.primary} style={styles.loader} />
      ) : (
        <View style={styles.statsGrid}>
          <StatCard label="Income" value={formatCurrency(quickStats.income, userCurrency)} accent="#10B981" hint="Received" />
          <StatCard label="Expenses" value={formatCurrency(quickStats.expense, userCurrency)} accent="#EF4444" hint="Spent" />
          <StatCard label="Balance" value={formatCurrency(quickStats.balance, userCurrency)} accent={SpendWiseTheme.primary} hint="Net" />
        </View>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recent transactions</CardTitle>
          <CardSubtitle>Latest 5 entries — tap + to add more</CardSubtitle>
        </CardHeader>
        <CardBody>
          {loading ? (
            <ActivityIndicator color={SpendWiseTheme.primary} />
          ) : recent.length ? (
            recent.map((t) => {
              const isExpense = (t?.type ?? 'EXPENSE') === 'EXPENSE';
              const isPending = pendingIds.includes(t.id) || String(t.id).startsWith('temp_');
              return (
                <View key={t.id} style={styles.txRow}>
                  <View style={styles.txLeft}>
                    <View style={styles.txTop}>
                      <Text style={styles.txCategory}>{t?.category ?? '—'}</Text>
                      <Badge label={isExpense ? 'Expense' : 'Income'} variant={isExpense ? 'danger' : 'success'} />
                      {isPending ? (
                        <Ionicons name="cloud-upload-outline" size={14} color="#F59E0B" style={styles.pendingIcon} />
                      ) : null}
                    </View>
                    <Text style={styles.txMeta}>
                      {formatDisplayDate(t?.date)} • {t?.description ?? 'No description'}
                    </Text>
                    <Text style={[styles.txAmount, { color: isExpense ? SpendWiseTheme.danger : SpendWiseTheme.success }]}>
                      {formatCurrency(t?.convertedAmount !== undefined ? t.convertedAmount : t?.amount, userCurrency)}
                      {t?.currency && t.currency !== userCurrency ? (
                        <Text style={{ fontSize: 10, fontWeight: 'normal', color: SpendWiseTheme.muted }}>
                          {'\n'}(original {formatCurrency(t.amount, t.currency)})
                        </Text>
                      ) : null}
                    </Text>
                  </View>
                  <TransactionActions onDelete={() => handleDelete(t.id)} disabled={deleting} />
                </View>
              );
            })
          ) : (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No transactions yet</Text>
              <Text style={styles.emptySubtitle}>Tap the + button to add your first entry.</Text>
            </View>
          )}
        </CardBody>
      </Card>

      <NotificationModal visible={notifVisible} onClose={() => setNotifVisible(false)} />
    </ScreenContainer>
  );
}

function StatCard({ label, value, accent, hint }: { label: string; value: string; accent: string; hint: string }) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statAccent, { backgroundColor: accent }]} />
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={styles.statHint}>{hint}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: 100, gap: 16 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  pageTitle: { fontSize: 22, fontWeight: '800', color: SpendWiseTheme.text },
  pageSubtitle: { fontSize: 13, color: SpendWiseTheme.muted, marginTop: 4 },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: SpendWiseTheme.border,
    backgroundColor: SpendWiseTheme.surface,
    padding: 14,
    overflow: 'hidden',
    ...SpendWiseTheme.shadow,
  },
  statAccent: { position: 'absolute', top: 0, left: 0, right: 0, height: 3 },
  statLabel: { fontSize: 12, fontWeight: '600', color: SpendWiseTheme.muted, marginTop: 4 },
  statValue: { fontSize: 17, fontWeight: '800', color: SpendWiseTheme.text, marginTop: 6 },
  statHint: { fontSize: 10, color: '#94A3B8', marginTop: 4 },
  loader: { paddingVertical: 32 },
  errorBanner: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
    color: '#B91C1C',
    padding: 12,
    fontSize: 13,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: SpendWiseTheme.border,
    backgroundColor: '#FFFFFF',
    padding: 14,
  },
  txLeft: { flex: 1, gap: 4 },
  txTop: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  txCategory: { fontSize: 14, fontWeight: '800', color: SpendWiseTheme.text },
  txMeta: { fontSize: 11, color: '#94A3B8' },
  txAmount: { fontSize: 14, fontWeight: '800' },
  pendingIcon: { marginLeft: 6 },
  empty: {
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: SpendWiseTheme.border,
    backgroundColor: '#F8FAFC',
    padding: 24,
    alignItems: 'center',
  },
  emptyTitle: { fontSize: 14, fontWeight: '700', color: SpendWiseTheme.text },
  emptySubtitle: { fontSize: 13, color: SpendWiseTheme.muted, marginTop: 4, textAlign: 'center' },
  bellBtn: {
    position: 'relative',
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: SpendWiseTheme.border,
  },
  bellDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
  },
});
