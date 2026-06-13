import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ScreenContainer } from '@/components/ScreenContainer';
import { TransactionActions } from '@/components/TransactionActions';
import { TransactionFormFields, type TransactionFormData } from '@/components/TransactionFormFields';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader, CardSubtitle, CardTitle } from '@/components/ui/Card';
import { DatePickerField } from '@/components/ui/DatePickerField';
import { Select } from '@/components/ui/Select';
import { useTransactionRefresh } from '@/context/TransactionRefreshContext';
import { getTransactions, updateTransaction, deleteTransaction } from '@/services/transactionService';
import { SyncStatusBadge } from '@/components/SyncStatusBadge';
import { SpendWiseTheme } from '@/constants/theme';
import { currencyINR, formatDisplayDate, toDateInputValue, type Transaction } from '@/utils/format';
import API from '@/services/api';
import { formatCurrency } from '@/utils/currency';

function parseFilterDate(value: string) {
  const input = toDateInputValue(value);
  if (!input) return undefined;
  const [y, m, d] = input.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export default function ExpensesScreen() {
  const { refreshKey, notifyTransactionChange, syncState, pendingCount, pendingIds, triggerSync } = useTransactionRefresh();
  const [items, setItems] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [category, setCategory] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sort, setSort] = useState('desc');
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [userCurrency, setUserCurrency] = useState('INR');

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const t of items) {
      if (t?.category) set.add(t.category);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [items]);

  const fetchList = useCallback(async () => {
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
      console.error('Error in expenses.tsx fetchList:', e);
      const err = e as { message?: string };
      setError(err?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }, [category, startDate, endDate, sort]);

  useFocusEffect(
    useCallback(() => {
      fetchList();
    }, [fetchList, refreshKey]),
  );

  const clearFilters = () => {
    setCategory('');
    setStartDate('');
    setEndDate('');
    setSort('desc');
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete transaction', 'Are you sure you want to delete this transaction?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setActionLoading(true);
          try {
            await deleteTransaction(id);
            notifyTransactionChange();
            await fetchList();
          } catch (e: unknown) {
            console.error('Error in expenses.tsx handleDelete:', e);
            const err = e as { message?: string };
            setError(err?.message ?? String(e));
          } finally {
            setActionLoading(false);
          }
        },
      },
    ]);
  };

  const handleSaveEdit = async (updated: TransactionFormData & { id: string }) => {
    setActionLoading(true);
    try {
      await updateTransaction(updated.id, {
        amount: Number(updated.amount),
        category: updated.category,
        date: toDateInputValue(updated.date),
        description: updated.description,
        type: updated.type as 'EXPENSE' | 'INCOME',
        currency: updated.currency || 'INR',
      });
      setEditing(null);
      notifyTransactionChange();
      await fetchList();
    } catch (e: unknown) {
      console.error('Error in expenses.tsx handleSaveEdit:', e);
      const err = e as { message?: string };
      setError(err?.message ?? String(e));
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <ScreenContainer contentContainerStyle={styles.container}>
      <Card>
        <CardHeader>
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <CardTitle>Expenses & income</CardTitle>
              <CardSubtitle>Manage, filter, sort, edit, and delete transactions.</CardSubtitle>
            </View>
            <SyncStatusBadge syncState={syncState} pendingCount={pendingCount} onPress={triggerSync} />
          </View>
        </CardHeader>
        <CardBody>
          <Select
            label="Category"
            value={category}
            onValueChange={setCategory}
            options={[{ label: 'All', value: '' }, ...categories.map((c) => ({ label: c, value: c }))]}
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
            <Button title="Apply filters" onPress={fetchList} disabled={loading || actionLoading} />
            <Button title="Clear" variant="outline" onPress={clearFilters} disabled={loading || actionLoading} />
          </View>
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
          <CardSubtitle>All transactions for your account</CardSubtitle>
        </CardHeader>
        <CardBody>
          {loading ? (
            <Text style={styles.muted}>Loading…</Text>
          ) : items.length ? (
            items.map((t) => {
              const isExpense = (t?.type ?? 'EXPENSE') === 'EXPENSE';
              const isPending = pendingIds.includes(t.id) || String(t.id).startsWith('temp_');
              return (
                <View key={t.id} style={styles.txCard}>
                  <View style={styles.txCardTop}>
                    <View style={styles.txHeader}>
                      <Text style={styles.txCategory}>{t?.category ?? '—'}</Text>
                      <Badge label={isExpense ? 'Expense' : 'Income'} variant={isExpense ? 'danger' : 'success'} />
                      {isPending ? (
                        <Ionicons name="cloud-upload-outline" size={14} color="#F59E0B" style={styles.pendingIcon} />
                      ) : null}
                    </View>
                    <TransactionActions
                      onEdit={() => setEditing(t)}
                      onDelete={() => handleDelete(t.id)}
                      disabled={actionLoading}
                    />
                  </View>
                  <Text style={styles.txDate}>{formatDisplayDate(t?.date)}</Text>
                  <Text style={[styles.txAmount, { color: isExpense ? SpendWiseTheme.danger : SpendWiseTheme.success }]}>
                    {formatCurrency(t?.convertedAmount !== undefined ? t.convertedAmount : t?.amount, userCurrency)}
                    {t?.currency && t.currency !== userCurrency ? (
                      <Text style={{ fontSize: 11, fontWeight: 'normal', color: SpendWiseTheme.muted }}>
                        {'\n'}(original {formatCurrency(t.amount, t.currency)})
                      </Text>
                    ) : null}
                  </Text>
                  <Text style={styles.txDesc}>{t?.description ?? '—'}</Text>
                </View>
              );
            })
          ) : (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No transactions found</Text>
              <Text style={styles.emptySubtitle}>Tap + to add a transaction.</Text>
            </View>
          )}
        </CardBody>
      </Card>

      <EditModal
        open={Boolean(editing)}
        initial={editing}
        onClose={() => setEditing(null)}
        onSave={handleSaveEdit}
        loading={actionLoading}
        userCurrency={userCurrency}
      />
    </ScreenContainer>
  );
}

