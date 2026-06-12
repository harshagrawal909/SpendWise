import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SpendWiseTheme } from '@/constants/theme';
import API from '@/services/api';

type NotificationItem = {
  _id: string;
  title: string;
  body: string;
  sentAt?: string;
  createdAt?: string;
};

function timeAgo(dateStr?: string): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function NotificationModal({ visible, onClose }: Props) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!visible) return;

    let mounted = true;
    setLoading(true);
    setError('');

    API.get('/notifications')
      .then((res) => {
        if (mounted) setNotifications(res.data);
      })
      .catch((err) => {
        if (mounted) setError(err?.response?.data?.message ?? 'Failed to load notifications');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [visible]);

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
              <Ionicons name="notifications" size={20} color={SpendWiseTheme.primary} />
              <Text style={styles.headerTitle}>Notifications</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={SpendWiseTheme.muted} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            showsVerticalScrollIndicator
          >
            {loading ? (
              <ActivityIndicator
                color={SpendWiseTheme.primary}
                style={styles.loader}
              />
            ) : error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : notifications.length === 0 ? (
              <View style={styles.emptyBox}>
                <Ionicons
                  name="notifications-off-outline"
                  size={40}
                  color="#CBD5E1"
                />
                <Text style={styles.emptyTitle}>No notifications yet</Text>
                <Text style={styles.emptySubtitle}>
                  You'll see broadcast messages here.
                </Text>
              </View>
            ) : (
              notifications.map((n) => (
                <View key={n._id} style={styles.notifCard}>
                  <View style={styles.notifDot} />
                  <View style={styles.notifContent}>
                    <Text style={styles.notifTitle}>{n.title}</Text>
                    <Text style={styles.notifBody}>{n.body}</Text>
                    <Text style={styles.notifTime}>
                      {timeAgo(n.sentAt || n.createdAt)}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
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
    height: '75%',
    paddingTop: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: SpendWiseTheme.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: SpendWiseTheme.text,
  },
  closeBtn: {
    padding: 4,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 12,
  },
  loader: {
    paddingVertical: 40,
  },
  errorBox: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
    padding: 16,
  },
  errorText: {
    fontSize: 13,
    color: '#B91C1C',
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: SpendWiseTheme.text,
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    color: SpendWiseTheme.muted,
  },
  notifCard: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: SpendWiseTheme.border,
    padding: 14,
    gap: 12,
    alignItems: 'flex-start',
  },
  notifDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: SpendWiseTheme.primary,
    marginTop: 6,
  },
  notifContent: {
    flex: 1,
    gap: 4,
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: SpendWiseTheme.text,
  },
  notifBody: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },
  notifTime: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
});
