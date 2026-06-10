import { Link, router } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
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
import { useAuth } from '@/context/AuthContext';
import API from '@/services/api';
import { SpendWiseTheme } from '@/constants/theme';

export default function SignupScreen() {
  const { signIn } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const passwordError = useMemo(() => {
    if (!confirmPassword) return '';
    if (password !== confirmPassword) return 'Passwords do not match.';
    return '';
  }, [password, confirmPassword]);

  const handleSignup = async () => {
    if (passwordError) return;
    setError('');
    setLoading(true);
    try {
      await API.post('/auth/register', { name, email, password });
      const loginRes = await API.post('/auth/login', { email, password });
      await signIn(loginRes.data.token);
      router.replace('/(app)/dashboard');
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string; error?: string } } };
      setError(err?.response?.data?.message ?? err?.response?.data?.error ?? 'Signup failed. Try a different email.');
    } finally {
      setLoading(false);
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
            <Text style={styles.heading}>Create your account and start tracking today.</Text>
            <Text style={styles.subheading}>
              Signup takes under a minute. You&apos;ll get the full dashboard with summaries, charts, and
              transaction history.
            </Text>
          </View>

          <Card>
            <CardHeader>
              <CardTitle>Create account</CardTitle>
              <CardSubtitle>Use your email and a password to sign up.</CardSubtitle>
            </CardHeader>
            <CardBody>
              <Input
                label="Name"
                placeholder="Your name"
                value={name}
                onChangeText={setName}
                autoComplete="name"
                returnKeyType="next"
                blurOnSubmit={false}
                onSubmitEditing={() => emailRef.current?.focus()}
              />
              <Input
                ref={emailRef}
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
                placeholder="Create a password"
                value={password}
                onChangeText={setPassword}
                autoComplete="new-password"
                returnKeyType="next"
                blurOnSubmit={false}
                onSubmitEditing={() => confirmRef.current?.focus()}
              />
              <PasswordInput
                ref={confirmRef}
                label="Confirm password"
                placeholder="Repeat your password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                autoComplete="new-password"
                returnKeyType="done"
                onSubmitEditing={handleSignup}
                error={passwordError}
              />

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <Button
                title={loading ? 'Creating…' : 'Create account'}
                onPress={handleSignup}
                loading={loading}
                disabled={Boolean(passwordError)}
              />

              <Text style={styles.footer}>
                Already have an account?{' '}
                <Link href="/(auth)/login" style={styles.link}>
                  Sign in
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
  footer: { fontSize: 14, color: SpendWiseTheme.muted, textAlign: 'center' },
  link: { color: '#4338CA', fontWeight: '600' },
});
