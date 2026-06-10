import { ActivityIndicator, Pressable, StyleSheet, Text, type PressableProps } from 'react-native';

import { SpendWiseTheme } from '@/constants/theme';

type Variant = 'primary' | 'outline' | 'ghost' | 'danger';

type ButtonProps = PressableProps & {
  title: string;
  variant?: Variant;
  loading?: boolean;
};

const variantStyles: Record<Variant, { button: object; text: object; pressed: object }> = {
  primary: {
    button: { backgroundColor: SpendWiseTheme.primary },
    text: { color: '#FFFFFF' },
    pressed: { backgroundColor: SpendWiseTheme.primaryLight },
  },
  outline: {
    button: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: SpendWiseTheme.border },
    text: { color: SpendWiseTheme.text },
    pressed: { backgroundColor: '#F8FAFC' },
  },
  ghost: {
    button: { backgroundColor: 'transparent' },
    text: { color: SpendWiseTheme.muted },
    pressed: { backgroundColor: '#F1F5F9' },
  },
  danger: {
    button: { backgroundColor: SpendWiseTheme.danger },
    text: { color: '#FFFFFF' },
    pressed: { backgroundColor: '#EF4444' },
  },
};

export function Button({
  title,
  variant = 'primary',
  loading = false,
  disabled,
  style,
  ...props
}: ButtonProps) {
  const v = variantStyles[variant];

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        v.button,
        pressed && v.pressed,
        (disabled || loading) && styles.disabled,
        style,
      ]}
      {...props}>
      {loading ? (
        <ActivityIndicator color={variant === 'outline' || variant === 'ghost' ? SpendWiseTheme.primary : '#FFFFFF'} />
      ) : (
        <Text style={[styles.text, v.text]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.6,
  },
});
