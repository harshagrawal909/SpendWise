import { forwardRef } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { SpendWiseTheme } from '@/constants/theme';

type InputProps = TextInputProps & {
  label?: string;
  error?: string;
};

export const Input = forwardRef<TextInput, InputProps>(function Input(
  { label, error, style, ...props },
  ref,
) {
  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        ref={ref}
        placeholderTextColor="#94A3B8"
        style={[styles.input, error && styles.inputError, style]}
        {...props}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: SpendWiseTheme.muted },
  input: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: SpendWiseTheme.border,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: SpendWiseTheme.text,
  },
  inputError: { borderColor: '#FECACA' },
  error: { fontSize: 12, color: SpendWiseTheme.danger },
});
