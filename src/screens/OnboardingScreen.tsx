import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/Ionicons';
import { useApp } from '../services/AppContext';
import { saveSettings } from '../services/storageService';
import {
  requestSmsPermission,
  hasSmsPermission,
  requestCallLogPermission,
  hasCallLogPermission,
  requestNotificationPermission,
} from '../services/nativeBridge';
import { theme, glassCard } from '../utils/theme';

// ============================================================
// SMS Vault v2.0 - Onboarding Screen
// ============================================================

const STEPS = [
  { id: 'welcome', title: 'Welcome', icon: 'shield-checkmark' },
  { id: 'permissions', title: 'Permissions', icon: 'key' },
  { id: 'encryption', title: 'Encryption', icon: 'lock-closed' },
  { id: 'complete', title: 'Ready', icon: 'checkmark-circle' },
] as const;

type StepId = typeof STEPS[number]['id'];

export default function OnboardingScreen() {
  const { state, dispatch } = useApp();
  const [currentStep, setCurrentStep] = useState<StepId>('welcome');
  const [smsGranted, setSmsGranted] = useState(false);
  const [callLogGranted, setCallLogGranted] = useState(false);
  const [notificationGranted, setNotificationGranted] = useState(false);

  const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep);

  const handleNext = () => {
    const idx = STEPS.findIndex((s) => s.id === currentStep);
    if (idx < STEPS.length - 1) {
      setCurrentStep(STEPS[idx + 1].id);
    }
  };

  const handleBack = () => {
    const idx = STEPS.findIndex((s) => s.id === currentStep);
    if (idx > 0) {
      setCurrentStep(STEPS[idx - 1].id);
    }
  };

  const handleComplete = async () => {
    const updated = { ...state.settings, onboardingComplete: true };
    dispatch({ type: 'SET_SETTINGS', payload: updated });
    await saveSettings(updated);
  };

  const handleRequestSms = async () => {
    const granted = await requestSmsPermission();
    setSmsGranted(granted);
  };

  const handleRequestCallLog = async () => {
    const granted = await requestCallLogPermission();
    setCallLogGranted(granted);
  };

  const handleRequestNotification = async () => {
    const granted = await requestNotificationPermission();
    setNotificationGranted(granted);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 'permissions':
        return smsGranted || callLogGranted;
      default:
        return true;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={[theme.colors.backgroundGradientStart, theme.colors.backgroundGradientEnd]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      <SafeAreaView style={styles.safeArea}>
        {/* Progress Dots */}
        <View style={styles.progressContainer}>
          {STEPS.map((step, index) => (
            <View
              key={step.id}
              style={[
                styles.progressDot,
                index <= currentStepIndex && styles.progressDotActive,
                index === currentStepIndex && styles.progressDotCurrent,
              ]}
            />
          ))}
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Welcome Step */}
          {currentStep === 'welcome' && (
            <Animated.View entering={FadeInDown.duration(600)} style={styles.stepContainer}>
              <View style={styles.iconContainer}>
                <LinearGradient
                  colors={[theme.colors.primary + '30', theme.colors.primary + '10']}
                  style={styles.iconGradient}
                >
                  <Icon name="shield-checkmark" size={64} color={theme.colors.primary} />
                </LinearGradient>
              </View>
              
              <Text style={styles.title}>SMS Vault</Text>
              <Text style={styles.subtitle}>
                Your messages, your keys.{'\n'}
                End-to-end encrypted SMS & call log backup.
              </Text>

              <View style={styles.featuresList}>
                <FeatureItem icon="lock-closed" text="AES-256-GCM encrypted backups" />
                <FeatureItem icon="cloud" text="Multi-cloud support (Drive, OneDrive, Dropbox)" />
                <FeatureItem icon="time" text="Scheduled automatic backups" />
                <FeatureItem icon="code-slash" text="100% free & open source" />
              </View>
            </Animated.View>
          )}

          {/* Permissions Step */}
          {currentStep === 'permissions' && (
            <Animated.View entering={FadeInDown.duration(600)} style={styles.stepContainer}>
              <View style={styles.iconContainer}>
                <LinearGradient
                  colors={[theme.colors.warning + '30', theme.colors.warning + '10']}
                  style={styles.iconGradient}
                >
                  <Icon name="key" size={64} color={theme.colors.warning} />
                </LinearGradient>
              </View>
              
              <Text style={styles.title}>Permissions</Text>
              <Text style={styles.subtitle}>
                SMS Vault needs a few permissions to read and back up your data.{'\n'}
                Your data never leaves your device without encryption.
              </Text>

              <View style={styles.permissionCard}>
                <View style={styles.permissionRow}>
                  <View style={styles.permissionInfo}>
                    <Icon name="chatbubble" size={24} color={theme.colors.primary} />
                    <View style={styles.permissionTextContainer}>
                      <Text style={styles.permissionTitle}>Read SMS</Text>
                      <Text style={styles.permissionDesc}>
                        Access your SMS messages for backup
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[styles.permissionBtn, smsGranted && styles.permissionGranted]}
                    onPress={handleRequestSms}
                  >
                    <Text style={[styles.permissionBtnText, smsGranted && styles.permissionGrantedText]}>
                      {smsGranted ? '✓ Granted' : 'Grant'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.permissionCard}>
                <View style={styles.permissionRow}>
                  <View style={styles.permissionInfo}>
                    <Icon name="call" size={24} color={theme.colors.secondary} />
                    <View style={styles.permissionTextContainer}>
                      <Text style={styles.permissionTitle}>Read Call Log</Text>
                      <Text style={styles.permissionDesc}>
                        Access your call history for backup
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[styles.permissionBtn, callLogGranted && styles.permissionGranted]}
                    onPress={handleRequestCallLog}
                  >
                    <Text style={[styles.permissionBtnText, callLogGranted && styles.permissionGrantedText]}>
                      {callLogGranted ? '✓ Granted' : 'Grant'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.permissionCard}>
                <View style={styles.permissionRow}>
                  <View style={styles.permissionInfo}>
                    <Icon name="notifications" size={24} color={theme.colors.warning} />
                    <View style={styles.permissionTextContainer}>
                      <Text style={styles.permissionTitle}>Notifications</Text>
                      <Text style={styles.permissionDesc}>
                        Get notified when backups complete (Android 13+)
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[styles.permissionBtn, notificationGranted && styles.permissionGranted]}
                    onPress={handleRequestNotification}
                  >
                    <Text style={[styles.permissionBtnText, notificationGranted && styles.permissionGrantedText]}>
                      {notificationGranted ? '✓ Granted' : 'Grant'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>
          )}

          {/* Encryption Step */}
          {currentStep === 'encryption' && (
            <Animated.View entering={FadeInDown.duration(600)} style={styles.stepContainer}>
              <View style={styles.iconContainer}>
                <LinearGradient
                  colors={[theme.colors.encryption + '30', theme.colors.encryption + '10']}
                  style={styles.iconGradient}
                >
                  <Icon name="lock-closed" size={64} color={theme.colors.encryption} />
                </LinearGradient>
              </View>
              
              <Text style={styles.title}>Encryption</Text>
              <Text style={styles.subtitle}>
                All backups are encrypted with AES-256-GCM before they leave your device.{'\n'}
                Your encryption key stays on your device — we can never read your data.
              </Text>

              <View style={styles.infoCard}>
                <View style={styles.infoHeader}>
                  <Icon name="finger-print" size={24} color={theme.colors.primary} />
                  <Text style={styles.infoTitle}>Zero-Knowledge Architecture</Text>
                </View>
                <Text style={styles.infoText}>
                  Your messages are encrypted on your device before uploading.{'\n'}
                  Cloud providers store only encrypted blobs — they cannot read your messages.
                </Text>
              </View>

              <View style={styles.encryptionFeatures}>
                <EncryptionFeature icon="shield-checkmark" text="AES-256-GCM military-grade encryption" />
                <EncryptionFeature icon="key" text="PBKDF2 key derivation (100K iterations)" />
                <EncryptionFeature icon="finger-print" text="Unique encryption key per backup" />
              </View>
            </Animated.View>
          )}

          {/* Complete Step */}
          {currentStep === 'complete' && (
            <Animated.View entering={FadeInDown.duration(600)} style={styles.stepContainer}>
              <View style={styles.iconContainer}>
                <LinearGradient
                  colors={[theme.colors.success + '30', theme.colors.success + '10']}
                  style={styles.iconGradient}
                >
                  <Icon name="checkmark-circle" size={64} color={theme.colors.success} />
                </LinearGradient>
              </View>
              
              <Text style={styles.title}>You're All Set!</Text>
              <Text style={styles.subtitle}>
                Your data is protected. Run your first backup to start securing{'\n'}
                your messages and call logs.
              </Text>

              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>What's Next?</Text>
                <SummaryItem icon="flash" text={'Tap "Backup" to create your first secure backup'} />
                <SummaryItem icon="cloud" text="Connect cloud storage for off-device backup" />
                <SummaryItem icon="time" text="Enable scheduled backups for automatic protection" />
              </View>
            </Animated.View>
          )}
        </ScrollView>

        {/* Navigation Buttons */}
        <View style={styles.buttonContainer}>
          {currentStep !== 'welcome' && (
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Icon name="arrow-back" size={20} color={theme.colors.textSecondary} />
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={[styles.nextButton, !canProceed() && styles.nextButtonDisabled]}
            onPress={currentStep === 'complete' ? handleComplete : handleNext}
            disabled={!canProceed()}
          >
            <LinearGradient
              colors={
                currentStep === 'complete'
                  ? [theme.colors.success, theme.colors.successDark]
                  : [theme.colors.primary, theme.colors.primaryDark]
              }
              style={styles.nextButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.nextButtonText}>
                {currentStep === 'complete' ? 'Get Started' : 'Continue'}
              </Text>
              <Icon
                name={currentStep === 'complete' ? 'checkmark' : 'arrow-forward'}
                size={20}
                color={theme.colors.white}
              />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

// === Sub-components ===

function FeatureItem({ icon, text }: { icon: string; text: string }) {
  return (
    <Animated.View entering={FadeInUp.delay(200)} style={styles.featureRow}>
      <View style={styles.featureIconContainer}>
        <Icon name={icon} size={20} color={theme.colors.primary} />
      </View>
      <Text style={styles.featureText}>{text}</Text>
    </Animated.View>
  );
}

function EncryptionFeature({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.encryptionFeatureRow}>
      <Icon name={icon} size={18} color={theme.colors.encryption} />
      <Text style={styles.encryptionFeatureText}>{text}</Text>
    </View>
  );
}

function SummaryItem({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.summaryItem}>
      <Icon name={icon} size={18} color={theme.colors.primary} />
      <Text style={styles.summaryText}>{text}</Text>
    </View>
  );
}

