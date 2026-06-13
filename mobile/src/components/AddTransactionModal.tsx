import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { TransactionFormFields, type TransactionFormData } from '@/components/TransactionFormFields';
import { Button } from '@/components/ui/Button';
import { useTransactionRefresh } from '@/context/TransactionRefreshContext';
import { createTransaction } from '@/services/transactionService';
import { SpendWiseTheme } from '@/constants/theme';
import { todayInputValue } from '@/utils/format';
import API from '@/services/api';

const emptyForm = (defaultCurrency = 'INR'): TransactionFormData => ({
  amount: '',
  category: '',
  date: todayInputValue(),
  description: '',
  type: 'EXPENSE',
  currency: defaultCurrency,
});

export function AddTransactionModal() {
  const { isAddModalOpen, closeAddModal, notifyTransactionChange } = useTransactionRefresh();
  const [userCurrency, setUserCurrency] = useState('INR');
  const [form, setForm] = useState<TransactionFormData>(emptyForm('INR'));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAddModalOpen) {
      setError('');
      setLoading(true);
      API.get('/users/me')
        .then((res) => {
          const uCurr = res.data?.currency || 'INR';
          setUserCurrency(uCurr);
          setForm(emptyForm(uCurr));
        })
        .catch(() => {
          setUserCurrency('INR');
          setForm(emptyForm('INR'));
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isAddModalOpen]);

  const handleSave = async () => {
    setError('');
    setLoading(true);
    try {
      await createTransaction({
        ...form,
        type: form.type as 'EXPENSE' | 'INCOME',
        currency: form.currency || userCurrency,
      });
      notifyTransactionChange();
      closeAddModal();
    } catch (e: unknown) {
      console.error('Error in AddTransactionModal handleSave:', e);
      const err = e as { message?: string };
      setError(err?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={isAddModalOpen} animationType="slide" transparent onRequestClose={closeAddModal}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>Add transaction</Text>
          <Text style={styles.subtitle}>Record a new income or expense</Text>

          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <TransactionFormFields form={form} onChange={setForm} userCurrency={userCurrency} />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <View style={styles.actions}>
              <Button title="Cancel" variant="outline" onPress={closeAddModal} disabled={loading} />
              <Button title={loading ? 'Saving…' : 'Save'} onPress={handleSave} loading={loading} />
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15,23,42,0.35)',
  },
  sheet: {
    backgroundColor: SpendWiseTheme.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 28,
    paddingTop: 12,
    maxHeight: '90%',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 999,
    backgroundColor: SpendWiseTheme.border,
    marginBottom: 16,
  },
  title: { fontSize: 20, fontWeight: '800', color: SpendWiseTheme.text },
  subtitle: { fontSize: 13, color: SpendWiseTheme.muted, marginBottom: 16, marginTop: 4 },
  error: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
    color: '#B91C1C',
    padding: 10,
    fontSize: 13,
  },
  actions: { flexDirection: 'row', gap: 10, marginTop: 16 },
});
