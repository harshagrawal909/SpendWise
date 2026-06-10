import { StyleSheet, Text, View } from 'react-native';

type BadgeProps = {
  label: string;
  variant?: 'success' | 'danger' | 'neutral';
};

export function Badge({ label, variant = 'neutral' }: BadgeProps) {
  return (
    <View style={[styles.base, styles[variant]]}>
      <Text style={textStyles[variant]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  success: {
    backgroundColor: '#D1FAE5',
  },
  danger: {
    backgroundColor: '#FEE2E2',
  },
  neutral: {
    backgroundColor: '#E2E8F0',
  },
});

const textStyles = StyleSheet.create({
  success: { color: '#047857' },
  danger: { color: '#DC2626' },
  neutral: { color: '#475569' },
});
