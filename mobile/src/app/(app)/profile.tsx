import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Image, StyleSheet, Text, View, Modal, ScrollView, TouchableOpacity } from 'react-native';

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

  // Legal Modals State
  const [termsVisible, setTermsVisible] = useState(false);
  const [privacyVisible, setPrivacyVisible] = useState(false);

  // Delete Account State
  const [deleteStep, setDeleteStep] = useState(0); // 0=idle, 1=confirm
  const [deleteLoading, setDeleteLoading] = useState(false);

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

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    try {
      await API.delete('/users/me');
      await signOut();
      router.replace('/(auth)/login');
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      Alert.alert('Deletion failed', err?.response?.data?.message ?? 'Could not delete account. Please try again.');
      setDeleteStep(0);
    } finally {
      setDeleteLoading(false);
    }
  };

  const termsContent = (
    <View style={styles.legalContent}>
      <Text style={styles.legalLastUpdated}>Last updated: June 2025</Text>
      
      <Text style={styles.legalSectionTitle}>1. Acceptance of Terms</Text>
      <Text style={styles.legalText}>
        By accessing or using SpendWise (the "Service"), you agree to be bound by these Terms of Service. If you do not agree, please do not use the Service. These terms are governed by the laws of India.
      </Text>

      <Text style={styles.legalSectionTitle}>2. Eligibility</Text>
      <Text style={styles.legalText}>
        You must be at least 13 years of age to use SpendWise. By using the Service, you represent that you meet this requirement. If you are under 18, please ensure you have parental consent.
      </Text>

      <Text style={styles.legalSectionTitle}>3. Description of Service</Text>
      <Text style={styles.legalText}>
        SpendWise is a personal expense and income tracking tool. It allows you to record financial transactions, view analytics, and sync data across devices. The Service is provided free of charge.
      </Text>

      <Text style={styles.legalSectionTitle}>4. Your Account</Text>
      <Text style={styles.legalText}>
        • You are responsible for maintaining the confidentiality of your account credentials.{"\n"}
        • You are responsible for all activity that occurs under your account.{"\n"}
        • You must notify us immediately at harshagrawal4256@gmail.com if you suspect unauthorised access.{"\n"}
        • One person may not maintain multiple accounts.
      </Text>

      <Text style={styles.legalSectionTitle}>5. Acceptable Use</Text>
      <Text style={styles.legalText}>
        You agree not to use the Service for any unlawful purpose, attempt to gain unauthorised access, reverse-engineer the Service, or upload malicious code or scripts.
      </Text>

      <Text style={styles.legalSectionTitle}>6. No Financial Advice</Text>
      <Text style={styles.legalText}>
        SpendWise is a personal tracking tool only. Nothing in the Service constitutes financial, investment, tax, or legal advice. You should consult a qualified professional before making any financial decisions.
      </Text>

      <Text style={styles.legalSectionTitle}>7. Limitation of Liability</Text>
      <Text style={styles.legalText}>
        To the maximum extent permitted by applicable law, SpendWise and its developers shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Service.
      </Text>

      <Text style={styles.legalSectionTitle}>8. Contact</Text>
      <Text style={styles.legalText}>
        Questions about these Terms? Email us at harshagrawal4256@gmail.com.
      </Text>
    </View>
  );

  const privacyContent = (
    <View style={styles.legalContent}>
      <Text style={styles.legalLastUpdated}>Last updated: June 2025</Text>
      
      <Text style={styles.legalSectionTitle}>1. Who We Are</Text>
      <Text style={styles.legalText}>
        SpendWise is a personal finance tracking application developed by Harsh Agrawal. We are based in India and operate under the Information Technology Act, 2000 and applicable Indian data protection laws.
      </Text>

      <Text style={styles.legalSectionTitle}>2. What We Collect</Text>
      <Text style={styles.legalText}>
        • Account information: Your email address and name (provided via email sign-up or Google Sign-In).{"\n"}
        • Financial data: Expense and income records you manually enter into the app.{"\n"}
        • Profile photo: Only if signing in with Google.
      </Text>

      <Text style={styles.legalSectionTitle}>3. What We Do NOT Collect</Text>
      <Text style={styles.legalText}>
        • Payment card or banking credentials.{"\n"}
        • Device location or GPS data.{"\n"}
        • Contacts or call logs.{"\n"}
        • Analytics tracking data (no trackers).
      </Text>

      <Text style={styles.legalSectionTitle}>4. Google Sign-In</Text>
      <Text style={styles.legalText}>
        SpendWise uses Google OAuth 2.0 for authentication. We access only your email address and display name. We do not access other Google services.
      </Text>

      <Text style={styles.legalSectionTitle}>5. Data Security</Text>
      <Text style={styles.legalText}>
        Your data is stored on secure cloud servers. We use HTTPS/TLS encryption and JWT-based authentication to protect your information.
      </Text>

      <Text style={styles.legalSectionTitle}>6. Your Rights & Deletion</Text>
      <Text style={styles.legalText}>
        You can view all your data within the app. You can permanently delete your account and all associated data from the Profile page at any time. All data is deleted within 24 hours.
      </Text>

      <Text style={styles.legalSectionTitle}>7. Contact</Text>
      <Text style={styles.legalText}>
        For privacy-related questions, email us at harshagrawal4256@gmail.com.
      </Text>
    </View>
  );

  const renderLegalModal = (
    visible: boolean,
    setVisible: (v: boolean) => void,
    title: string,
    content: React.ReactNode
  ) => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={() => setVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={() => setVisible(false)} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={true}>
            {content}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

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

      {/* Legal & Policies */}
      <Card style={{ marginTop: 16 }}>
        <CardHeader>
          <CardTitle>Legal & Policies</CardTitle>
          <CardSubtitle>SpendWise terms, agreements & data privacy</CardSubtitle>
        </CardHeader>
        <CardBody style={{ gap: 12 }}>
          <Button
            title="Terms of Service"
            variant="outline"
            onPress={() => setTermsVisible(true)}
          />
          <Button
            title="Privacy Policy"
            variant="outline"
            onPress={() => setPrivacyVisible(true)}
          />
        </CardBody>
      </Card>

      {/* Danger Zone */}
      <Card style={{ marginTop: 16, borderColor: '#FCA5A5', backgroundColor: '#FEF2F2' }}>
        <CardHeader>
          <CardTitle><Text style={{ color: '#991B1B' }}>Danger Zone</Text></CardTitle>
          <CardSubtitle>Permanently delete your profile and financial records</CardSubtitle>
        </CardHeader>
        <CardBody>
          <Text style={styles.dangerText}>
            Permanently delete your account and all expense data. This action cannot be undone.
          </Text>
          {deleteStep === 0 ? (
            <Button
              title="Delete Account"
              variant="danger"
              onPress={() => setDeleteStep(1)}
              style={{ marginTop: 12 }}
            />
          ) : (
            <View style={{ gap: 12, marginTop: 12 }}>
              <Text style={styles.confirmText}>Are you sure? This is permanent.</Text>
              <View style={styles.confirmButtons}>
                <Button
                  title="Yes, delete everything"
                  variant="danger"
                  onPress={handleDeleteAccount}
                  loading={deleteLoading}
                  style={{ flex: 1 }}
                />
                <Button
                  title="Cancel"
                  variant="outline"
                  onPress={() => setDeleteStep(0)}
                  disabled={deleteLoading}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          )}
        </CardBody>
      </Card>

      {/* Legal Modals */}
      {renderLegalModal(termsVisible, setTermsVisible, 'Terms of Service', termsContent)}
      {renderLegalModal(privacyVisible, setPrivacyVisible, 'Privacy Policy', privacyContent)}
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '80%',
    paddingTop: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: SpendWiseTheme.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: SpendWiseTheme.text,
  },
  closeBtn: {
    padding: 8,
  },
  closeBtnText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: SpendWiseTheme.muted,
  },
  modalBody: {
    padding: 20,
  },
  legalContent: {
    paddingBottom: 40,
  },
  legalLastUpdated: {
    fontSize: 12,
    color: SpendWiseTheme.muted,
    marginBottom: 16,
    fontWeight: '600',
  },
  legalSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: SpendWiseTheme.text,
    marginTop: 16,
    marginBottom: 6,
  },
  legalText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 20,
  },
  dangerText: {
    fontSize: 13,
    color: '#7F1D1D',
    lineHeight: 18,
  },
  confirmText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#991B1B',
  },
  confirmRow: {
    marginTop: 12,
    gap: 8,
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: 10,
  },
});

