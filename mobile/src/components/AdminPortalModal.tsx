import { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SpendWiseTheme } from '@/constants/theme';
import API from '@/services/api';

type UserItem = {
  _id: string;
  name: string;
  email: string;
  role: string;
  provider: string;
  lastSeenAt?: string;
};

type AdminStats = {
  totalUsers: number;
  activeUsers: number;
  totalDownloads: number;
  totalInstalls: number;
  totalNotifications: number;
  usersWithPush: number;
};

type PastNotification = {
  _id: string;
  title: string;
  body: string;
  sentAt: string;
  recipientCount: number;
};

type FeedbackItem = {
  _id: string;
  userId?: {
    name: string;
    email: string;
    photoUrl?: string;
  };
  name?: string;
  email?: string;
  type: 'bug' | 'feature' | 'other';
  message: string;
  platform: 'web' | 'mobile';
  status: 'unread' | 'resolved' | 'archived';
  createdAt: string;
};

type Props = {
  visible: boolean;
  onClose: () => void;
};

function timeAgo(dateStr?: string): string {
  if (!dateStr) return 'Never';
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

export function AdminPortalModal({ visible, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<'stats' | 'broadcast' | 'users' | 'feedback'>('stats');
  
  // Data states
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [notifications, setNotifications] = useState<PastNotification[]>([]);
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Form states
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [statsRes, usersRes, notifsRes, feedbacksRes] = await Promise.all([
        API.get('/admin/stats'),
        API.get('/admin/users'),
        API.get('/admin/notifications'),
        API.get('/admin/feedback'),
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
      setNotifications(notifsRes.data);
      setFeedbacks(feedbacksRes.data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load admin dashboard data.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleUpdateFeedbackStatus = async (id: string, status: 'unread' | 'resolved' | 'archived') => {
    try {
      await API.patch(`/admin/feedback/${id}/status`, { status });
      setFeedbacks(prev => prev.map(f => f._id === id ? { ...f, status } : f));
    } catch (err) {
      Alert.alert('Error', 'Failed to update feedback status');
    }
  };

  useEffect(() => {
    if (visible) {
      fetchData();
    }
  }, [visible, fetchData]);

  const handleBroadcast = async () => {
    if (!title.trim() || !body.trim()) {
      Alert.alert('Validation Error', 'Both title and message body are required.');
      return;
    }

    setSending(true);
    try {
      const res = await API.post('/admin/notifications', { title, body });
      Alert.alert(
        'Success', 
        `Notification broadcasted successfully to ${res.data.recipientCount} devices!`
      );
      setTitle('');
      setBody('');
      // Refresh notifications & stats
      fetchData();
    } catch (err: any) {
      Alert.alert('Broadcast Failed', err?.response?.data?.message || 'An error occurred.');
    } finally {
      setSending(false);
    }
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
              <Ionicons name="shield-checkmark" size={22} color="#D97706" />
              <Text style={styles.headerTitle}>Admin Portal</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={SpendWiseTheme.muted} />
            </TouchableOpacity>
          </View>

          {/* Navigation Tabs */}
          <View style={styles.tabBar}>
            <TouchableOpacity 
              style={[styles.tabButton, activeTab === 'stats' && styles.tabButtonActive]}
              onPress={() => setActiveTab('stats')}
            >
              <Ionicons 
                name="bar-chart" 
                size={16} 
                color={activeTab === 'stats' ? '#B45309' : SpendWiseTheme.muted} 
              />
              <Text style={[styles.tabText, activeTab === 'stats' && styles.tabTextActive]}>Stats</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.tabButton, activeTab === 'broadcast' && styles.tabButtonActive]}
              onPress={() => setActiveTab('broadcast')}
            >
              <Ionicons 
                name="megaphone" 
                size={16} 
                color={activeTab === 'broadcast' ? '#B45309' : SpendWiseTheme.muted} 
              />
              <Text style={[styles.tabText, activeTab === 'broadcast' && styles.tabTextActive]}>Broadcast</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.tabButton, activeTab === 'users' && styles.tabButtonActive]}
              onPress={() => setActiveTab('users')}
            >
              <Ionicons 
                name="people" 
                size={16} 
                color={activeTab === 'users' ? '#B45309' : SpendWiseTheme.muted} 
              />
              <Text style={[styles.tabText, activeTab === 'users' && styles.tabTextActive]}>Users</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.tabButton, activeTab === 'feedback' && styles.tabButtonActive]}
              onPress={() => setActiveTab('feedback')}
            >
              <Ionicons 
                name="chatbox-ellipses" 
                size={16} 
                color={activeTab === 'feedback' ? '#B45309' : SpendWiseTheme.muted} 
              />
              <Text style={[styles.tabText, activeTab === 'feedback' && styles.tabTextActive]}>Inbox</Text>
            </TouchableOpacity>
          </View>

          {/* Main Body */}
          {loading ? (
            <View style={styles.centerBox}>
              <ActivityIndicator size="large" color="#D97706" />
              <Text style={styles.loadingText}>Fetching admin records...</Text>
            </View>
          ) : error ? (
            <View style={styles.centerBox}>
              <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={fetchData}>
                <Text style={styles.retryBtnText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
              
              {/* Tab 1: STATS */}
              {activeTab === 'stats' && stats && (
                <View style={styles.tabContent}>
                  <View style={styles.statsGrid}>
                    <View style={styles.statCard}>
                      <Text style={styles.statLabel}>TOTAL USERS</Text>
                      <Text style={styles.statValue}>{stats.totalUsers}</Text>
                    </View>
                    
                    <View style={styles.statCard}>
                      <Text style={styles.statLabel}>ACTIVE USERS</Text>
                      <Text style={styles.statValue}>{stats.activeUsers}</Text>
                    </View>
                    
                    <View style={styles.statCard}>
                      <Text style={styles.statLabel}>APK DOWNLOADS</Text>
                      <Text style={styles.statValue}>{stats.totalDownloads}</Text>
                    </View>
                    
                    <View style={styles.statCard}>
                      <Text style={styles.statLabel}>APK INSTALLS</Text>
                      <Text style={styles.statValue}>{stats.totalInstalls}</Text>
                    </View>
                    
                    <View style={styles.statCard}>
                      <Text style={styles.statLabel}>PUSH NOTIFS SENT</Text>
                      <Text style={styles.statValue}>{stats.totalNotifications}</Text>
                    </View>
                    
                    <View style={styles.statCard}>
                      <Text style={styles.statLabel}>DEVICES WITH PUSH</Text>
                      <Text style={styles.statValue}>{stats.usersWithPush}</Text>
                    </View>
                  </View>

                  <Text style={styles.sectionTitle}>Broadcast History</Text>
                  {notifications.length === 0 ? (
                    <Text style={styles.emptyText}>No past notifications broadcasted.</Text>
                  ) : (
                    notifications.map((notif) => (
                      <View key={notif._id} style={styles.historyCard}>
                        <View style={styles.historyHeader}>
                          <Text style={styles.historyTitle}>{notif.title}</Text>
                          <Text style={styles.historyTime}>{timeAgo(notif.sentAt)}</Text>
                        </View>
                        <Text style={styles.historyBody}>{notif.body}</Text>
                        <View style={styles.historyFooter}>
                          <Ionicons name="checkmark-done-circle" size={14} color="#10B981" />
                          <Text style={styles.historySentCount}>
                            Sent to {notif.recipientCount} device(s)
                          </Text>
                        </View>
                      </View>
                    ))
                  )}
                </View>
              )}

              {/* Tab 2: BROADCAST FORM */}
              {activeTab === 'broadcast' && (
                <View style={styles.tabContent}>
                  <Text style={styles.formLabel}>Notification Title</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. New Feature Released!"
                    value={title}
                    onChangeText={setTitle}
                  />

                  <Text style={styles.formLabel}>Notification Message</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Type the broadcast message details here..."
                    multiline
                    numberOfLines={4}
                    value={body}
                    onChangeText={setBody}
                  />

                  <TouchableOpacity 
                    style={styles.broadcastBtn} 
                    onPress={handleBroadcast}
                    disabled={sending}
                  >
                    {sending ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <>
                        <Ionicons name="send" size={16} color="#FFFFFF" />
                        <Text style={styles.broadcastBtnText}>Broadcast to All Users</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <View style={styles.infoAlert}>
                    <Ionicons name="information-circle-outline" size={18} color="#B45309" />
                    <Text style={styles.infoAlertText}>
                      This will trigger a real-time push notification using Expo Push API to all users who have registered a push token.
                    </Text>
                  </View>
                </View>
              )}

              {/* Tab 3: USERS LIST */}
              {activeTab === 'users' && (
                <View style={styles.tabContent}>
                  <View style={styles.searchBar}>
                    <Ionicons name="search" size={18} color={SpendWiseTheme.muted} style={styles.searchIcon} />
                    <TextInput
                      style={styles.searchInput}
                      placeholder="Search users by name or email..."
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                      <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <Ionicons name="close-circle" size={18} color={SpendWiseTheme.muted} />
                      </TouchableOpacity>
                    )}
                  </View>

                  <Text style={styles.usersCount}>Showing {filteredUsers.length} user(s)</Text>

                  {filteredUsers.length === 0 ? (
                    <Text style={styles.emptyText}>No users matched your search query.</Text>
                  ) : (
                    filteredUsers.map((user) => (
                      <View key={user._id} style={styles.userCard}>
                        <View style={styles.userHeader}>
                          <View>
                            <Text style={styles.userName}>{user.name}</Text>
                            <Text style={styles.userEmail}>{user.email}</Text>
                          </View>
                          <View style={[
                            styles.roleBadge,
                            user.role === 'admin' ? styles.roleBadgeAdmin : styles.roleBadgeUser
                          ]}>
                            <Text style={[
                              styles.roleBadgeText,
                              user.role === 'admin' ? styles.roleBadgeTextAdmin : styles.roleBadgeTextUser
                            ]}>
                              {user.role.toUpperCase()}
                            </Text>
                          </View>
                        </View>
                        
                        <View style={styles.userDetailRow}>
                          <Text style={styles.userDetailText}>
                            Method: <Text style={{ fontWeight: '600' }}>{user.provider}</Text>
                          </Text>
                          <Text style={styles.userDetailText}>
                            Seen: <Text style={{ fontWeight: '600' }}>{timeAgo(user.lastSeenAt)}</Text>
                          </Text>
                        </View>
                      </View>
                    ))
                  )}
                </View>
              )}

              {/* Tab 4: FEEDBACK */}
              {activeTab === 'feedback' && (
                <View style={styles.tabContent}>
                  {feedbacks.length === 0 ? (
                    <Text style={styles.emptyText}>No feedback submissions found.</Text>
                  ) : (
                    feedbacks.map((f) => (
                      <View key={f._id} style={styles.feedbackCard}>
                        <View style={styles.feedbackHeader}>
                          <View style={styles.feedbackMeta}>
                            <Text style={[
                              styles.feedbackBadge,
                              f.type === 'bug' ? styles.badgeBug : f.type === 'feature' ? styles.badgeFeature : styles.badgeOther
                            ]}>
                              {f.type === 'bug' ? '🐛 Bug' : f.type === 'feature' ? '💡 Feature' : '💬 Other'}
                            </Text>
                            <Text style={styles.platformBadge}>{f.platform.toUpperCase()}</Text>
                          </View>
                          <Text style={styles.feedbackTime}>{timeAgo(f.createdAt)}</Text>
                        </View>
                        
                        <Text style={styles.feedbackText}>{f.message}</Text>
                        
                        <View style={styles.feedbackSenderRow}>
                          <Text style={styles.feedbackSenderText}>
                            From: <Text style={{ fontWeight: '600' }}>
                              {f.userId ? (f.userId.name || f.userId.email) : (f.name || 'Anonymous')}
                            </Text>
                          </Text>
                        </View>

                        <View style={styles.feedbackActionsRow}>
                          {f.status === 'unread' ? (
                            <View style={styles.actionButtonsContainer}>
                              <TouchableOpacity
                                style={[styles.actionBtn, styles.resolveBtn]}
                                onPress={() => handleUpdateFeedbackStatus(f._id, 'resolved')}
                              >
                                <Text style={styles.resolveBtnText}>✓ Resolve</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={[styles.actionBtn, styles.archiveBtn]}
                                onPress={() => handleUpdateFeedbackStatus(f._id, 'archived')}
                              >
                                <Text style={styles.archiveBtnText}>Archive</Text>
                              </TouchableOpacity>
                            </View>
                          ) : (
                            <Text style={[
                              styles.statusLabel,
                              f.status === 'resolved' ? styles.statusResolved : styles.statusArchived
                            ]}>
                              {f.status.toUpperCase()}
                            </Text>
                          )}
                        </View>
                      </View>
                    ))
                  )}
                </View>
              )}

            </ScrollView>
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
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    height: '85%',
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
    color: '#D97706', // Gold/Amber theme
  },
  closeBtn: {
    padding: 4,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  tabButtonActive: {
    borderBottomWidth: 3,
    borderBottomColor: '#D97706',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: SpendWiseTheme.muted,
  },
  tabTextActive: {
    color: '#B45309',
    fontWeight: '800',
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: 16,
    paddingBottom: 40,
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: SpendWiseTheme.muted,
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: '#D97706',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    marginTop: 8,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  tabContent: {
    gap: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 14,
    gap: 4,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: SpendWiseTheme.text,
    marginTop: 8,
  },
  emptyText: {
    fontSize: 13,
    color: SpendWiseTheme.muted,
    textAlign: 'center',
    paddingVertical: 20,
    fontStyle: 'italic',
  },
  historyCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FEF3C7',
    padding: 14,
    gap: 6,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  historyTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#78350F',
    flex: 1,
    marginRight: 8,
  },
  historyTime: {
    fontSize: 10,
    color: '#B45309',
  },
  historyBody: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 16,
  },
  historyFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  historySentCount: {
    fontSize: 11,
    color: '#10B981',
    fontWeight: '700',
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: SpendWiseTheme.text,
    marginBottom: -8,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: SpendWiseTheme.border,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: SpendWiseTheme.text,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  broadcastBtn: {
    backgroundColor: '#D97706',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
    marginTop: 8,
  },
  broadcastBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  infoAlert: {
    flexDirection: 'row',
    backgroundColor: '#FFFBEB',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FEF3C7',
    padding: 14,
    gap: 10,
    alignItems: 'flex-start',
  },
  infoAlertText: {
    fontSize: 12,
    color: '#B45309',
    lineHeight: 16,
    flex: 1,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: SpendWiseTheme.border,
    borderRadius: 16,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchIcon: {
    marginRight: -2,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: SpendWiseTheme.text,
  },
  usersCount: {
    fontSize: 11,
    color: SpendWiseTheme.muted,
    fontWeight: '700',
    marginBottom: -8,
  },
  userCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: SpendWiseTheme.border,
    padding: 14,
    gap: 10,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  userName: {
    fontSize: 14,
    fontWeight: '800',
    color: SpendWiseTheme.text,
  },
  userEmail: {
    fontSize: 12,
    color: SpendWiseTheme.muted,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  roleBadgeAdmin: {
    backgroundColor: '#FEF3C7',
  },
  roleBadgeUser: {
    backgroundColor: '#F1F5F9',
  },
  roleBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  roleBadgeTextAdmin: {
    color: '#B45309',
  },
  roleBadgeTextUser: {
    color: '#475569',
  },
  userDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 8,
  },
  userDetailText: {
    fontSize: 11,
    color: '#64748B',
  },
  feedbackCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: SpendWiseTheme.border,
    padding: 14,
    gap: 10,
    marginBottom: 8,
  },
  feedbackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  feedbackMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  feedbackBadge: {
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeBug: {
    backgroundColor: '#FEE2E2',
    color: '#DC2626',
  },
  badgeFeature: {
    backgroundColor: '#ECFEFF',
    color: '#0891B2',
  },
  badgeOther: {
    backgroundColor: '#F1F5F9',
    color: '#475569',
  },
  platformBadge: {
    fontSize: 9,
    fontWeight: '700',
    backgroundColor: '#EEF2FF',
    color: '#4F46E5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  feedbackTime: {
    fontSize: 10,
    color: '#94A3B8',
  },
  feedbackText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
  },
  feedbackSenderRow: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  feedbackSenderText: {
    fontSize: 11,
    color: '#64748B',
  },
  senderEmail: {
    fontSize: 10,
    color: '#94A3B8',
  },
  feedbackActionsRow: {
    marginTop: 2,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resolveBtn: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  resolveBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  archiveBtn: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  archiveBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  statusLabel: {
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'center',
    paddingVertical: 4,
    borderRadius: 6,
    letterSpacing: 0.5,
  },
  statusResolved: {
    backgroundColor: '#D1FAE5',
    color: '#065F46',
  },
  statusArchived: {
    backgroundColor: '#E2E8F0',
    color: '#374151',
  },
});
