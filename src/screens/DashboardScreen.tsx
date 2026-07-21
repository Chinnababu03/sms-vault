import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import LinearGradient from 'react-native-linear-gradient';
import Animated, { FadeInDown, FadeInUp, Layout } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/Ionicons';
import { useApp } from '../services/AppContext';
import { theme, glassCard, screenPadding, screenWidth } from '../utils/theme';
import { formatDate, formatBytes, formatSmsCount, formatCallCount } from '../utils/helpers';
import type { RootStackParamList } from '../types';


// ============================================================
// SMS Vault v2.0 - Dashboard Screen
// ============================================================

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function DashboardScreen() {
  const nav = useNavigation<Nav>();
  const { state } = useApp();
  const [refreshing, setRefreshing] = useState(false);
  const latestBackup = state.backups[0];

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // Simulate refresh
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setRefreshing(false);
  }, []);

  const hasBackups = state.backups.length > 0;
  const totalSms = latestBackup?.totalSms || 0;
  const totalCalls = latestBackup?.totalCallLogs || 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={[theme.colors.backgroundGradientStart, theme.colors.backgroundGradientEnd]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(600).delay(100)} style={styles.header}>
          <View>
            <Text style={styles.greeting}>SMS Vault</Text>
            <Text style={styles.subtitle}>Your messages, your keys</Text>
          </View>
          <TouchableOpacity style={styles.profileIcon} activeOpacity={0.7}>
            <Icon name="person-circle" size={40} color={theme.colors.primary} />
          </TouchableOpacity>
        </Animated.View>

        {/* Status Card */}
        <Animated.View entering={FadeInDown.duration(600).delay(200)} layout={Layout.springify()}>
          <TouchableOpacity activeOpacity={0.9}>
            <LinearGradient
              colors={[theme.colors.glassBackgroundLight, theme.colors.glassBackground]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.statusCard}
            >
              <View style={styles.statusHeader}>
                <View style={styles.statusIndicator}>
                  <View style={[styles.statusDot, { backgroundColor: hasBackups ? theme.colors.success : theme.colors.warning }]} />
                  <Text style={styles.statusTitle}>
                    {hasBackups ? 'Protected' : 'Not Backed Up'}
                  </Text>
                </View>
                {hasBackups && (
                  <View style={styles.encryptionBadge}>
                    <Icon name="lock-closed" size={12} color={theme.colors.encryption} />
                    <Text style={styles.encryptionText}>Encrypted</Text>
                  </View>
                )}
              </View>

              {hasBackups ? (
                <>
                  <Text style={styles.lastBackupText}>
                    Last backup: {formatDate(latestBackup.date)}
                  </Text>
                  <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                      <Icon name="chatbubble" size={18} color={theme.colors.primary} />
                      <Text style={styles.statValue}>{totalSms.toLocaleString()}</Text>
                      <Text style={styles.statLabel}>SMS</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                      <Icon name="call" size={18} color={theme.colors.secondary} />
                      <Text style={styles.statValue}>{totalCalls.toLocaleString()}</Text>
                      <Text style={styles.statLabel}>Calls</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                      <Icon name="folder" size={18} color={theme.colors.info} />
                      <Text style={styles.statValue}>{formatBytes(latestBackup.sizeBytes)}</Text>
                      <Text style={styles.statLabel}>Size</Text>
                    </View>
                  </View>
                </>
              ) : (
                <Text style={styles.emptyText}>
                  Run your first backup to secure your messages and call logs.
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Quick Actions */}
        <Animated.View entering={FadeInDown.duration(600).delay(300)}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsRow}>
            <ActionButton
              icon="flash"
              label="Backup"
              onPress={() => nav.navigate('Backup')}
              color={theme.colors.primary}
            />
            <ActionButton
              icon="refresh"
              label="Restore"
              onPress={() => nav.navigate('Restore', {})}
              color={theme.colors.success}
            />
            <ActionButton
              icon="cloud"
              label="Cloud"
              onPress={() => nav.navigate('CloudManager')}
              color={theme.colors.cloud}
            />
            <ActionButton
              icon="settings"
              label="Settings"
              onPress={() => nav.getParent()?.navigate('Settings')}
              color={theme.colors.secondary}
            />
          </View>
        </Animated.View>

        {/* Backup History */}
        {hasBackups && (
          <Animated.View entering={FadeInUp.duration(600).delay(400)}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Backups</Text>
              <TouchableOpacity>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            
            {state.backups.slice(0, 5).map((backup, index) => (
              <Animated.View
                key={backup.id}
                entering={FadeInUp.duration(400).delay(500 + index * 100)}
                layout={Layout.springify()}
              >
                <TouchableOpacity style={styles.backupCard} activeOpacity={0.7}>
                  <View style={styles.backupLeft}>
                    <View style={styles.backupIconContainer}>
                      <Icon name="document-text" size={24} color={theme.colors.primary} />
                    </View>
                    <View style={styles.backupInfo}>
                      <Text style={styles.backupDate}>{formatDate(backup.date)}</Text>
                      <Text style={styles.backupStats}>
                        {formatSmsCount(backup.totalSms)} · {formatCallCount(backup.totalCallLogs)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.backupRight}>
                    <Text style={styles.backupSize}>{formatBytes(backup.sizeBytes)}</Text>
                    <View style={styles.backupStatusContainer}>
                      {backup.isEncrypted && (
                        <Icon name="lock-closed" size={12} color={theme.colors.encryption} />
                      )}
                      {backup.isComplete && (
                        <Icon name="checkmark-circle" size={16} color={theme.colors.success} />
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </Animated.View>
        )}

        {/* Cloud Status */}
        <Animated.View entering={FadeInUp.duration(600).delay(600)} style={styles.cloudSection}>
          <TouchableOpacity
            style={styles.cloudCard}
            onPress={() => nav.navigate('CloudManager')}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={[theme.colors.cloud + '20', theme.colors.cloud + '05']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cloudGradient}
            >
              <View style={styles.cloudLeft}>
                <Icon name="cloud" size={32} color={theme.colors.cloud} />
                <View style={styles.cloudInfo}>
                  <Text style={styles.cloudTitle}>Cloud Storage</Text>
                  <Text style={styles.cloudSubtitle}>
                    {state.cloudAccounts.length > 0
                      ? `${state.cloudAccounts.length} connected`
                      : 'Connect to enable cloud backup'}
                  </Text>
                </View>
              </View>
              <Icon name="chevron-forward" size={20} color={theme.colors.textTertiary} />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

// === Sub-components ===

function ActionButton({
  icon,
  label,
  onPress,
  color,
}: {
  icon: string;
  label: string;
  onPress: () => void;
  color: string;
}) {
  return (
    <TouchableOpacity style={styles.actionBtn} onPress={onPress} activeOpacity={0.7}>
      <LinearGradient
        colors={[color + '30', color + '10']}
        style={styles.actionIconBg}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Icon name={icon} size={28} color={color} />
      </LinearGradient>
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

// === Styles ===

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: screenPadding,
    paddingTop: 60,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.xl,
  },
  greeting: {
    ...theme.typography.displayMedium,
    color: theme.colors.text,
  },
  subtitle: {
    ...theme.typography.bodyMedium,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  profileIcon: {
    padding: theme.spacing.xs,
  },

  // Status Card
  statusCard: {
    ...glassCard,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: theme.spacing.sm,
    ...theme.shadow.glowSuccess,
  },
  statusTitle: {
    ...theme.typography.titleMedium,
    color: theme.colors.text,
  },
  encryptionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    backgroundColor: theme.colors.encryptionLight,
    borderRadius: theme.borderRadius.full,
  },
  encryptionText: {
    ...theme.typography.labelSmall,
    color: theme.colors.encryption,
    marginLeft: theme.spacing.xs,
  },
  lastBackupText: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.glassBorder,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    ...theme.typography.titleMedium,
    color: theme.colors.text,
    marginTop: theme.spacing.xs,
  },
  statLabel: {
    ...theme.typography.labelSmall,
    color: theme.colors.textTertiary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: theme.colors.glassBorder,
  },
  emptyText: {
    ...theme.typography.bodyMedium,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
    marginTop: theme.spacing.sm,
  },

  // Quick Actions
  sectionTitle: {
    ...theme.typography.titleMedium,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  seeAllText: {
    ...theme.typography.labelMedium,
    color: theme.colors.primary,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xl,
  },
  actionBtn: {
    alignItems: 'center',
    width: (screenWidth - screenPadding * 2 - theme.spacing.md * 3) / 4,
  },
  actionIconBg: {
    width: 64,
    height: 64,
    borderRadius: theme.borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
  },
  actionLabel: {
    ...theme.typography.labelSmall,
    color: theme.colors.textSecondary,
  },

  // Backup History
  backupCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  backupLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backupIconContainer: {
    width: 44,
    height: 44,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.primarySurface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  backupInfo: {
    flex: 1,
  },
  backupDate: {
    ...theme.typography.bodyMedium,
    color: theme.colors.text,
    fontWeight: '600',
  },
  backupStats: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  backupRight: {
    alignItems: 'flex-end',
  },
  backupSize: {
    ...theme.typography.caption,
    color: theme.colors.textTertiary,
  },
  backupStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.xs,
    gap: 4,
  },

  // Cloud Section
  cloudSection: {
    marginTop: theme.spacing.md,
  },
  cloudCard: {
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.cloud + '30',
  },
  cloudGradient: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  cloudLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cloudInfo: {
    marginLeft: theme.spacing.md,
  },
  cloudTitle: {
    ...theme.typography.titleMedium,
    color: theme.colors.text,
  },
  cloudSubtitle: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
});
