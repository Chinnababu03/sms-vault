import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/Ionicons';
import { useApp } from '../services/AppContext';
import { saveSettings, clearAllData } from '../services/storageService';
import { theme, glassCard, screenPadding } from '../utils/theme';

// ============================================================
// SMS Vault v2.0 - Settings Screen
// ============================================================

export default function SettingsScreen() {
  const { state, dispatch } = useApp();
  const settings = state.settings;

  const updateSetting = async <K extends keyof typeof settings>(
    key: K,
    value: (typeof settings)[K]
  ) => {
    const updated = { ...settings, [key]: value };
    dispatch({ type: 'SET_SETTINGS', payload: updated });
    await saveSettings(updated);
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will delete all backups and settings. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await clearAllData();
            dispatch({ type: 'SET_BACKUPS', payload: [] });
            dispatch({ type: 'SET_CLOUD_ACCOUNTS', payload: [] });
            Alert.alert('Success', 'All data has been cleared.');
          },
        },
      ]
    );
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
          {/* Title */}
          <Animated.Text entering={FadeInDown.duration(400)} style={styles.screenTitle}>
            Settings
          </Animated.Text>

          {/* Backup Settings */}
          <Animated.View entering={FadeInDown.duration(400).delay(100)}>
            <Text style={styles.sectionTitle}>Backup Data</Text>
            <View style={styles.card}>
              <SettingRow
                icon="chatbubble"
                label="Backup SMS"
                value={settings.backupSms}
                onToggle={(v) => updateSetting('backupSms', v)}
              />
              <Divider />
              <SettingRow
                icon="image"
                label="Backup MMS"
                value={settings.backupMms}
                onToggle={(v) => updateSetting('backupMms', v)}
              />
              <Divider />
              <SettingRow
                icon="call"
                label="Backup Call Logs"
                value={settings.backupCallLogs}
                onToggle={(v) => updateSetting('backupCallLogs', v)}
              />
              <Divider />
              <SettingRow
                icon="lock-closed"
                label="Encrypt Backups"
                description="AES-256-GCM encryption before upload"
                value={settings.encryptBackups}
                onToggle={(v) => updateSetting('encryptBackups', v)}
              />
              <Divider />
              <SettingRow
                icon="repeat"
                label="Incremental Mode"
                description="Only backup new messages since last backup"
                value={settings.incrementalMode}
                onToggle={(v) => updateSetting('incrementalMode', v)}
              />
            </View>
          </Animated.View>

          {/* Scheduling Settings */}
          <Animated.View entering={FadeInDown.duration(400).delay(200)}>
            <Text style={styles.sectionTitle}>Scheduling</Text>
            <View style={styles.card}>
              <SettingRow
                icon="time"
                label="Scheduled Backups"
                value={settings.scheduledBackup}
                onToggle={(v) => updateSetting('scheduledBackup', v)}
              />
              <Divider />
              <SettingRow
                icon="wifi"
                label="WiFi Only"
                description="Only back up on unmetered connections"
                value={settings.wifiOnly}
                onToggle={(v) => updateSetting('wifiOnly', v)}
              />
              <Divider />
              <SettingRow
                icon="battery-charging"
                label="Charging Only"
                description="Only back up when device is charging"
                value={settings.chargingOnly}
                onToggle={(v) => updateSetting('chargingOnly', v)}
              />
            </View>
          </Animated.View>

          {/* Storage Settings */}
          <Animated.View entering={FadeInDown.duration(400).delay(300)}>
            <Text style={styles.sectionTitle}>Storage</Text>
            <View style={styles.card}>
              <SettingRow
                icon="trash"
                label="Auto-delete Old Backups"
                value={settings.autoDeleteOldBackups}
                onToggle={(v) => updateSetting('autoDeleteOldBackups', v)}
              />
              <Divider />
              <View style={styles.infoRow}>
                <View style={styles.infoLeft}>
                  <Icon name="folder" size={20} color={theme.colors.primary} />
                  <Text style={styles.infoLabel}>Keep Backups</Text>
                </View>
                <Text style={styles.infoValue}>{settings.keepBackupsCount}</Text>
              </View>
            </View>
          </Animated.View>

          {/* Security Settings */}
          <Animated.View entering={FadeInDown.duration(400).delay(400)}>
            <Text style={styles.sectionTitle}>Security</Text>
            <View style={styles.card}>
              <SettingRow
                icon="finger-print"
                label="Biometric Lock"
                description="Require fingerprint or face to open app"
                value={settings.biometricLock}
                onToggle={(v) => updateSetting('biometricLock', v)}
              />
              <Divider />
              <SettingRow
                icon="eye-off"
                label="Hide Notification Content"
                description="Hide message previews in notifications"
                value={settings.hideNotificationContent}
                onToggle={(v) => updateSetting('hideNotificationContent', v)}
              />
            </View>
          </Animated.View>

          {/* About */}
          <Animated.View entering={FadeInDown.duration(400).delay(500)}>
            <Text style={styles.sectionTitle}>About</Text>
            <View style={styles.card}>
              <View style={styles.aboutRow}>
                <Text style={styles.aboutLabel}>Version</Text>
                <Text style={styles.aboutValue}>2.0.0</Text>
              </View>
              <Divider />
              <TouchableOpacity style={styles.aboutRow}>
                <Text style={styles.aboutLabel}>Open Source License</Text>
                <Icon name="chevron-forward" size={18} color={theme.colors.textTertiary} />
              </TouchableOpacity>
              <Divider />
              <TouchableOpacity style={styles.aboutRow}>
                <Text style={styles.aboutLabel}>Privacy Policy</Text>
                <Icon name="chevron-forward" size={18} color={theme.colors.textTertiary} />
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Danger Zone */}
          <Animated.View entering={FadeInDown.duration(400).delay(600)}>
            <Text style={[styles.sectionTitle, styles.dangerTitle]}>Danger Zone</Text>
            <View style={styles.dangerCard}>
              <TouchableOpacity style={styles.dangerBtn} onPress={handleClearData}>
                <Icon name="trash" size={20} color={theme.colors.error} />
                <Text style={styles.dangerBtnText}>Clear All Data</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Footer */}
          <Animated.View entering={FadeInDown.duration(400).delay(700)} style={styles.footer}>
            <Text style={styles.footerText}>
              SMS Vault is open source and free forever.{'\n'}
              Your data stays on your device.
            </Text>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// === Sub-components ===

