// ============================================================
// SMS Vault v2.0 - Cloud Provider Card
// Reusable card showing cloud connection state.
// ============================================================

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import type { CloudAccount, CloudProvider } from '../types';
import { theme, glassCard } from '../utils/theme';
import { CLOUD_LABELS, CLOUD_COLORS, formatBytes } from '../utils/helpers';
import { haptic } from '../utils/haptics';

export interface CloudCardProps {
  account: CloudAccount;
  /** Render as a static summary (no action), tap connects/disconnects. */
  onPress?: (provider: CloudProvider) => void;
  /** If true, this adapter is currently selectable (e.g. for backup target lists). */
  selectable?: boolean;
  selected?: boolean;
}

const CLOUD_ICON: Record<CloudProvider, string> = {
  google_drive: 'logo-google',
  onedrive: 'cloud',
  dropbox: 'cube',
};

export function CloudCard(props: CloudCardProps): React.ReactElement {
  const { account, onPress, selectable = false, selected = false } = props;
  const color = CLOUD_COLORS[account.provider];
  const label = CLOUD_LABELS[account.provider];
  const icon = CLOUD_ICON[account.provider];

  const handlePress = (): void => {
    if (!onPress) return;
    haptic(selected ? 'selection' : 'click');
    onPress(account.provider);
  };

  const pct =
    account.storageTotal && account.storageUsed
      ? Math.min(1, account.storageUsed / Math.max(1, account.storageTotal))
      : 0;

  const inner = (
    <LinearGradient
      colors={[color + '18', color + '05']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <View style={styles.left}>
        <View style={[styles.iconWrap, { backgroundColor: color + '20' }]}>
          <Icon name={icon} size={22} color={color} />
        </View>
        <View style={styles.info}>
          <Text style={styles.label} numberOfLines={1}>
            {label}
          </Text>
          <Text style={styles.status} numberOfLines={1}>
            {account.isConnected
              ? account.email
                ? `Connected · ${account.email}`
                : 'Connected'
              : 'Not connected'}
          </Text>
        </View>
      </View>

      <View style={styles.right}>
        {selectable ? (
          <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
            {selected ? <Icon name="checkmark" size={14} color={theme.colors.white} /> : null}
          </View>
        ) : account.isConnected ? (
          <View style={styles.connectedBadge}>
            <View style={[styles.connectedDot, { backgroundColor: theme.colors.success }]} />
            <Text style={styles.connectedText}>Ready</Text>
          </View>
        ) : (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handlePress}
            style={styles.connectBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.connectText}>Connect</Text>
          </TouchableOpacity>
        )}
      </View>
    </LinearGradient>
  );

  if (!onPress || selectable) {
    return (
      <View style={[styles.card, selectable && selected && styles.cardSelected]}>
        {inner}
      </View>
    );
  }

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={handlePress}
      style={[styles.card, selectable && selected && styles.cardSelected]}
    >
      {inner}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    marginVertical: theme.spacing.xs,
    ...glassCard,
  },
  cardSelected: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
  },
  left: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  info: { flex: 1 },
  label: { ...theme.typography.bodyMedium, color: theme.colors.text, fontWeight: '700' },
  status: { ...theme.typography.caption, color: theme.colors.textSecondary, marginTop: 2 },
  right: { alignItems: 'flex-end' },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  connectedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  connectedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  connectedText: {
    ...theme.typography.labelMedium,
    color: theme.colors.success,
    fontWeight: '700',
  },
  connectBtn: {
    backgroundColor: theme.colors.primarySurface,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
  },
  connectText: {
    ...theme.typography.labelMedium,
    color: theme.colors.primary,
    fontWeight: '700',
  },
});

export default CloudCard;
