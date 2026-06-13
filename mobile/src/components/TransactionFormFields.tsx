import { StyleSheet, View } from 'react-native';

import { Input } from '@/components/ui/Input';
import { DatePickerField } from '@/components/ui/DatePickerField';
import { Select } from '@/components/ui/Select';

import { SUPPORTED_CURRENCIES } from '@/utils/currency';

export type TransactionFormData = {
  amount: string;
  category: string;
  date: string;
  description: string;
  type: string;
  currency?: string;
};

type TransactionFormFieldsProps = {
  form: TransactionFormData;
  onChange: (form: TransactionFormData) => void;
  userCurrency?: string;
};

export function TransactionFormFields({ form, onChange, userCurrency }: TransactionFormFieldsProps) {
  return (
    <View style={styles.wrap}>
      <Input
        label="Amount"
        placeholder="e.g. 499"
        value={form.amount}
        onChangeText={(v) => onChange({ ...form, amount: v })}
        keyboardType="decimal-pad"
      />
      <Select
        label="Currency"
        value={form.currency || userCurrency || 'INR'}
        onValueChange={(v) => onChange({ ...form, currency: v })}
        options={SUPPORTED_CURRENCIES.map((c) => ({ label: c.name, value: c.code }))}
      />
      <Input
        label="Category"
        placeholder="e.g. Food, Rent, Salary"
        value={form.category}
        onChangeText={(v) => onChange({ ...form, category: v })}
      />
      <DatePickerField label="Date" value={form.date} onChange={(v) => onChange({ ...form, date: v })} />
      <Select
        label="Type"
        value={form.type}
        onValueChange={(v) => onChange({ ...form, type: v })}
        options={[
          { label: 'Expense', value: 'EXPENSE' },
          { label: 'Income', value: 'INCOME' },
        ]}
      />
      <Input
        label="Description"
        placeholder="Optional notes"
        value={form.description}
        onChangeText={(v) => onChange({ ...form, description: v })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
});
