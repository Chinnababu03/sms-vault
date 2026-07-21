// ============================================================
// SMS Vault v2.0 - Backup Card
// Reusable card representing a single backup entry.
// ============================================================

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import type { BackupMetadata } from '../types';
import { theme } from '../utils/theme';
import { formatDate, formatBytes, formatSmsCount, formatCallCount } from '../utils/helpers';
import { haptic } from '../utils/haptics';

export interface BackupCardProps {
  backup: BackupMetadata;
  onPress?: (id: string) => void;
  onLongPress?: (id: string) => void;
  showActions?: boolean;
}

export function BackupCard(props: BackupCardProps): React.ReactElement {
  const { backup, onPress, onLongPress, showActions = false } = props;

  const handlePress = (): void => {
    if (!onPress) return;
    haptic('light');
    onPress(backup.id);
  };

  const handleLong = (): void => {
    if (!onLongPress) return;
    haptic('heavy');
    onLongPress(backup.id);
  };

  const card = (
    <View style={styles.card}>
      <View style={styles.left}>
        <View style={styles.iconWrap}>
          <Icon name="document-text" size={22} color={theme.colors.primary} />
        </View>
        <View style={styles.info}>
          <View style={styles.titleRow}>
            <Text style={styles.date} numberOfLines={1}>
              {formatDate(backup.date)}
            </Text>
            <View style={styles.badges}>
              {backup.isEncrypted && (
                <View style={styles.iconBadge} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
                  <Icon name="lock-closed" size={11} color={theme.colors.encryption} />
                </View>
              )}
              {backup.isComplete ? (
                <Icon name="checkmark-circle" size={14} color={theme.colors.success} />
              ) : (
                <Icon name="alert-circle" size={14} color={theme.colors.warning} />
              )}
            </View>
          </View>
          <Text style={styles.stats} numberOfLines={1}>
            {formatSmsCount(backup.totalSms)} · {formatCallCount(backup.totalCallLogs)}
          </Text>
          {backup.cloudProviders.length > 0 && (
            <View style={styles.cloudRow}>
              <Icon name="cloud-done" size={12} color={theme.colors.cloud} />
              <Text style={styles.cloudText}>
                {backup.cloudProviders.length} cloud
                {backup.cloudProviders.length > 1 ? 's' : ''}
              </Text>
            </View>
          )}
          {!backup.isComplete && backup.errorMessage ? (
            <Text style={styles.errorText} numberOfLines={1}>
              <Icon name="warning" size={11} color={theme.colors.error} /> {backup.errorMessage}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={styles.right}>
        <Text style={styles.size} numberOfLines={1}>
          {formatBytes(backup.sizeBytes)}
        </Text>
        {showActions && (
          <Icon name="chevron-forward" size={16} color={theme.colors.textTertiary} />
        )}
      </View>
    </View>
  );

  if (!onPress && !onLongPress) return card;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onLongPress={handleLong}
      onPress={handlePress}
      delayLongPress={350}
    >
      {card}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    minHeight: 72,
  },
  left: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.primarySurface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  info: { flex: 1 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  date: {
    ...theme.typography.bodyMedium,
    color: theme.colors.text,
    fontWeight: '700',
    flex: 1,
  },
  badges: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  iconBadge: {
    backgroundColor: theme.colors.encryptionLight,
    borderRadius: theme.borderRadius.full,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stats: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  cloudRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 4,
  },
  cloudText: {
    ...theme.typography.labelSmall,
    color: theme.colors.cloud,
  },
  errorText: {
    ...theme.typography.labelSmall,
    color: theme.colors.error,
    marginTop: 2,
  },
  right: { alignItems: 'flex-end' },
  size: {
    ...theme.typography.caption,
    color: theme.colors.textTertiary,
    marginBottom: 2,
  },
});

export default BackupCard;
