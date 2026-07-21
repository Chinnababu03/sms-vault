import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import LinearGradient from 'react-native-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/Ionicons';
import { useApp } from '../services/AppContext';
import { theme, glassCard, screenPadding } from '../utils/theme';
import { CLOUD_LABELS, CLOUD_COLORS } from '../utils/helpers';
import type { RootStackParamList, CloudProvider, BackupStep } from '../types';

// ============================================================
// SMS Vault v2.0 - Backup Screen
// ============================================================

type Nav = NativeStackNavigationProp<RootStackParamList>;

const BACKUP_STEPS: { id: BackupStep; label: string; icon: string }[] = [
  { id: 'reading_sms', label: 'Reading SMS', icon: 'chatbubble' },
  { id: 'reading_mms', label: 'Reading MMS', icon: 'image' },
  { id: 'reading_calllogs', label: 'Reading Call Logs', icon: 'call' },
  { id: 'serializing', label: 'Preparing Data', icon: 'document-text' },
  { id: 'encrypting', label: 'Encrypting', icon: 'lock-closed' },
  { id: 'saving_local', label: 'Saving Locally', icon: 'folder' },
  { id: 'uploading', label: 'Uploading', icon: 'cloud-upload' },
  { id: 'complete', label: 'Complete', icon: 'checkmark-circle' },
];

