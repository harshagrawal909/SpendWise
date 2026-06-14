import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';

import { AddTransactionModal } from '@/components/AddTransactionModal';
import { FloatingAddButton } from '@/components/FloatingAddButton';
import { useAuth } from '@/context/AuthContext';
import { TransactionRefreshProvider } from '@/context/TransactionRefreshContext';
import { SpendWiseTheme } from '@/constants/theme';

function AppTabs() {
  return (
    <View style={styles.container}>
      <Tabs
        screenOptions={{
          headerShown: false,
          headerStyle: { backgroundColor: SpendWiseTheme.surface },
          headerTitleStyle: { fontWeight: '800', color: SpendWiseTheme.text },
          headerShadowVisible: false,
          tabBarActiveTintColor: SpendWiseTheme.primary,
          tabBarInactiveTintColor: SpendWiseTheme.muted,
          tabBarStyle: {
            backgroundColor: SpendWiseTheme.surface,
            borderTopColor: SpendWiseTheme.border,
          },
          sceneStyle: { backgroundColor: SpendWiseTheme.bg },
        }}>
        <Tabs.Screen
          name="dashboard"
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ color, size }) => <Ionicons name="grid-outline" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="expenses"
          options={{
            title: 'Expenses',
            tabBarIcon: ({ color, size }) => <Ionicons name="wallet-outline" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="analytics"
          options={{
            title: 'Analytics',
            tabBarIcon: ({ color, size }) => <Ionicons name="bar-chart-outline" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="excel"
          options={{
            title: 'Export',
            tabBarIcon: ({ color, size }) => <Ionicons name="download-outline" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
          }}
        />
      </Tabs>
      <FloatingAddButton />
      <AddTransactionModal />
    </View>
  );
}

export default function AppLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  if (!isLoading && !isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <TransactionRefreshProvider>
      <AppTabs />
    </TransactionRefreshProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
