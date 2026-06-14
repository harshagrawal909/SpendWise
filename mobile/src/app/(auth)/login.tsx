import { router } from 'expo-router';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ScreenContainer } from '@/components/ScreenContainer';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader, CardSubtitle, CardTitle } from '@/components/ui/Card';
import { SpendWiseTheme } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const webUrl = process.env.EXPO_PUBLIC_WEB_URL;

  const handleGoogleLogin = async () => {
    if (!webUrl) {
      setError('Google sign-in is not configured for this build.');
      return;
    }

    setError('');
    setGoogleLoading(true);
    try {
      const redirectUri = `${webUrl}/app-auth`;
      const authUrl = `${webUrl}/login?redirect_uri=${encodeURIComponent(redirectUri)}`;

      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

      if (result.type === 'success' && result.url) {
        const parsed = Linking.parse(result.url);
        const token = parsed.queryParams?.token;
        if (token) {
          await signIn(token as string);
          router.replace('/(app)/dashboard');
        } else {
          setError('Authentication succeeded, but no token was returned.');
          setGoogleLoading(false);
        }
      } else {
        setGoogleLoading(false);
      }
    } catch (err) {
      setGoogleLoading(false);
      setError('Google sign-in failed. Please try again.');
    }
  };

  return (
    <ScreenContainer contentContainerStyle={styles.scroll}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
        style={styles.flex}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.inner}>
          
          <View style={styles.hero}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>⚡ SPENDWISE v1.6.0</Text>
            </View>
            <Text style={styles.heading}>Financial clarity in your pocket.</Text>
            <Text style={styles.subheading}>
              Track multiple world currencies, view detailed hot-red analytics, export native spreadsheets, and chat with admins directly.
            </Text>
          </View>

          {/* Feature Cards Deck */}
          <View style={styles.featuresContainer}>
            <View style={styles.featureCard}>
              <Ionicons name="globe-outline" size={24} color={SpendWiseTheme.primary} style={styles.featureIcon} />
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>160+ Currencies</Text>
                <Text style={styles.featureDesc}>Automatic conversion to your home currency using real-time API rates.</Text>
              </View>
            </View>

            <View style={styles.featureCard}>
              <Ionicons name="bar-chart-outline" size={24} color="#F43F5E" style={styles.featureIcon} />
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Vibrant Red Analytics</Text>
                <Text style={styles.featureDesc}>Visual breakdowns of incomes, expenses, categories, and monthly trends.</Text>
              </View>
            </View>

            <View style={styles.featureCard}>
              <Ionicons name="document-text-outline" size={24} color="#10B981" style={styles.featureIcon} />
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Excel Exports</Text>
                <Text style={styles.featureDesc}>Download genuine Excel sheets (.xlsx) directly to your device Downloads folder.</Text>
              </View>
            </View>

            <View style={styles.featureCard}>
              <Ionicons name="chatbubble-ellipses-outline" size={24} color="#F59E0B" style={styles.featureIcon} />
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Admin Resolution Alerts</Text>
                <Text style={styles.featureDesc}>Direct communication with system admins with instant push and email response alerts.</Text>
              </View>
            </View>
          </View>

          {/* Login Card */}
          <Card style={styles.loginCard}>
            <CardHeader>
              <CardTitle>Get Started</CardTitle>
              <CardSubtitle>Authenticate securely with your Google account.</CardSubtitle>
            </CardHeader>
            <CardBody style={{ gap: 16 }}>
              {error ? <Text style={styles.error}>{error}</Text> : null}

              <Button
                title={googleLoading ? 'Signing in with Google...' : 'Sign in with Google'}
                onPress={handleGoogleLogin}
                loading={googleLoading}
                disabled={googleLoading}
                style={styles.googleBtn}
              />
            </CardBody>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { flexGrow: 1, backgroundColor: '#FAFAFA' },
  inner: { flexGrow: 1, padding: 24, paddingBottom: 48 },
  hero: { gap: 10, marginBottom: 24 },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#E0E7FF',
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  badgeText: { fontSize: 10, fontWeight: '800', color: SpendWiseTheme.primary, letterSpacing: 0.5 },
  heading: { fontSize: 32, fontWeight: '900', color: '#1E293B', lineHeight: 38 },
  subheading: { fontSize: 14, color: '#64748B', lineHeight: 22, fontWeight: '500' },
  featuresContainer: { gap: 12, marginBottom: 28 },
  featureCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
    alignItems: 'center',
  },
  featureIcon: { marginRight: 16 },
  featureContent: { flex: 1 },
  featureTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A', marginBottom: 2 },
  featureDesc: { fontSize: 12, color: '#64748B', lineHeight: 17, fontWeight: '500' },
  loginCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    padding: 8,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 4,
  },
  loginCardHeader: { paddingBottom: 8 },
  loginCardTitle: { fontSize: 20, fontWeight: '900', color: '#0F172A' },
  loginCardSubtitle: { fontSize: 13, color: '#64748B', marginTop: 2 },
  googleBtn: {
    backgroundColor: SpendWiseTheme.primary,
    borderRadius: 16,
    height: 52,
    justifyContent: 'center',
    shadowColor: SpendWiseTheme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 3,
  },
  error: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    backgroundColor: '#FEF2F2',
    color: '#EF4444',
    padding: 14,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
});
