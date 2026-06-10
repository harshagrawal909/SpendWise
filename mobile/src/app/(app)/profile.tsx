import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Image, StyleSheet, Text, View } from 'react-native';

import { ScreenContainer } from '@/components/ScreenContainer';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader, CardSubtitle, CardTitle } from '@/components/ui/Card';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { SpendWiseTheme } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import API from '@/services/api';

type Profile = {
  name?: string;
  email?: string;
  provider?: 'local' | 'google';
  photoUrl?: string;
  emailVerified?: boolean;
  dateOfBirth?: string;
  createdAt?: string;
};

function formatDate(value?: string) {
  if (!value) return 'Not added';

  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(value));
}

export default function ProfileScreen() {
  const { email, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [passForm, setPassForm] = useState({ currentPassword: '', newPassword: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const displayEmail = profile?.email || email;
  const isGoogleUser = profile?.provider === 'google';
  const initial = (profile?.name || displayEmail || 'U').trim().charAt(0).toUpperCase();

  useEffect(() => {
    let mounted = true;

    API.get('/users/me')
      .then((res) => {
        if (mounted) setProfile(res.data);
      })
      .catch(() => {
        if (mounted) setProfile(null);
      })
      .finally(() => {
        if (mounted) setProfileLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const handleLogout = async () => {
    await signOut();
    router.replace('/(auth)/login');
  };

  const handleChangePassword = async () => {
    if (!passForm.currentPassword || !passForm.newPassword) return;
    setLoading(true);
    setMessage('');
    try {
      await API.put('/users/change-password', passForm);
      setMessage('Password updated successfully!');
      setPassForm({ currentPassword: '', newPassword: '' });
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      Alert.alert('Update failed', err?.response?.data?.message ?? 'Could not change password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer contentContainerStyle={styles.container}>
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardSubtitle>Account details & session</CardSubtitle>
        </CardHeader>
        <CardBody>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>SIGNED IN AS</Text>
            <Text style={styles.infoValue}>{displayEmail || '-'}</Text>
          </View>

          <Button title="Logout" variant="outline" onPress={handleLogout} />

          {profileLoading ? (
            <View style={styles.securityBox}>
              <Text style={styles.securityTitle}>Loading profile...</Text>
            </View>
          ) : isGoogleUser ? (
            <View style={styles.securityBox}>
              <View style={styles.googleHeader}>
                {profile?.photoUrl ? (
                  <Image source={{ uri: profile.photoUrl }} style={styles.avatarImage} />
                ) : (
                  <View style={styles.avatarFallback}>
                    <Text style={styles.avatarInitial}>{initial}</Text>
                  </View>
                )}

                <View style={styles.googleTitleBlock}>
                  <View style={styles.nameRow}>
                    <Text style={styles.googleName}>{profile?.name || 'Google user'}</Text>
                    {profile?.emailVerified ? <Badge label="Verified" variant="success" /> : null}
                  </View>
                  <Text style={styles.googleSubtext}>Signed in with Google</Text>
                </View>
              </View>

              <View style={styles.detailGrid}>
                <View style={styles.detailBox}>
                  <Text style={styles.infoLabel}>EMAIL</Text>
                  <Text style={styles.infoValue}>{displayEmail || '-'}</Text>
                </View>
                <View style={styles.detailBox}>
                  <Text style={styles.infoLabel}>DATE OF BIRTH</Text>
                  <Text style={styles.infoValue}>{formatDate(profile?.dateOfBirth)}</Text>
                </View>
                <View style={styles.detailBox}>
                  <Text style={styles.infoLabel}>ACCOUNT CREATED</Text>
                  <Text style={styles.infoValue}>{formatDate(profile?.createdAt)}</Text>
                </View>
                <View style={styles.detailBox}>
                  <Text style={styles.infoLabel}>LOGIN METHOD</Text>
                  <Text style={styles.infoValue}>Google</Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.securityBox}>
              <Text style={styles.securityTitle}>Security</Text>
              <PasswordInput
                label="Current Password"
                value={passForm.currentPassword}
                onChangeText={(v) => setPassForm({ ...passForm, currentPassword: v })}
              />
              <PasswordInput
                label="New Password"
                value={passForm.newPassword}
                onChangeText={(v) => setPassForm({ ...passForm, newPassword: v })}
              />
              {message ? <Text style={styles.success}>{message}</Text> : null}
              <Button title="Update Password" onPress={handleChangePassword} loading={loading} />
            </View>
          )}
        </CardBody>
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: 100 },
  infoBox: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: SpendWiseTheme.border,
    backgroundColor: '#F8FAFC',
    padding: 16,
    gap: 4,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: '#94A3B8',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '800',
    color: SpendWiseTheme.text,
  },
  securityBox: {
    marginTop: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: SpendWiseTheme.border,
    backgroundColor: SpendWiseTheme.surface,
    padding: 16,
    gap: 12,
  },
  securityTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: SpendWiseTheme.text,
  },
  googleHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  avatarImage: {
    borderRadius: 32,
    height: 64,
    width: 64,
  },
  avatarFallback: {
    alignItems: 'center',
    backgroundColor: '#E0E7FF',
    borderRadius: 32,
    height: 64,
    justifyContent: 'center',
    width: 64,
  },
  avatarInitial: {
    color: '#4338CA',
    fontSize: 22,
    fontWeight: '800',
  },
  googleTitleBlock: {
    flex: 1,
    gap: 4,
  },
  nameRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  googleName: {
    color: SpendWiseTheme.text,
    fontSize: 18,
    fontWeight: '800',
  },
  googleSubtext: {
    color: SpendWiseTheme.muted,
    fontSize: 13,
    fontWeight: '600',
  },
  detailGrid: {
    gap: 10,
  },
  detailBox: {
    backgroundColor: '#F8FAFC',
    borderColor: SpendWiseTheme.border,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
    padding: 12,
  },
  success: {
    fontSize: 13,
    color: SpendWiseTheme.success,
    fontWeight: '600',
  },
});
