import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SyncState } from '@/services/transactionService';

interface SyncStatusBadgeProps {
  syncState: SyncState;
  pendingCount: number;
  onPress?: () => void;
}

export function SyncStatusBadge({ syncState, pendingCount, onPress }: SyncStatusBadgeProps) {
  let iconName: keyof typeof Ionicons.glyphMap = 'cloud-done-outline';
  let color = '#10B981'; // green
  let text = 'Synced';
  let showLoader = false;
  let bgColor = '#ECFDF5';

  if (syncState === 'syncing') {
    showLoader = true;
    color = '#3B82F6'; // blue
    text = pendingCount > 0 ? `Syncing (${pendingCount})` : 'Syncing...';
    bgColor = '#EFF6FF';
  } else if (pendingCount > 0) {
    iconName = 'cloud-upload-outline';
    color = '#F59E0B'; // orange
    text = `${pendingCount} pending`;
    bgColor = '#FEF3C7';
  } else if (syncState === 'offline') {
    iconName = 'cloud-offline-outline';
    color = '#F59E0B'; // orange
    text = 'Offline';
    bgColor = '#FEF3C7';
  } else if (syncState === 'error') {
    iconName = 'alert-circle-outline';
    color = '#EF4444'; // red
    text = 'Sync error';
    bgColor = '#FEF2F2';
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={syncState === 'syncing'}
      style={[styles.badge, { backgroundColor: bgColor, borderColor: color + '40' }]}
      activeOpacity={0.7}
    >
      {showLoader ? (
        <ActivityIndicator size="small" color={color} style={styles.loader} />
      ) : (
        <Ionicons name={iconName} size={14} color={color} style={styles.icon} />
      )}
      <Text style={[styles.text, { color }]}>{text}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 99,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  icon: {
    marginRight: 4,
  },
  loader: {
    marginRight: 4,
    width: 14,
    height: 14,
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
  },
});
