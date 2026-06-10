import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTransactionRefresh } from '@/context/TransactionRefreshContext';
import { SpendWiseTheme } from '@/constants/theme';

export function FloatingAddButton() {
  const { openAddModal } = useTransactionRefresh();
  const insets = useSafeAreaInsets();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Add transaction"
      onPress={openAddModal}
      style={({ pressed }) => [
        styles.fab,
        { bottom: insets.bottom + 72 },
        pressed && styles.fabPressed,
      ]}>
      <Ionicons name="add" size={28} color="#FFFFFF" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: SpendWiseTheme.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: SpendWiseTheme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 100,
  },
  fabPressed: {
    backgroundColor: SpendWiseTheme.primaryLight,
    transform: [{ scale: 0.96 }],
  },
});
