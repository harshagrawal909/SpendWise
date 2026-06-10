import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { SpendWiseTheme } from '@/constants/theme';

type TransactionActionsProps = {
  onEdit?: () => void;
  onDelete: () => void;
  disabled?: boolean;
};

export function TransactionActions({ onEdit, onDelete, disabled }: TransactionActionsProps) {
  return (
    <View style={styles.row}>
      {onEdit ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Edit transaction"
          onPress={onEdit}
          disabled={disabled}
          style={({ pressed }) => [styles.btn, pressed && styles.pressed]}>
          <Ionicons name="create-outline" size={20} color={SpendWiseTheme.primary} />
        </Pressable>
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Delete transaction"
        onPress={onDelete}
        disabled={disabled}
        style={({ pressed }) => [styles.btn, styles.deleteBtn, pressed && styles.pressed]}>
        <Ionicons name="trash-outline" size={20} color={SpendWiseTheme.danger} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  btn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
  },
  deleteBtn: { backgroundColor: '#FEF2F2' },
  pressed: { opacity: 0.7 },
});
