import { Picker } from '@react-native-picker/picker';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { SpendWiseTheme } from '@/constants/theme';

type Option = { label: string; value: string };

type SelectProps = {
  label?: string;
  value: string;
  onValueChange: (value: string) => void;
  options: Option[];
};

export function Select({ label, value, onValueChange, options }: SelectProps) {
  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.pickerWrap}>
        <Picker
          selectedValue={value}
          onValueChange={onValueChange}
          style={styles.picker}
          dropdownIconColor={SpendWiseTheme.muted}>
          {options.map((opt) => (
            <Picker.Item key={opt.value} label={opt.label} value={opt.value} />
          ))}
        </Picker>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: SpendWiseTheme.muted,
  },
  pickerWrap: {
    borderWidth: 1,
    borderColor: SpendWiseTheme.border,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    minHeight: 44,
    justifyContent: 'center',
  },
  picker: {
    color: SpendWiseTheme.text,
    ...(Platform.OS === 'ios' ? { height: 140 } : {}),
  },
});
