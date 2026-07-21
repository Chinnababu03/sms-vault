import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AppSettings, BackupMetadata, CloudAccount } from '../types';

// ============================================================
// SMS Vault v2.0 - Storage Service
// ============================================================

const KEYS = {
  SETTINGS: '@sms_vault_settings',
  BACKUPS: '@sms_vault_backups',
  CLOUD_ACCOUNTS: '@sms_vault_clouds',
  DEVICE_ID: '@sms_vault_device_id',
  LAST_BACKUP: '@sms_vault_last_backup',
  ENCRYPTION_KEY: '@sms_vault_encryption_key',
} as const;

// === Default Settings ===

const DEFAULT_SETTINGS: AppSettings = {
  backupSms: true,
  backupMms: true,
  backupCallLogs: true,
  encryptBackups: true,
  incrementalMode: true,
  scheduledBackup: false,
  frequency: 'daily',
  scheduledHour: 2,
  scheduledMinute: 0,
  wifiOnly: true,
  chargingOnly: false,
  autoDeleteOldBackups: false,
  keepBackupsCount: 10,
  selectedClouds: [],
  onboardingComplete: false,
  theme: 'system',
  language: 'en',
  biometricLock: false,
  hideNotificationContent: true,
};

// === Settings Operations ===

export async function loadSettings(): Promise<AppSettings> {
  try {
    const json = await AsyncStorage.getItem(KEYS.SETTINGS);
    if (json) {
      const saved = JSON.parse(json);
      return { ...DEFAULT_SETTINGS, ...saved };
    }
    return DEFAULT_SETTINGS;
  } catch (error) {
    console.error('Failed to load settings:', error);
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save settings:', error);
    throw error;
  }
}

export async function updateSetting<K extends keyof AppSettings>(
  key: K,
  value: AppSettings[K]
): Promise<AppSettings> {
  const settings = await loadSettings();
  const updated = { ...settings, [key]: value };
  await saveSettings(updated);
  return updated;
}

// === Backup Metadata Operations ===

export async function getBackupHistory(): Promise<BackupMetadata[]> {
  try {
    const json = await AsyncStorage.getItem(KEYS.BACKUPS);
    if (json) {
      return JSON.parse(json);
    }
    return [];
  } catch (error) {
    console.error('Failed to load backup history:', error);
    return [];
  }
}

export async function saveBackupHistory(backups: BackupMetadata[]): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.BACKUPS, JSON.stringify(backups));
  } catch (error) {
    console.error('Failed to save backup history:', error);
    throw error;
  }
}

export async function addBackup(metadata: BackupMetadata): Promise<BackupMetadata[]> {
  const backups = await getBackupHistory();
  const updated = [metadata, ...backups].slice(0, 100); // Keep last 100 backups
  await saveBackupHistory(updated);
  return updated;
}

export async function removeBackup(backupId: string): Promise<BackupMetadata[]> {
  const backups = await getBackupHistory();
  const updated = backups.filter((b) => b.id !== backupId);
  await saveBackupHistory(updated);
  return updated;
}

export async function getBackupById(backupId: string): Promise<BackupMetadata | null> {
  const backups = await getBackupHistory();
  return backups.find((b) => b.id === backupId) || null;
}

export async function getLatestBackup(): Promise<BackupMetadata | null> {
  const backups = await getBackupHistory();
  return backups.length > 0 ? backups[0] : null;
}

// === Cloud Account Operations ===

export async function getCloudAccounts(): Promise<CloudAccount[]> {
  try {
    const json = await AsyncStorage.getItem(KEYS.CLOUD_ACCOUNTS);
    if (json) {
      return JSON.parse(json);
    }
    return [];
  } catch (error) {
    console.error('Failed to load cloud accounts:', error);
    return [];
  }
}

export async function saveCloudAccounts(accounts: CloudAccount[]): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.CLOUD_ACCOUNTS, JSON.stringify(accounts));
  } catch (error) {
    console.error('Failed to save cloud accounts:', error);
    throw error;
  }
}

export async function addCloudAccount(account: CloudAccount): Promise<CloudAccount[]> {
  const accounts = await getCloudAccounts();
  const updated = [
    ...accounts.filter((a) => a.provider !== account.provider),
    account,
  ];
  await saveCloudAccounts(updated);
  return updated;
}

export async function removeCloudAccount(
  provider: CloudAccount['provider']
): Promise<CloudAccount[]> {
  const accounts = await getCloudAccounts();
  const updated = accounts.filter((a) => a.provider !== provider);
  await saveCloudAccounts(updated);
  return updated;
}

// === Device ID Operations ===

export async function getOrCreateDeviceId(): Promise<string> {
  try {
    let deviceId = await AsyncStorage.getItem(KEYS.DEVICE_ID);
    if (!deviceId) {
      deviceId = `${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
      await AsyncStorage.setItem(KEYS.DEVICE_ID, deviceId);
    }
    return deviceId;
  } catch (error) {
    console.error('Failed to get device ID:', error);
    return `${Date.now()}_fallback`;
  }
}

// === Last Backup Operations ===

export async function getLastBackupTimestamp(): Promise<number | null> {
  try {
    const timestamp = await AsyncStorage.getItem(KEYS.LAST_BACKUP);
    return timestamp ? parseInt(timestamp, 10) : null;
  } catch (error) {
    console.error('Failed to get last backup timestamp:', error);
    return null;
  }
}

export async function setLastBackupTimestamp(timestamp: number): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.LAST_BACKUP, timestamp.toString());
  } catch (error) {
    console.error('Failed to save last backup timestamp:', error);
  }
}

// === Cleanup Operations ===

export async function clearAllData(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const smsVaultKeys = keys.filter((k) => k.startsWith('@sms_vault'));
    await AsyncStorage.multiRemove(smsVaultKeys);
  } catch (error) {
    console.error('Failed to clear data:', error);
    throw error;
  }
}

export async function getStorageSize(): Promise<number> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const smsVaultKeys = keys.filter((k) => k.startsWith('@sms_vault'));
    const entries = await AsyncStorage.multiGet(smsVaultKeys);
    let totalSize = 0;
    for (const [, value] of entries) {
      if (value) {
        totalSize += new TextEncoder().encode(value).length;
      }
    }
    return totalSize;
  } catch (error) {
    console.error('Failed to calculate storage size:', error);
    return 0;
  }
}
