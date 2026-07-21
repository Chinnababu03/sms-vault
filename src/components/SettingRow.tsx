// ============================================================
// SMS Vault v2.0 - Settings Toggle Row
// Reusable row with icon, label, subtitle, and a switch / value.
// ============================================================

import React from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { theme } from '../utils/theme';
import { haptic } from '../utils/haptics';

export interface SettingRowProps {
  icon: string;
  iconColor?: string;
  label: string;
  subtitle?: string;
  // Switch variant
  value?: boolean;
  onValueChange?: (v: boolean) => void;
  // Value variant (text on the right) — when set the row becomes a tap target
  valueText?: string;
  onPress?: () => void;
  destructive?: boolean;
  disabled?: boolean;
  // Optional badge (e.g. "New")
  badge?: string;
}

export function SettingRow(props: SettingRowProps): React.ReactElement {
  const {
    icon,
    iconColor = theme.colors.primary,
    label,
    subtitle,
    value,
    onValueChange,
    valueText,
    onPress,
    destructive = false,
    disabled = false,
    badge,
  } = props;

  const isSwitch = typeof value === 'boolean' && !!onValueChange;

  const handleToggle = (v: boolean): void => {
    haptic(v ? 'light' : 'selection');
    onValueChange?.(v);
  };

  const inner = (
    <View style={[styles.row, disabled && styles.rowDisabled]}>
      <View style={[styles.iconWrap, { backgroundColor: (iconColor || theme.colors.primary) + '20' }]}>
        <Icon name={icon} size={20} color={iconColor} />
      </View>

      <View style={styles.textWrap}>
        <View style={styles.titleRow}>
          <Text style={[styles.label, destructive && { color: theme.colors.error }]} numberOfLines={1}>
            {label}
          </Text>
          {badge ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          ) : null}
        </View>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {isSwitch ? (
        <Switch
          value={value}
          onValueChange={handleToggle}
          disabled={disabled}
          trackColor={{ false: theme.colors.surfaceHighlight, true: theme.colors.primary + '60' }}
          thumbColor={value ? theme.colors.primary : theme.colors.textTertiary}
          ios_backgroundColor={theme.colors.surfaceHighlight}
        />
      ) : valueText !== undefined ? (
        <View style={styles.valueWrap}>
          <Text style={styles.valueText} numberOfLines={1}>
            {valueText}
          </Text>
          <Icon name="chevron-forward" size={16} color={theme.colors.textTertiary} />
        </View>
      ) : onPress ? (
        <Icon name="chevron-forward" size={16} color={theme.colors.textTertiary} />
      ) : null}
    </View>
  );

  if (onPress && !isSwitch) {
    return (
      <TouchableOpacity activeOpacity={0.6} onPress={onPress} disabled={disabled}>
        {inner}
      </TouchableOpacity>
    );
  }
  return inner;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    marginVertical: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.border,
    minHeight: 56,
  },
  rowDisabled: {
    opacity: 0.5,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  textWrap: { flex: 1, marginRight: theme.spacing.md },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  label: {
    ...theme.typography.bodyMedium,
    color: theme.colors.text,
    fontWeight: '600',
  },
  subtitle: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  badge: {
    backgroundColor: theme.colors.primarySurface,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.full,
    marginLeft: theme.spacing.sm,
  },
  badgeText: {
    ...theme.typography.labelSmall,
    color: theme.colors.primary,
    fontWeight: '700',
  },
  valueWrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  valueText: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    maxWidth: 120,
  },
});

export default SettingRow;
