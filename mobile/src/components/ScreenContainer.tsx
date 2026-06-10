import { ScrollView, StyleSheet, View, type ScrollViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SpendWiseTheme } from '@/constants/theme';

type ScreenContainerProps = ScrollViewProps & {
  children: React.ReactNode;
  scroll?: boolean;
};

export function ScreenContainer({ children, scroll = true, contentContainerStyle, ...props }: ScreenContainerProps) {
  if (!scroll) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.content}>{children}</View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
        {...props}>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: SpendWiseTheme.bg,
  },
  content: {
    flex: 1,
    padding: 16,
    gap: 16,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 32,
  },
});