function SettingRow({
  icon,
  label,
  description,
  value,
  onToggle,
}: {
  icon: string;
  label: string;
  description?: string;
  value: boolean;
  onToggle: (v: boolean) => void;
}) {
  return (
    <View style={styles.settingRow}>
      <View style={styles.settingLeft}>
        <Icon name={icon} size={20} color={theme.colors.primary} />
        <View style={styles.settingTextContainer}>
          <Text style={styles.settingLabel}>{label}</Text>
          {description && <Text style={styles.settingDescription}>{description}</Text>}
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{
          false: theme.colors.surfaceVariant,
          true: theme.colors.primary + '60',
        }}
        thumbColor={value ? theme.colors.primary : theme.colors.textTertiary}
        ios_backgroundColor={theme.colors.surfaceVariant}
      />
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
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
  screenTitle: {
    ...theme.typography.displaySmall,
    color: theme.colors.text,
    marginBottom: theme.spacing.xl,
    marginTop: theme.spacing.md,
  },

  // Sections
  sectionTitle: {
    ...theme.typography.labelLarge,
    color: theme.colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.lg,
  },
  dangerTitle: {
    color: theme.colors.error,
  },

  // Cards
  card: {
    ...glassCard,
    padding: 4,
  },
  dangerCard: {
    ...glassCard,
    padding: 4,
    borderColor: theme.colors.error + '30',
  },

  // Setting Row
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: theme.spacing.md,
  },
  settingTextContainer: {
    marginLeft: theme.spacing.md,
    flex: 1,
  },
  settingLabel: {
    ...theme.typography.bodyMedium,
    color: theme.colors.text,
    fontWeight: '500',
  },
  settingDescription: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },

  // Info Row
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
  },
  infoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoLabel: {
    ...theme.typography.bodyMedium,
    color: theme.colors.text,
    marginLeft: theme.spacing.md,
  },
  infoValue: {
    ...theme.typography.bodyMedium,
    color: theme.colors.primary,
    fontWeight: '600',
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginHorizontal: theme.spacing.md,
  },

  // About
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
  },
  aboutLabel: {
    ...theme.typography.bodyMedium,
    color: theme.colors.textSecondary,
  },
  aboutValue: {
    ...theme.typography.bodyMedium,
    color: theme.colors.primary,
    fontWeight: '700',
  },

  // Danger
  dangerBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
  },
  dangerBtnText: {
    ...theme.typography.labelLarge,
    color: theme.colors.error,
    marginLeft: theme.spacing.sm,
  },

  // Footer
  footer: {
    marginTop: theme.spacing.xxl,
    alignItems: 'center',
  },
  footerText: {
    ...theme.typography.caption,
    color: theme.colors.textTertiary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
