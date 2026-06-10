import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { SpendWiseTheme } from '@/constants/theme';
import { formatDisplayDate, toDateInputValue, toLocalDateString } from '@/utils/format';

type DatePickerFieldProps = {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maximumDate?: Date;
  minimumDate?: Date;
};

function parseLocalDate(value: string) {
  const input = toDateInputValue(value);
  if (input) {
    const [y, m, d] = input.split('-').map(Number);
    const local = new Date(y, m - 1, d);
    if (!Number.isNaN(local.getTime())) return local;
  }
  return new Date();
}

export function DatePickerField({
  label,
  value,
  onChange,
  placeholder = 'Select date',
  maximumDate = new Date(),
  minimumDate,
}: DatePickerFieldProps) {
  const [open, setOpen] = useState(false);
  const display = value ? formatDisplayDate(value) : '';

  const onPickerChange = (_event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') setOpen(false);
    if (date) onChange(toLocalDateString(date));
  };

  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <Pressable style={styles.field} onPress={() => setOpen(true)}>
        <Text style={[styles.value, !display && styles.placeholder]}>{display || placeholder}</Text>
        <Ionicons name="calendar-outline" size={20} color={SpendWiseTheme.muted} />
      </Pressable>
      {open ? (
        <DateTimePicker
          value={parseLocalDate(value)}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          maximumDate={maximumDate}
          minimumDate={minimumDate}
          onChange={onPickerChange}
        />
      ) : null}
      {open && Platform.OS === 'ios' ? (
        <Pressable style={styles.doneBtn} onPress={() => setOpen(false)}>
          <Text style={styles.doneText}>Done</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: SpendWiseTheme.muted },
  field: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: SpendWiseTheme.border,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  value: { fontSize: 15, color: SpendWiseTheme.text },
  placeholder: { color: '#94A3B8' },
  doneBtn: { alignSelf: 'flex-end', paddingVertical: 4 },
  doneText: { color: SpendWiseTheme.primary, fontWeight: '600', fontSize: 15 },
});
