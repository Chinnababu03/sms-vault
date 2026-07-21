import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/Ionicons';
import { useApp } from '../services/AppContext';
import { theme, glassCard, screenPadding } from '../utils/theme';
import { formatDate, formatBytes, formatSmsCount, formatCallCount } from '../utils/helpers';
import type { RootStackParamList } from '../types';

// ============================================================
// SMS Vault v2.0 - Restore Screen
// ============================================================

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'Restore'>;

export default function RestoreScreen() {
  const nav = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { state, startRestore } = useApp();
  const backups = state.backups;

  const handleRestore = async (backupId: string) => {
    await startRestore(backupId);
  };

  // === Progress View ===
  if (state.isRestoring && state.backupProgress) {
    const progress = state.backupProgress;
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[theme.colors.backgroundGradientStart, theme.colors.backgroundGradientEnd]}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <SafeAreaView style={styles.progressContainer}>
          <Animated.View entering={FadeInDown.duration(600)}>
            <View style={styles.progressIconContainer}>
              <LinearGradient
                colors={[theme.colors.success + '30', theme.colors.success + '10']}
                style={styles.progressIconGradient}
              >
                <Icon
                  name={progress.step === 'complete' ? 'checkmark-circle' : 'refresh'}
                  size={64}
                  color={progress.step === 'complete' ? theme.colors.success : theme.colors.primary}
                />
              </LinearGradient>
            </View>
            <Text style={styles.progressTitle}>
              {progress.step === 'complete' ? 'Restore Complete!' : 'Restoring Your Data'}
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(200)} style={styles.progressBarContainer}>
            <View style={styles.progressBarBackground}>
              <Animated.View
                style={[styles.progressBarFill, { width: `${progress.progress * 100}%` }]}
              />
            </View>
            <Text style={styles.progressPercent}>{Math.round(progress.progress * 100)}%</Text>
          </Animated.View>

          <Animated.Text entering={FadeInUp.delay(300)} style={styles.progressMessage}>
            {progress.message}
          </Animated.Text>
        </SafeAreaView>
      </View>
    );
  }

  // === Selection View ===
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
            <Text style={styles.title}>Restore</Text>
            <View style={{ width: 40 }} />
          </Animated.View>

          {backups.length === 0 ? (
            // Empty State
            <Animated.View entering={FadeInUp.duration(500).delay(100)}>
              <View style={styles.emptyCard}>
                <View style={styles.emptyIconContainer}>
                  <Icon name="folder-open" size={48} color={theme.colors.textTertiary} />
                </View>
                <Text style={styles.emptyTitle}>No Backups Found</Text>
                <Text style={styles.emptyDesc}>
                  Run a backup first before restoring.{'\n'}Your backed up messages will appear here.
                </Text>
              </View>
            </Animated.View>
          ) : (
            <>
              {/* Instructions */}
              <Animated.View entering={FadeInDown.duration(400).delay(100)}>
                <View style={styles.instructionsCard}>
                  <Icon name="information-circle" size={24} color={theme.colors.info} />
                  <Text style={styles.instructionsText}>
                    Select a backup to restore. This will write messages back to your device.
                  </Text>
                </View>
              </Animated.View>

              {/* Backup List */}
              <Animated.Text entering={FadeInDown.duration(400).delay(150)} style={styles.sectionTitle}>
                Available Backups
              </Animated.Text>

              {backups.map((backup, index) => (
                <Animated.View
                  key={backup.id}
                  entering={FadeInUp.duration(400).delay(200 + index * 100)}
                >
                  <TouchableOpacity
                    style={styles.backupCard}
                    onPress={() => handleRestore(backup.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.backupLeft}>
                      <View style={styles.backupIconContainer}>
                        <Icon name="document-text" size={24} color={theme.colors.primary} />
                      </View>
                      <View style={styles.backupInfo}>
                        <Text style={styles.backupDate}>{formatDate(backup.date)}</Text>
                        <Text style={styles.backupStats}>
                          {formatSmsCount(backup.totalSms)} · {formatCallCount(backup.totalCallLogs)}
                        </Text>
                        <Text style={styles.backupSize}>{formatBytes(backup.sizeBytes)}</Text>
                      </View>
                    </View>
                    <View style={styles.backupRight}>
                      <View style={styles.restoreBtn}>
                        <Icon name="refresh" size={18} color={theme.colors.white} />
                        <Text style={styles.restoreBtnText}>Restore</Text>
                      </View>
                      {backup.isEncrypted && (
                        <View style={styles.encryptedBadge}>
                          <Icon name="lock-closed" size={10} color={theme.colors.encryption} />
                          <Text style={styles.encryptedText}>Encrypted</Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </>
          )}
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
    marginBottom: theme.spacing.xl,
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

  // Empty State
  emptyCard: {
    ...glassCard,
    padding: theme.spacing.xxl,
    alignItems: 'center',
    marginTop: theme.spacing.xl,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: theme.colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  emptyTitle: {
    ...theme.typography.titleLarge,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  emptyDesc: {
    ...theme.typography.bodyMedium,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },

  // Instructions
  instructionsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.info + '15',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.info + '30',
  },
  instructionsText: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.sm,
    flex: 1,
    lineHeight: 18,
  },

  // Section
  sectionTitle: {
    ...theme.typography.titleMedium,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },

  // Backup Cards
  backupCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
  },
  backupLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backupIconContainer: {
    width: 48,
    height: 48,
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
  backupSize: {
    ...theme.typography.caption,
    color: theme.colors.textTertiary,
    marginTop: 2,
  },
  backupRight: {
    alignItems: 'flex-end',
    marginLeft: theme.spacing.md,
  },
  restoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    ...theme.shadow.glow,
  },
  restoreBtnText: {
    ...theme.typography.labelMedium,
    color: theme.colors.white,
    marginLeft: theme.spacing.xs,
  },
  encryptedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.xs,
  },
  encryptedText: {
    ...theme.typography.labelSmall,
    color: theme.colors.encryption,
    marginLeft: 4,
  },

  // Progress View
  progressContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  progressIconContainer: {
    marginBottom: theme.spacing.xl,
  },
  progressIconGradient: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.glassBorder,
  },
  progressTitle: {
    ...theme.typography.displaySmall,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  progressBarContainer: {
    width: '100%',
    marginBottom: theme.spacing.md,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: theme.colors.success,
    borderRadius: 4,
  },
  progressPercent: {
    ...theme.typography.labelMedium,
    color: theme.colors.textSecondary,
    textAlign: 'right',
    marginTop: theme.spacing.xs,
  },
  progressMessage: {
    ...theme.typography.bodyMedium,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});
