// ============================================================
// SMS Vault v2.0 - Progress Overlay
// Full-screen modal-style overlay showing backup/restore progress.
// ============================================================

import React from 'react';
import { View, Text, StyleSheet, Modal, ActivityIndicator, TouchableOpacity } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Animated, { FadeInDown, FadeInUp, withSpring, useSharedValue, useAnimatedStyle } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../utils/theme';
import type { BackupProgress, BackupStep } from '../types';

export interface ProgressOverlayProps {
  visible: boolean;
  progress: BackupProgress | null;
  steps?: BackupStep[];
  /** Title rendered above the icon — defaults to "Securing Your Vault". */
  title?: string;
  /** Called when the user dismisses (only shown after completion/error). */
  onDismiss?: () => void;
}

const DEFAULT_STEPS: BackupStep[] = [
  'initializing',
  'reading_sms',
  'reading_mms',
  'reading_calllogs',
  'serializing',
  'encrypting',
  'saving_local',
  'uploading',
  'complete',
];

const STEP_LABELS: Record<BackupStep, string> = {
  initializing: 'Preparing',
  reading_sms: 'Reading SMS',
  reading_mms: 'Reading MMS',
  reading_calllogs: 'Reading Call Logs',
  serializing: 'Preparing Data',
  encrypting: 'Encrypting',
  saving_local: 'Saving Locally',
  uploading: 'Uploading',
  complete: 'Complete',
  error: 'Error',
};

const STEP_ICONS: Record<BackupStep, string> = {
  initializing: 'ellipsis-horizontal',
  reading_sms: 'chatbubble',
  reading_mms: 'image',
  reading_calllogs: 'call',
  serializing: 'document-text',
  encrypting: 'lock-closed',
  saving_local: 'folder',
  uploading: 'cloud-upload',
  complete: 'checkmark-circle',
  error: 'alert-circle',
};

export function ProgressOverlay(props: ProgressOverlayProps): React.ReactElement | null {
  const { visible, progress, steps = DEFAULT_STEPS, title = 'Securing Your Vault', onDismiss } = props;
  const widthSV = useSharedValue(0);

  React.useEffect(() => {
    if (progress) {
      widthSV.value = withSpring(progress.progress, theme.animation.spring);
    }
  }, [progress]);

  const barAnim = useAnimatedStyle(() => ({
    width: `${Math.round(widthSV.value * 100)}%`,
  }));

  if (!visible || !progress) return null;

  const isError = progress.step === 'error';
  const isComplete = progress.step === 'complete';
  const currentIndex = steps.indexOf(progress.step);
  const icon = isError
    ? 'alert-circle'
    : isComplete
    ? 'checkmark-circle'
    : STEP_ICONS[progress.step];
  const iconColor = isError
    ? theme.colors.error
    : isComplete
    ? theme.colors.success
    : theme.colors.primary;
  const header = isError
    ? 'Backup Failed'
    : isComplete
    ? 'All Done!'
    : title;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.backdrop}>
        <LinearGradient
          colors={[theme.colors.backgroundGradientStart, theme.colors.backgroundGradientEnd]}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <SafeAreaView style={styles.safe}>
          <View style={styles.container}>
            <Animated.View entering={FadeInDown.duration(500)} style={styles.iconWrap}>
              <LinearGradient
                colors={[iconColor + '30', iconColor + '10']}
                style={styles.iconGradient}
              >
                {isComplete || isError ? (
                  <Icon name={icon} size={64} color={iconColor} />
                ) : (
                  <ActivityIndicator size="large" color={iconColor} />
                )}
              </LinearGradient>
            </Animated.View>

            <Text style={styles.title}>{header}</Text>

            {/* Progress Bar */}
            <View style={styles.barWrap}>
              <View style={styles.barBg}>
                <Animated.View
                  style={[styles.barFill, isError && styles.barFillError, barAnim]}
                />
              </View>
              <Text style={styles.percent}>{Math.round(progress.progress * 100)}%</Text>
            </View>

            <Animated.Text entering={FadeInUp.delay(300)} style={styles.message}>
              {progress.message}
            </Animated.Text>

            {/* Steps List */}
            <View style={styles.stepsList}>
              {steps.map((stepId, idx) => {
                const isDone = isComplete || (currentIndex >= 0 && idx < currentIndex);
                const isCurrent = idx === currentIndex;
                const past = currentIndex >= 0 && idx <= currentIndex;
                return (
                  <Animated.View
                    key={stepId}
                    entering={FadeInDown.delay(50 * idx)}
                    style={[styles.stepRow, !past && styles.stepRowPending]}
                  >
                    <View
                      style={[
                        styles.stepIcon,
                        isDone && styles.stepIconDone,
                        isCurrent && styles.stepIconCurrent,
                      ]}
                    >
                      <Icon
                        name={isDone ? 'checkmark' : STEP_ICONS[stepId]}
                        size={12}
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
                      {STEP_LABELS[stepId]}
                    </Text>
                  </Animated.View>
                );
              })}
            </View>

            {(isComplete || isError) && onDismiss ? (
              <TouchableOpacity activeOpacity={0.7} onPress={onDismiss} style={styles.dismissBtn}>
                <Text style={styles.dismissText}>Dismiss</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
  },
  safe: { flex: 1 },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  iconWrap: { marginBottom: theme.spacing.lg },
  iconGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.glassBorder,
  },
  title: {
    ...theme.typography.displaySmall,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  barWrap: { width: '100%', marginBottom: theme.spacing.md },
  barBg: {
    height: 8,
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
  },
  barFillError: { backgroundColor: theme.colors.error },
  percent: {
    ...theme.typography.labelMedium,
    color: theme.colors.textSecondary,
    textAlign: 'right',
    marginTop: theme.spacing.xs,
  },
  message: {
    ...theme.typography.bodyMedium,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  stepsList: { width: '100%', maxWidth: 280 },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
  },
  stepRowPending: { opacity: 0.55 },
  stepIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  },
  stepIconDone: { backgroundColor: theme.colors.success + '20' },
  stepIconCurrent: { backgroundColor: theme.colors.primary + '20' },
  stepText: {
    ...theme.typography.bodySmall,
    color: theme.colors.textTertiary,
    flex: 1,
  },
  stepTextDone: { color: theme.colors.text },
  stepTextCurrent: { color: theme.colors.primary, fontWeight: '700' },
  dismissBtn: {
    marginTop: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.primary,
  },
  dismissText: {
    ...theme.typography.labelLarge,
    color: theme.colors.white,
  },
});

export default ProgressOverlay;
