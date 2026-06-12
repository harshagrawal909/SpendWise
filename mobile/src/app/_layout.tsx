import { useEffect } from 'react';
import { Alert, Linking } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';

import { AuthProvider, useAuth } from '@/context/AuthContext';
import { SpendWiseTheme } from '@/constants/theme';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

const CURRENT_VERSION_CODE = 1;

async function checkAppUpdates() {
  const webUrl = process.env.EXPO_PUBLIC_WEB_URL;
  if (!webUrl) return;

  try {
    const response = await fetch(`${webUrl}/version.json`);
    const data = await response.json();

    if (data && data.versionCode > CURRENT_VERSION_CODE) {
      Alert.alert(
        'Update Available',
        `A new version of SpendWise (${data.versionName}) is available.\n\nWhat's new:\n${data.releaseNotes || 'Bug fixes and improvements'}`,
        [
          { text: 'Maybe Later', style: 'cancel' },
          {
            text: 'Update Now',
            onPress: () => {
              const downloadUrl = data.apkUrl.startsWith('http')
                ? data.apkUrl
                : `${webUrl}${data.apkUrl}`;
              Linking.openURL(downloadUrl);
            },
          },
        ],
        { cancelable: true }
      );
    }
  } catch (error) {
    console.log('Error checking updates:', error);
  }
}

function RootLayoutNav() {
  const { isLoading } = useAuth();

  useEffect(() => {
    // Hide the splash screen once auth state is resolved
    if (!isLoading) {
      SplashScreen.hideAsync();
      checkAppUpdates();
    }
  }, [isLoading]);

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: SpendWiseTheme.bg },
        }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