export default function BackupScreen() {
  const nav = useNavigation<Nav>();
  const { state, startBackup } = useApp();
  const [selectedClouds, setSelectedClouds] = useState<CloudProvider[]>(
    state.cloudAccounts.filter((a) => a.isConnected).map((a) => a.provider)
  );

  const toggleCloud = (provider: CloudProvider) => {
    setSelectedClouds((prev) =>
      prev.includes(provider) ? prev.filter((p) => p !== provider) : [...prev, provider]
    );
  };

  const handleStart = async () => {
    await startBackup();
    setTimeout(() => {
      nav.goBack();
    }, 2000);
  };

  // === Progress View ===
  if (state.isBackingUp && state.backupProgress) {
    const progress = state.backupProgress;
    const currentStepIndex = BACKUP_STEPS.findIndex((s) => s.id === progress.step);

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
                colors={[theme.colors.primary + '30', theme.colors.primary + '10']}
                style={styles.progressIconGradient}
              >
                <Icon
                  name={progress.step === 'complete' ? 'checkmark-circle' : 'shield-checkmark'}
                  size={64}
                  color={progress.step === 'complete' ? theme.colors.success : theme.colors.primary}
                />
              </LinearGradient>
            </View>
            <Text style={styles.progressTitle}>
              {progress.step === 'complete' ? 'Backup Complete!' : 'Securing Your Vault'}
            </Text>
          </Animated.View>

          {/* Progress Bar */}
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

          {/* Steps List */}
          <View style={styles.stepsList}>
            {BACKUP_STEPS.map((step, index) => {
              const isDone = index < currentStepIndex || progress.step === 'complete';
              const isCurrent = index === currentStepIndex && progress.step !== 'complete';

              if (progress.step === 'complete' && index === BACKUP_STEPS.length - 1) {
                return (
                  <Animated.View key={step.id} entering={FadeInDown.delay(100 * index)} style={styles.stepRow}>
                    <View style={[styles.stepIcon, styles.stepIconDone]}>
                      <Icon name={step.icon} size={16} color={theme.colors.success} />
                    </View>
                    <Text style={[styles.stepText, styles.stepTextDone]}>{step.label}</Text>
                    <Icon name="checkmark-circle" size={20} color={theme.colors.success} />
                  </Animated.View>
                );
              }

              return (
                <Animated.View key={step.id} entering={FadeInDown.delay(100 * index)} style={styles.stepRow}>
                  <View
                    style={[
                      styles.stepIcon,
                      isDone && styles.stepIconDone,
                      isCurrent && styles.stepIconCurrent,
                    ]}
                  >
                    <Icon
                      name={isDone ? 'checkmark' : step.icon}
                      size={14}
                      color={
                        isDone
                          ? theme.colors.success
                          : isCurrent
                          ? theme.colors.primary
                          : theme.colors.textTertiary
                      }
                    />
                  </View>
                  <Text
                    style={[
                      styles.stepText,
                      isDone && styles.stepTextDone,
                      isCurrent && styles.stepTextCurrent,
                    ]}
                  >
                    {step.label}
                  </Text>
                </Animated.View>
              );
            })}
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // === Setup View ===
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
            <Text style={styles.title}>Back Up Now</Text>
            <View style={{ width: 40 }} />
          </Animated.View>

          {/* Backup Info */}
          <Animated.View entering={FadeInDown.duration(400).delay(100)}>
            <View style={[styles.card, styles.infoCard]}>
              <View style={styles.infoHeader}>
                <Icon name="information-circle" size={24} color={theme.colors.info} />
                <Text style={styles.infoTitle}>Data to Back Up</Text>
              </View>
              <View style={styles.infoItem}>
                <Icon name="checkmark-circle" size={18} color={theme.colors.success} />
                <Text style={styles.infoText}>All SMS Messages</Text>
              </View>
              <View style={styles.infoItem}>
                <Icon name="checkmark-circle" size={18} color={theme.colors.success} />
                <Text style={styles.infoText}>All MMS Messages</Text>
              </View>
              <View style={styles.infoItem}>
                <Icon name="checkmark-circle" size={18} color={theme.colors.success} />
                <Text style={styles.infoText}>All Call Logs</Text>
              </View>
              <Text style={styles.infoNote}>
                An encrypted snapshot of your communications will be created securely.
              </Text>
            </View>
          </Animated.View>

          {/* Cloud Destinations */}
          <Animated.Text entering={FadeInDown.duration(400).delay(200)} style={styles.sectionTitle}>
            Cloud Destinations
          </Animated.Text>

          <Animated.View entering={FadeInDown.duration(400).delay(300)}>
            {state.cloudAccounts.length === 0 ? (
              <View style={styles.noCloudCard}>
                <Icon name="cloud-offline" size={32} color={theme.colors.textTertiary} />
                <Text style={styles.noCloudText}>
                  No cloud accounts connected.{'\n'}Your backup will only be saved locally.
                </Text>
                <TouchableOpacity
                  style={styles.connectCloudBtn}
                  onPress={() => nav.navigate('CloudManager')}
                >
                  <Text style={styles.connectCloudText}>Connect Cloud</Text>
                </TouchableOpacity>
              </View>
            ) : (
              state.cloudAccounts.map((account) => (
                <TouchableOpacity
                  key={account.provider}
                  style={[
                    styles.cloudCard,
                    selectedClouds.includes(account.provider) && styles.cloudCardSelected,
                  ]}
                  onPress={() => toggleCloud(account.provider)}
                  disabled={!account.isConnected}
                  activeOpacity={0.7}
                >
                  <View style={styles.cloudLeft}>
                    <View
                      style={[
                        styles.cloudDot,
                        { backgroundColor: CLOUD_COLORS[account.provider] },
                      ]}
                    />
                    <View style={styles.cloudInfo}>
                      <Text style={styles.cloudName}>{CLOUD_LABELS[account.provider]}</Text>
                      <Text style={styles.cloudStatus}>
                        {account.isConnected ? 'Ready' : 'Disconnected'}
                      </Text>
                    </View>
                  </View>
                  <View
                    style={[
                      styles.checkbox,
                      selectedClouds.includes(account.provider) && styles.checkboxChecked,
                    ]}
                  >
                    {selectedClouds.includes(account.provider) && (
                      <Icon name="checkmark" size={16} color={theme.colors.white} />
                    )}
                  </View>
                </TouchableOpacity>
              ))
            )}
          </Animated.View>

          {/* Start Button */}
          <Animated.View entering={FadeInUp.duration(500).delay(400)}>
            <TouchableOpacity style={styles.startBtn} onPress={handleStart} activeOpacity={0.8}>
              <LinearGradient
                colors={[theme.colors.primary, theme.colors.primaryDark]}
                style={styles.startBtnGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Icon name="flash" size={24} color={theme.colors.white} />
                <Text style={styles.startBtnText}>Start Backup</Text>
              </LinearGradient>
            </TouchableOpacity>
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

  // Info Card
  card: {
    ...glassCard,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  infoCard: {
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.info,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  infoTitle: {
    ...theme.typography.titleMedium,
    color: theme.colors.text,
    marginLeft: theme.spacing.sm,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  infoText: {
    ...theme.typography.bodyMedium,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.sm,
  },
  infoNote: {
    ...theme.typography.caption,
    color: theme.colors.textTertiary,
    marginTop: theme.spacing.md,
    fontStyle: 'italic',
  },

  // Section
  sectionTitle: {
    ...theme.typography.titleMedium,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },

  // No Cloud
  noCloudCard: {
    ...glassCard,
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  noCloudText: {
    ...theme.typography.bodyMedium,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  connectCloudBtn: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
  },
  connectCloudText: {
    ...theme.typography.labelLarge,
    color: theme.colors.white,
  },

  // Cloud Cards
  cloudCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cloudCardSelected: {
    borderColor: theme.colors.primary,
  },
  cloudLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cloudDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: theme.spacing.md,
  },
  cloudInfo: {
    flex: 1,
  },
  cloudName: {
    ...theme.typography.bodyMedium,
    color: theme.colors.text,
    fontWeight: '600',
  },
  cloudStatus: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },

  // Start Button
  startBtn: {
    marginTop: theme.spacing.xl,
    ...theme.shadow.glow,
  },
  startBtnGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.borderRadius.xl,
  },
  startBtnText: {
    ...theme.typography.titleMedium,
    color: theme.colors.white,
    fontWeight: '700',
    marginLeft: theme.spacing.sm,
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
    backgroundColor: theme.colors.primary,
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
    marginBottom: theme.spacing.xl,
  },
  stepsList: {
    width: '100%',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  stepIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  stepIconDone: {
    backgroundColor: theme.colors.success + '20',
  },
  stepIconCurrent: {
    backgroundColor: theme.colors.primary + '20',
    ...theme.shadow.glow,
  },
  stepText: {
    ...theme.typography.bodyMedium,
    color: theme.colors.textTertiary,
    flex: 1,
  },
  stepTextDone: {
    color: theme.colors.text,
  },
  stepTextCurrent: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
});
