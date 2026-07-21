import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/Ionicons';
import { useApp } from '../services/AppContext';
import { theme, glassCard, screenPadding } from '../utils/theme';
import { CLOUD_LABELS, CLOUD_COLORS, formatBytes } from '../utils/helpers';
import type { CloudProvider, CloudAccount } from '../types';

// ============================================================
// SMS Vault v2.0 - Cloud Manager Screen
// ============================================================

const PROVIDERS: CloudProvider[] = ['google_drive', 'onedrive', 'dropbox'];

const PROVIDER_DESCRIPTIONS: Record<CloudProvider, string> = {
  google_drive: 'Store encrypted backups in your Google Drive account',
  onedrive: 'Store encrypted backups in your Microsoft OneDrive account',
  dropbox: 'Store encrypted backups in your Dropbox account',
};

const PROVIDER_STORAGE_INFO: Record<CloudProvider, string> = {
  google_drive: '15 GB free',
  onedrive: '5 GB free',
  dropbox: '2 GB free',
};

export default function CloudManagerScreen() {
  const nav = useNavigation();
  const { state, dispatch, connectCloud, disconnectCloud } = useApp();

  const getAccount = (provider: CloudProvider): CloudAccount | undefined =>
    state.cloudAccounts.find((a) => a.provider === provider);

  const handleConnect = async (provider: CloudProvider) => {
    await connectCloud(provider);
  };

  const handleDisconnect = async (provider: CloudProvider) => {
    await disconnectCloud(provider);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[theme.colors.backgroundGradientStart, theme.colors.backgroundGradientEnd]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content}>
          {/* Header */}
          <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
            <TouchableOpacity onPress={() => nav.goBack()} style={styles.backBtn}>
              <Icon name="close" size={24} color={theme.colors.textSecondary} />
            </TouchableOpacity>
            <Text style={styles.title}>Cloud Storage</Text>
            <View style={{ width: 40 }} />
          </Animated.View>

          {/* Description */}
          <Animated.View entering={FadeInDown.duration(400).delay(100)}>
            <Text style={styles.description}>
              Connect cloud accounts to store your encrypted backups off-device.
              Your data is always encrypted before upload.
            </Text>
          </Animated.View>

          {/* Cloud Provider Cards */}
          {PROVIDERS.map((provider, index) => {
            const account = getAccount(provider);
            const isConnected = account?.isConnected ?? false;

            return (
              <Animated.View
                key={provider}
                entering={FadeInUp.duration(400).delay(200 + index * 100)}
              >
                <View style={styles.cloudCard}>
                  <View style={styles.cloudHeader}>
                    <View style={[styles.providerIcon, { backgroundColor: CLOUD_COLORS[provider] + '20' }]}>
                      <Icon
                        name={provider === 'google_drive' ? 'logo-google' : provider === 'onedrive' ? 'cloud' : 'folder'}
                        size={28}
                        color={CLOUD_COLORS[provider]}
                      />
                    </View>
                    <View style={styles.cloudInfo}>
                      <View style={styles.cloudNameRow}>
                        <Text style={styles.cloudName}>{CLOUD_LABELS[provider]}</Text>
                        <View style={[styles.statusBadge, isConnected && styles.statusBadgeConnected]}>
                          <View style={[styles.statusDot, isConnected && styles.statusDotConnected]} />
                          <Text style={[styles.statusText, isConnected && styles.statusTextConnected]}>
                            {isConnected ? 'Connected' : 'Offline'}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.cloudDescription}>{PROVIDER_DESCRIPTIONS[provider]}</Text>
                      <Text style={styles.cloudStorage}>{PROVIDER_STORAGE_INFO[provider]}</Text>
                    </View>
                  </View>

                  {/* Account Info (if connected) */}
                  {isConnected && account && (
                    <View style={styles.accountInfo}>
                      <View style={styles.accountRow}>
                        <Icon name="person" size={16} color={theme.colors.textSecondary} />
                        <Text style={styles.accountEmail}>{account.email}</Text>
                      </View>
                      {account.storageTotal && (
                        <View style={styles.storageBar}>
                          <View style={styles.storageBarBackground}>
                            <View
                              style={[
                                styles.storageBarFill,
                                {
                                  width: `${((account.storageUsed || 0) / account.storageTotal) * 100}%`,
                                  backgroundColor: CLOUD_COLORS[provider],
                                },
                              ]}
                            />
                          </View>
                          <Text style={styles.storageText}>
                            {formatBytes(account.storageUsed || 0)} / {formatBytes(account.storageTotal)}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}

                  {/* Action Button */}
                  <TouchableOpacity
                    style={[
                      styles.actionBtn,
                      isConnected ? styles.disconnectBtn : styles.connectBtn,
                      { borderColor: isConnected ? theme.colors.border : CLOUD_COLORS[provider] },
                    ]}
                    onPress={() => (isConnected ? handleDisconnect(provider) : handleConnect(provider))}
                    activeOpacity={0.7}
                  >
                    <Icon
                      name={isConnected ? 'log-out' : 'log-in'}
                      size={18}
                      color={isConnected ? theme.colors.textSecondary : CLOUD_COLORS[provider]}
                    />
                    <Text
                      style={[
                        styles.actionBtnText,
                        isConnected ? styles.disconnectBtnText : { color: CLOUD_COLORS[provider] },
                      ]}
                    >
                      {isConnected ? 'Disconnect' : `Connect ${CLOUD_LABELS[provider]}`}
                    </Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            );
          })}

          {/* Security Note */}
          <Animated.View entering={FadeInUp.duration(400).delay(600)}>
            <View style={styles.securityNote}>
              <Icon name="shield-checkmark" size={24} color={theme.colors.success} />
              <View style={styles.securityNoteContent}>
                <Text style={styles.securityNoteTitle}>Zero-Knowledge Security</Text>
                <Text style={styles.securityNoteText}>
                  Your backups are encrypted with AES-256-GCM before leaving your device.
                  Cloud providers only store encrypted data and cannot read your messages.
                </Text>
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// === Styles ===

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: screenPadding,
    paddingBottom: 48,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    marginTop: theme.spacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    ...theme.typography.headlineMedium,
    color: theme.colors.text,
  },
  description: {
    ...theme.typography.bodyMedium,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xl,
    lineHeight: 22,
  },

  // Cloud Cards
  cloudCard: {
    ...glassCard,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  cloudHeader: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
  },
  providerIcon: {
    width: 56,
    height: 56,
    borderRadius: theme.borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  cloudInfo: {
    flex: 1,
  },
  cloudNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  cloudName: {
    ...theme.typography.titleMedium,
    color: theme.colors.text,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: theme.borderRadius.full,
  },
  statusBadgeConnected: {
    backgroundColor: theme.colors.success + '20',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.textTertiary,
    marginRight: 4,
  },
  statusDotConnected: {
    backgroundColor: theme.colors.success,
  },
  statusText: {
    ...theme.typography.labelSmall,
    color: theme.colors.textTertiary,
  },
  statusTextConnected: {
    color: theme.colors.success,
  },
  cloudDescription: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  cloudStorage: {
    ...theme.typography.caption,
    color: theme.colors.textTertiary,
  },

  // Account Info
  accountInfo: {
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  accountEmail: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.sm,
  },
  storageBar: {
    marginTop: theme.spacing.xs,
  },
  storageBarBackground: {
    height: 6,
    backgroundColor: theme.colors.border,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  storageBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  storageText: {
    ...theme.typography.labelSmall,
    color: theme.colors.textTertiary,
    textAlign: 'right',
  },

  // Action Buttons
  actionBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
  },
  connectBtn: {
    backgroundColor: 'transparent',
  },
  disconnectBtn: {
    backgroundColor: theme.colors.surfaceVariant,
  },
  actionBtnText: {
    ...theme.typography.labelLarge,
    marginLeft: theme.spacing.sm,
  },
  disconnectBtnText: {
    color: theme.colors.textSecondary,
  },

  // Security Note
  securityNote: {
    flexDirection: 'row',
    backgroundColor: theme.colors.success + '10',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginTop: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.success + '30',
  },
  securityNoteContent: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  securityNoteTitle: {
    ...theme.typography.titleSmall,
    color: theme.colors.success,
    marginBottom: theme.spacing.xs,
  },
  securityNoteText: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
});
