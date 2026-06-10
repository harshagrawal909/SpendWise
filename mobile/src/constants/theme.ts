import { Platform } from 'react-native';

/** SpendWise design tokens — mirrors frontend/src/index.css */
export const SpendWiseTheme = {
  bg: '#FFFBEB',
  surface: '#FFFDF4',
  surface2: '#FEF3C7',
  border: '#E2E8F0',
  text: '#0F172A',
  muted: '#475569',
  primary: '#4F46E5',
  primaryLight: '#6366F1',
  danger: '#DC2626',
  success: '#047857',
  radius: 16,
  shadow: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 2,
  },
} as const;

export const PIE_COLORS = [
  '#4f46e5',
  '#0ea5e9',
  '#22c55e',
  '#f59e0b',
  '#ef4444',
  '#a855f7',
  '#14b8a6',
  '#64748b',
] as const;

export const Colors = {
  light: {
    text: SpendWiseTheme.text,
    background: SpendWiseTheme.bg,
    backgroundElement: SpendWiseTheme.surface2,
    backgroundSelected: '#E0E7FF',
    textSecondary: SpendWiseTheme.muted,
    surface: SpendWiseTheme.surface,
    primary: SpendWiseTheme.primary,
    danger: SpendWiseTheme.danger,
    success: SpendWiseTheme.success,
    border: SpendWiseTheme.border,
  },
  dark: {
    text: '#F8FAFC',
    background: '#0F172A',
    backgroundElement: '#1E293B',
    backgroundSelected: '#312E81',
    textSecondary: '#94A3B8',
    surface: '#1E293B',
    primary: SpendWiseTheme.primaryLight,
    danger: '#F87171',
    success: '#34D399',
    border: '#334155',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
