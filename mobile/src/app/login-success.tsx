import { useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useAuth } from '@/context/AuthContext';
import { SpendWiseTheme } from '@/constants/theme';

export default function LoginSuccessScreen() {
  const { token } = useLocalSearchParams<{ token?: string }>();
  const { signIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    async function handleLogin() {
      if (token) {
        try {
          await signIn(token);
          router.replace('/(app)/dashboard');
        } catch (e) {
          router.replace('/(auth)/login');
        }
      } else {
        router.replace('/(auth)/login');
      }
    }
    handleLogin();
  }, [token]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={SpendWiseTheme.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SpendWiseTheme.bg,
  },
});
