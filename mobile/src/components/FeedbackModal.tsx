import { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SpendWiseTheme } from '@/constants/theme';
import API from '@/services/api';

type Props = {
  visible: boolean;
  onClose: () => void;
};

type FeedbackType = 'bug' | 'feature' | 'other';

export function FeedbackModal({ visible, onClose }: Props) {
  const [type, setType] = useState<FeedbackType>('other');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!message.trim()) {
      setError('Please enter your message');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await API.post('/feedback', {
        type,
        message,
        platform: 'mobile',
      });

      setSuccess(true);
      setMessage('');
      setType('other');

      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to submit feedback');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Ionicons name="chatbubble-ellipses" size={20} color={SpendWiseTheme.primary} />
              <Text style={styles.headerTitle}>Transmit Feedback</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} disabled={loading}>
              <Ionicons name="close" size={22} color={SpendWiseTheme.muted} />
            </TouchableOpacity>
          </View>

          {/* Body */}
          {success ? (
            <View style={styles.successContainer}>
              <View style={styles.successIcon}>
                <Ionicons name="checkmark-circle" size={48} color={SpendWiseTheme.success} />
              </View>
              <Text style={styles.successTitle}>Transmission Successful!</Text>
              <Text style={styles.successSubtitle}>Thank you for your valuable response.</Text>
            </View>
          ) : (
            <View style={styles.body}>
              {error ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              {/* Category selector */}
              <Text style={styles.label}>Feedback Category</Text>
              <View style={styles.typeSelector}>
                {(['bug', 'feature', 'other'] as FeedbackType[]).map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[
                      styles.typeBtn,
                      type === t && styles.typeBtnActive,
                    ]}
                    onPress={() => setType(t)}
                    disabled={loading}
                  >
                    <Text
                      style={[
                        styles.typeText,
                        type === t && styles.typeTextActive,
                      ]}
                    >
                      {t === 'bug' ? '🐛 Bug' : t === 'feature' ? '💡 Feature' : '💬 Other'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Message Input */}
              <Text style={styles.label}>Message</Text>
              <TextInput
                style={styles.input}
                placeholder="Your transmission details here..."
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={5}
                value={message}
                onChangeText={setMessage}
                editable={!loading}
              />

              {/* Actions */}
              <View style={styles.footer}>
                <TouchableOpacity
                  style={[styles.btn, styles.cancelBtn]}
                  onPress={onClose}
                  disabled={loading}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btn, styles.submitBtn]}
                  onPress={handleSubmit}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.submitBtnText}>Submit</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 24,
    paddingTop: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  closeBtn: {
    padding: 4,
    borderRadius: 99,
  },
  body: {
    padding: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  typeBtn: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  typeBtnActive: {
    borderColor: SpendWiseTheme.primary,
    backgroundColor: '#EEF2FF',
  },
  typeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  typeTextActive: {
    color: SpendWiseTheme.primary,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
    height: 120,
    textAlignVertical: 'top',
    marginBottom: 24,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
  },
  btn: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  submitBtn: {
    backgroundColor: SpendWiseTheme.primary,
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '600',
    color: SpendWiseTheme.danger,
    textAlign: 'center',
  },
  successContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  successIcon: {
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  successSubtitle: {
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
  },
});
