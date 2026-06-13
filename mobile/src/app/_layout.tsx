import { useEffect, useState } from 'react';
import { Alert, Linking, Modal, View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { File, Paths } from 'expo-file-system';
import { getContentUriAsync } from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';

import { AuthProvider, useAuth } from '@/context/AuthContext';
import { SpendWiseTheme } from '@/constants/theme';
import { registerForPushNotificationsAsync } from '@/utils/pushNotifications';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

const CURRENT_VERSION_CODE = 5;

function RootLayoutNav() {
  const { isLoading, isAuthenticated } = useAuth();
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [installing, setInstalling] = useState(false);

  const startUpdateDownload = async (downloadUrl: string) => {
    setDownloading(true);
    setDownloadProgress(0);

    const filename = 'SpendWise-Update.apk';
    const file = new File(Paths.document, filename);

    try {
      // Clean up any existing update file first
      if (file.exists) {
        await file.delete();
      }

      const downloadTask = file.createDownloadTask(downloadUrl);
      
      downloadTask.onProgress((progress) => {
        const percent = progress.totalBytesWritten / progress.totalBytesExpectedToWrite;
        setDownloadProgress(Math.max(0, Math.min(1, percent)));
      });

      await downloadTask.downloadAsync();

      // Start install phase
      setDownloading(false);
      setInstalling(true);

      const contentUri = await getContentUriAsync(file.uri);
      await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
        data: contentUri,
        type: 'application/vnd.android.package-archive',
        flags: 1, // Intent.FLAG_GRANT_READ_URI_PERMISSION
      });

      setInstalling(false);
    } catch (error: any) {
      setDownloading(false);
      setInstalling(false);
      Alert.alert(
        'Update Failed',
        `An error occurred while downloading the update:\n${error.message || error}\n\nWould you like to try downloading via your browser instead?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open in Browser', onPress: () => Linking.openURL(downloadUrl) }
        ]
      );
    }
  };

  const checkAppUpdates = async () => {
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
                startUpdateDownload(downloadUrl);
              },
            },
          ],
          { cancelable: true }
        );
      }
    } catch (error) {
      console.log('Error checking updates:', error);
    }
  };

  useEffect(() => {
    // Hide the splash screen once auth state is resolved
    if (!isLoading) {
      SplashScreen.hideAsync();
      checkAppUpdates();
    }
  }, [isLoading]);

  // Register push notifications when authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      registerForPushNotificationsAsync();
    }
  }, [isLoading, isAuthenticated]);

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

      {/* Premium Download Progress Modal */}
      <Modal
        visible={downloading || installing}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {}}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {installing ? 'Installing Update' : 'Downloading Update'}
            </Text>
            
            {downloading ? (
              <>
                <Text style={styles.modalSubtitle}>
                  Please do not close the app while downloading the updates.
                </Text>
                
                {/* Progress bar container */}
                <View style={styles.progressContainer}>
                  <View style={styles.progressBarTrack}>
                    <View 
                      style={[
                        styles.progressBarActive, 
                        { width: `${downloadProgress * 100}%` }
                      ]} 
                    />
                  </View>
                  <Text style={styles.progressPercent}>
                    {Math.round(downloadProgress * 100)}%
                  </Text>
                </View>
                
                <Text style={styles.statusText}>
                  Downloading APK files...
                </Text>
              </>
            ) : (
              <>
                <ActivityIndicator size="large" color="rgb(79, 70, 229)" style={styles.loader} />
                <Text style={styles.modalSubtitle}>
                  Opening package installer... Please confirm the installation when prompted.
                </Text>
              </>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)', // Sleek dark slate translucent backdrop
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressBarTrack: {
    flex: 1,
    height: 8,
    backgroundColor: '#F1F5F9', // slate-100
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: 12,
  },
  progressBarActive: {
    height: '100%',
    backgroundColor: 'rgb(79, 70, 229)', // Indigo-600
    borderRadius: 4,
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: '700',
    color: 'rgb(79, 70, 229)',
    width: 38,
    textAlign: 'right',
  },
  statusText: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  loader: {
    marginVertical: 16,
  },
});

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
