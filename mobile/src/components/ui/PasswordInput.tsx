import { Ionicons } from '@expo/vector-icons';
import { forwardRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { SpendWiseTheme } from '@/constants/theme';

type PasswordInputProps = Omit<TextInputProps, 'secureTextEntry'> & {
  label?: string;
  error?: string;
};

export const PasswordInput = forwardRef<TextInput, PasswordInputProps>(function PasswordInput(
  { label, error, style, ...props },
  ref,
) {
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.inputRow, error && styles.inputError]}>
        <TextInput
          ref={ref}
          placeholderTextColor="#94A3B8"
          style={[styles.input, style]}
          secureTextEntry={!visible}
          {...props}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={visible ? 'Hide password' : 'Show password'}
          onPress={() => setVisible((v) => !v)}
          hitSlop={8}
          style={styles.eyeBtn}>
          <Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={20} color={SpendWiseTheme.muted} />
        </Pressable>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: SpendWiseTheme.muted },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    borderWidth: 1,
    borderColor: SpendWiseTheme.border,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    paddingRight: 8,
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: SpendWiseTheme.text,
  },
  eyeBtn: { padding: 8 },
  inputError: { borderColor: '#FECACA' },
  error: { fontSize: 12, color: SpendWiseTheme.danger },
});
