import { StyleSheet, Text, View, type ViewProps } from 'react-native';

import { SpendWiseTheme } from '@/constants/theme';

export function Card({ style, children, ...props }: ViewProps) {
  return (
    <View style={[styles.card, style]} {...props}>
      {children}
    </View>
  );
}

export function CardHeader({ children }: { children: React.ReactNode }) {
  return <View style={styles.header}>{children}</View>;
}

export function CardTitle({ children }: { children: React.ReactNode }) {
  return <Text style={styles.title}>{children}</Text>;
}

export function CardSubtitle({ children }: { children: React.ReactNode }) {
  return <Text style={styles.subtitle}>{children}</Text>;
}

export function CardBody({ children, style }: { children: React.ReactNode; style?: object }) {
  return <View style={[styles.body, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: SpendWiseTheme.radius,
    borderWidth: 1,
    borderColor: SpendWiseTheme.border,
    backgroundColor: SpendWiseTheme.surface,
    ...SpendWiseTheme.shadow,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 8,
    gap: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: SpendWiseTheme.text,
  },
  subtitle: {
    fontSize: 13,
    color: SpendWiseTheme.muted,
  },
  body: {
    paddingHorizontal: 20,
    paddingBottom: 18,
    gap: 12,
  },
});
