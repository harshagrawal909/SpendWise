import { Link, router } from 'expo-router';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ScreenContainer } from '@/components/ScreenContainer';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader, CardSubtitle, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { SpendWiseTheme } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import API from '@/services/api';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const passwordRef = useRef<TextInput>(null);
  const webUrl = process.env.EXPO_PUBLIC_WEB_URL;

  const handleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await API.post('/auth/login', { email, password });
      await signIn(res.data.token);
      router.replace('/(app)/dashboard');
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err?.response?.data?.message ?? 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!webUrl) {
      setError('Google sign-in is not configured for this build.');
      return;
    }

    setError('');
    setGoogleLoading(true);
    try {
      // Use the HTTPS /app-auth URL as redirect URI so Chrome Custom Tab
      // intercepts the navigation BEFORE the page loads — no error flash, no dialog
      const redirectUri = `${webUrl}/app-auth`;
      const authUrl = `${webUrl}/login?redirect_uri=${encodeURIComponent(redirectUri)}`;

      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

      if (result.type === 'success' && result.url) {
        // Parse token from HTTPS URL query params
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
              <Text style={styles.badgeText}>SpendWise</Text>
            </View>
            <Text style={styles.heading}>Track expenses, see insights, and stay in control.</Text>
            <Text style={styles.subheading}>
              A clean dashboard for income/expense balance, category distribution, and monthly trends.
            </Text>
          </View>

          <Card>
            <CardHeader>
              <CardTitle>Welcome back</CardTitle>
              <CardSubtitle>Sign in to continue to your dashboard.</CardSubtitle>
            </CardHeader>
            <CardBody>
              <Input
                label="Email"
                placeholder="you@example.com"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                returnKeyType="next"
                blurOnSubmit={false}
                onSubmitEditing={() => passwordRef.current?.focus()}
              />
              <PasswordInput
                ref={passwordRef}
                label="Password"
                placeholder="Your password"
                value={password}
                onChangeText={setPassword}
                autoComplete="password"
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <Button title={loading ? 'Signing in...' : 'Sign in'} onPress={handleLogin} loading={loading} />

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              <Button
                title={googleLoading ? 'Signing in with Google...' : 'Sign in with Google'}
                variant="outline"
                onPress={handleGoogleLogin}
                loading={googleLoading}
                disabled={googleLoading}
              />

              <Text style={styles.footer}>
                Don&apos;t have an account?{' '}
                <Link href="/(auth)/signup" style={styles.link}>
                  Create one
                </Link>
              </Text>
            </CardBody>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { flexGrow: 1 },
  inner: { flexGrow: 1, paddingBottom: 40 },
  hero: { gap: 12, marginBottom: 8 },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: SpendWiseTheme.border,
    backgroundColor: 'rgba(255,255,255,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  badgeText: { fontSize: 12, fontWeight: '600', color: SpendWiseTheme.muted },
  heading: { fontSize: 28, fontWeight: '800', color: SpendWiseTheme.text, lineHeight: 34 },
  subheading: { fontSize: 14, color: SpendWiseTheme.muted, lineHeight: 22 },
  error: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
    color: '#B91C1C',
    padding: 10,
    fontSize: 13,
  },
  divider: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  dividerLine: {
    backgroundColor: SpendWiseTheme.border,
    flex: 1,
    height: 1,
  },
  dividerText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  footer: { fontSize: 14, color: SpendWiseTheme.muted, textAlign: 'center' },
  link: { color: '#4338CA', fontWeight: '600' },
});
