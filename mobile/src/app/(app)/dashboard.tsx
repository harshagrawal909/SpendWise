import { useFocusEffect, router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  const fetchData = async (overrideAccountId?: string | null) => {
    setError('');
    setLoading(true);
    try {
      const activeId = overrideAccountId !== undefined ? overrideAccountId : selectedAccountId;
      const [accountsRes, userRes] = await Promise.all([
        API.get('/accounts').catch(() => ({ data: [] })),
        API.get('/users/me').catch(() => ({ data: { currency: 'INR' } })),
      ]);

      const loadedAccounts = accountsRes.data || [];
      setAccounts(loadedAccounts);
      setUserCurrency(userRes.data?.currency || 'INR');

      const defaultAcc = loadedAccounts.find((a: any) => a.isDefault);
      
      let filterId = activeId;
      if (!filterId && defaultAcc) {
        filterId = defaultAcc._id;
        setSelectedAccountId(defaultAcc._id);
      }

      const [summaryData, allTransactions] = await Promise.all([
        getSummary(filterId || undefined),
        getTransactions({ accountId: filterId || undefined }),
      ]);

      setSummary(summaryData);
      
      const sorted = [...allTransactions].sort((a, b) => String(b?.date ?? '').localeCompare(String(a?.date ?? '')));
      setRecent(sorted.slice(0, 5));
    } catch (e: unknown) {
      console.error('Error in dashboard.tsx fetchData:', e);
      const err = e as { message?: string };
      setError(err?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [refreshKey, selectedAccountId])
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

      {/* Account Switcher Bar */}
      {accounts.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.switcherContainer}
          style={styles.switcherScroll}
        >
          {accounts.map((acc) => {
            const isSelected = selectedAccountId === acc._id;
            return (
              <TouchableOpacity
                key={acc._id}
                onPress={() => {
                  setSelectedAccountId(acc._id);
                  fetchData(acc._id);
                }}
                activeOpacity={0.7}
                style={[
                  styles.switcherCard,
                  isSelected ? styles.switcherCardSelected : null,
                ]}
              >
                {/* Color indicator line */}
                <View style={[styles.switcherColorLine, { backgroundColor: acc.color }]} />
                <View style={styles.switcherHeader}>
                  <Text style={styles.switcherName} numberOfLines={1}>
                    {acc.name}
                  </Text>
                </View>
                <Text style={styles.switcherBalance}>
                  {formatCurrency(acc.balance || 0, userCurrency)}
                </Text>
              </TouchableOpacity>
            );
          })}

          {accounts.length < 3 && (
            <TouchableOpacity
              onPress={() => router.push('/accounts' as any)}
              activeOpacity={0.7}
              style={[styles.switcherCard, styles.switcherCardAdd]}
            >
              <Ionicons name="add-circle-outline" size={22} color={SpendWiseTheme.muted} />
              <Text style={styles.switcherAddText}>Add Wallet</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      )}

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
                      {t?.account && (
                        <View style={[styles.txAccountBadge, { backgroundColor: t.account.color || SpendWiseTheme.primary }]}>
                          <Text style={styles.txAccountBadgeText}>{t.account.name}</Text>
                        </View>
                      )}
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
  switcherScroll: {
    marginVertical: 4,
  },
  switcherContainer: {
    gap: 10,
    paddingRight: 16,
  },
  switcherCard: {
    width: 140,
    height: 90,
    borderRadius: SpendWiseTheme.radius,
    borderWidth: 1,
    borderColor: SpendWiseTheme.border,
    backgroundColor: SpendWiseTheme.surface,
    padding: 12,
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
  },
  switcherCardSelected: {
    borderColor: SpendWiseTheme.primary,
    backgroundColor: '#EEF2FF',
    borderWidth: 1.5,
  },
  switcherCardAdd: {
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    gap: 4,
  },
  switcherAddText: {
    fontSize: 11,
    color: SpendWiseTheme.muted,
    fontWeight: '700',
  },
  switcherColorLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  switcherHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
  },
  switcherName: {
    fontSize: 11,
    fontWeight: '700',
    color: SpendWiseTheme.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    flex: 1,
  },
  switcherBalance: {
    fontSize: 17,
    fontWeight: '900',
    color: SpendWiseTheme.text,
  },
  defaultBadge: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: SpendWiseTheme.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  defaultBadgeText: {
    fontSize: 9,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  txAccountBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 4,
  },
  txAccountBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