function EditModal({
  open,
  initial,
  onClose,
  onSave,
  loading,
}: {
  open: boolean;
  initial: Transaction | null;
  onClose: () => void;
  onSave: (t: TransactionFormData & { id: string }) => Promise<void>;
  loading: boolean;
  userCurrency: string;
}) {
  const [form, setForm] = useState<TransactionFormData & { id: string } | null>(null);

  useEffect(() => {
    if (initial) {
      setForm({
        id: initial.id,
        amount: String(initial.amount ?? ''),
        category: initial.category ?? '',
        date: toDateInputValue(initial.date),
        description: initial.description ?? '',
        type: initial.type ?? 'EXPENSE',
        currency: initial.currency ?? 'INR',
      });
    } else {
      setForm(null);
    }
  }, [initial, open]);

  if (!open || !form) return null;

  return (
    <Modal visible={open} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.modalBackdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Edit transaction</Text>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <TransactionFormFields form={form} onChange={(f) => setForm({ ...form, ...f })} userCurrency={userCurrency} />
            <View style={styles.row}>
              <Button title="Cancel" variant="outline" onPress={onClose} disabled={loading} />
              <Button title="Save changes" onPress={() => onSave(form)} loading={loading} />
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: 100 },
  row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 8 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
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
  txCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: SpendWiseTheme.border,
    backgroundColor: '#FFFFFF',
    padding: 14,
    gap: 6,
  },
  txCardTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
  txHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, flexWrap: 'wrap' },
  txCategory: { fontSize: 15, fontWeight: '800', color: SpendWiseTheme.text },
  txDate: { fontSize: 12, color: '#94A3B8' },
  txAmount: { fontSize: 16, fontWeight: '800' },
  txDesc: { fontSize: 13, color: SpendWiseTheme.muted },
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.3)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: SpendWiseTheme.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '85%',
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: SpendWiseTheme.text, marginBottom: 12 },
});
