// ============================================================
// SMS Vault v2.0 - Permission Card
// Reusable card used inside OnboardingScreen / screens that need
// to request runtime permissions progressively.
// ============================================================

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { theme, glassCard } from '../utils/theme';
import { haptic } from '../utils/haptics';

export interface PermissionCardProps {
  icon: string;
  iconColor?: string;
  title: string;
  description: string;
  status: 'idle' | 'granted' | 'denied' | 'checking';
  onGrant: () => void;
  required?: boolean;
}

export function PermissionCard(props: PermissionCardProps): React.ReactElement {
  const {
    icon,
    iconColor = theme.colors.primary,
    title,
    description,
    status,
    onGrant,
    required = false,
  } = props;

  const isGranted = status === 'granted';
  const isDenied = status === 'denied';
  const isChecking = status === 'checking';

  const handlePress = (): void => {
    if (isGranted || isChecking) return;
    haptic('medium');
    onGrant();
  };

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.info}>
          <View style={[styles.iconWrap, { backgroundColor: iconColor + '20' }]}>
            <Icon name={icon} size={22} color={iconColor} />
          </View>
          <View style={styles.textWrap}>
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
            <Text style={styles.desc} numberOfLines={2}>
              {description}
            </Text>
            {required && !isGranted ? (
              <View style={styles.requiredBadge}>
                <Icon name="alert-circle" size={10} color={theme.colors.warning} />
                <Text style={styles.requiredText}>Required</Text>
              </View>
            ) : null}
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handlePress}
          disabled={isGranted || isChecking}
          style={[
            styles.btn,
            isGranted && styles.btnGranted,
            isDenied && !isGranted && styles.btnDenied,
            isChecking && styles.btnChecking,
          ]}
        >
          {isChecking ? (
            <Text style={[styles.btnText, styles.btnTextChecking]}>Checking…</Text>
          ) : isGranted ? (
            <Text style={[styles.btnText, styles.btnTextGranted]}>✓ Granted</Text>
          ) : isDenied ? (
            <Text style={[styles.btnText, styles.btnTextDenied]}>Retry</Text>
          ) : (
            <Text style={styles.btnText}>Grant</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...glassCard,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  info: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: theme.spacing.md },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  textWrap: { flex: 1 },
  title: { ...theme.typography.titleMedium, color: theme.colors.text },
  desc: { ...theme.typography.bodySmall, color: theme.colors.textSecondary, marginTop: 2 },
  requiredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  requiredText: {
    ...theme.typography.labelSmall,
    color: theme.colors.warning,
    fontWeight: '700',
  },
  btn: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.primary,
    minWidth: 80,
    alignItems: 'center',
  },
  btnGranted: { backgroundColor: theme.colors.success + '20' },
  btnDenied: { backgroundColor: theme.colors.warning + '20' },
  btnChecking: { backgroundColor: theme.colors.surfaceHighlight },
  btnText: { ...theme.typography.labelLarge, color: theme.colors.white },
  btnTextGranted: { color: theme.colors.success, fontWeight: '700' },
  btnTextDenied: { color: theme.colors.warning, fontWeight: '700' },
  btnTextChecking: { color: theme.colors.textSecondary },
});

export default PermissionCard;