// === Styles ===

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
    gap: 8,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.surfaceVariant,
  },
  progressDotActive: {
    backgroundColor: theme.colors.primary + '60',
  },
  progressDotCurrent: {
    backgroundColor: theme.colors.primary,
    width: 28,
    ...theme.shadow.glow,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.xl,
  },
  stepContainer: {
    alignItems: 'center',
    paddingTop: theme.spacing.xl,
  },
  iconContainer: {
    marginBottom: theme.spacing.xl,
  },
  iconGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
  },
  title: {
    ...theme.typography.displaySmall,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  subtitle: {
    ...theme.typography.bodyLarge,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: theme.spacing.xl,
  },
  featuresList: {
    alignSelf: 'stretch',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  featureIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primarySurface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  featureText: {
    ...theme.typography.bodyLarge,
    color: theme.colors.text,
    flex: 1,
  },
  permissionCard: {
    ...glassCard,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    alignSelf: 'stretch',
  },
  permissionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  permissionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: theme.spacing.md,
  },
  permissionTextContainer: {
    marginLeft: theme.spacing.md,
    flex: 1,
  },
  permissionTitle: {
    ...theme.typography.titleMedium,
    color: theme.colors.text,
  },
  permissionDesc: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  permissionBtn: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.primary,
  },
  permissionGranted: {
    backgroundColor: theme.colors.success + '20',
  },
  permissionBtnText: {
    ...theme.typography.labelLarge,
    color: theme.colors.white,
  },
  permissionGrantedText: {
    color: theme.colors.success,
  },
  infoCard: {
    ...glassCard,
    padding: theme.spacing.lg,
    alignSelf: 'stretch',
    marginBottom: theme.spacing.lg,
    backgroundColor: theme.colors.primarySurface,
    borderColor: theme.colors.primary + '30',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  infoTitle: {
    ...theme.typography.titleMedium,
    color: theme.colors.text,
    marginLeft: theme.spacing.sm,
  },
  infoText: {
    ...theme.typography.bodyMedium,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  encryptionFeatures: {
    alignSelf: 'stretch',
  },
  encryptionFeatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  encryptionFeatureText: {
    ...theme.typography.bodyMedium,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.md,
  },
  summaryCard: {
    ...glassCard,
    padding: theme.spacing.lg,
    alignSelf: 'stretch',
  },
  summaryTitle: {
    ...theme.typography.titleMedium,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  summaryText: {
    ...theme.typography.bodyMedium,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.md,
    flex: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.xl,
    paddingTop: theme.spacing.md,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
  },
  backButtonText: {
    ...theme.typography.labelLarge,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.xs,
  },
  nextButton: {
    flex: 1,
    maxWidth: 200,
    marginLeft: theme.spacing.lg,
    ...theme.shadow.glow,
  },
  nextButtonDisabled: {
    opacity: 0.5,
  },
  nextButtonGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
  },
  nextButtonText: {
    ...theme.typography.labelLarge,
    color: theme.colors.white,
    marginRight: theme.spacing.xs,
  },
});
