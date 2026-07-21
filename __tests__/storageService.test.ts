// ============================================================
// SMS Vault v2.0 - Storage Service tests
// ============================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  loadSettings,
  saveSettings,
  updateSetting,
  getBackupHistory,
  saveBackupHistory,
  addBackup,
  removeBackup,
  getBackupById,
  getLatestBackup,
  getCloudAccounts,
  saveCloudAccounts,
  addCloudAccount,
  removeCloudAccount,
  getOrCreateDeviceId,
  getLastBackupTimestamp,
  setLastBackupTimestamp,
  clearAllData,
  getStorageSize,
} from '../src/services/storageService';
import type { AppSettings, BackupMetadata, CloudAccount } from '../src/types';

const sampleSettings: AppSettings = {
  backupSms: true,
  backupMms: false,
  backupCallLogs: true,
  encryptBackups: true,
  incrementalMode: false,
  scheduledBackup: true,
  frequency: 'weekly',
  scheduledHour: 3,
  scheduledMinute: 30,
  wifiOnly: false,
  chargingOnly: true,
  autoDeleteOldBackups: true,
  keepBackupsCount: 5,
  selectedClouds: ['google_drive'],
  onboardingComplete: true,
  theme: 'dark',
  language: 'en',
  biometricLock: false,
  hideNotificationContent: false,
};

const sampleBackup = (id: string): BackupMetadata => ({
  id,
  date: Date.now(),
  totalSms: 10,
  totalMms: 0,
  totalCallLogs: 2,
  sizeBytes: 1024,
  isEncrypted: true,
  isComplete: true,
  cloudProviders: [],
  checksum: 'abc',
});

const sampleCloud: CloudAccount = {
  provider: 'dropbox',
  isConnected: true,
  email: 'u@dropbox.com',
  storageUsed: 0,
  storageTotal: 2 * 1024 ** 3,
  lastSyncDate: 1234,
};

describe('storageService - settings', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    (AsyncStorage.getItem as jest.Mock).mockClear?.();
  });

  it('returns defaults when nothing is saved', async () => {
    const s = await loadSettings();
    expect(s.backupSms).toBe(true);
    expect(s.theme).toBe('system');
  });

  it('round-trips settings', async () => {
    await saveSettings(sampleSettings);
    const s = await loadSettings();
    expect(s).toMatchObject(sampleSettings);
  });

  it('updateSetting merges with persisted values', async () => {
    await saveSettings(sampleSettings);
    const updated = await updateSetting('biometricLock', true);
    expect(updated.biometricLock).toBe(true);
    // other keys preserved
    expect(updated.backupMms).toBe(false);
  });
});

describe('storageService - backups', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('round-trips an empty list', async () => {
    expect(await getBackupHistory()).toEqual([]);
    await saveBackupHistory([sampleBackup('a'), sampleBackup('b')]);
    expect((await getBackupHistory()).map((b) => b.id)).toEqual(['a', 'b']);
  });

  it('addBackup prepends and caps at 100', async () => {
    for (let i = 0; i < 105; i++) {
      await addBackup(sampleBackup(`b${i}`));
    }
    const history = await getBackupHistory();
    expect(history).toHaveLength(100);
    expect(history[0].id).toBe('b104');
  });

  it('removeBackup filters by id', async () => {
    await addBackup(sampleBackup('x'));
    await addBackup(sampleBackup('y'));
    const remaining = await removeBackup('x');
    expect(remaining.find((b) => b.id === 'x')).toBeUndefined();
  });

  it('lookup helpers', async () => {
    await addBackup(sampleBackup('find-me'));
    expect((await getBackupById('find-me'))?.id).toBe('find-me');
    expect((await getBackupById('missing'))).toBeNull();
    expect((await getLatestBackup())?.id).toBe('find-me');
  });
});

describe('storageService - cloud accounts', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('round trips cloud accounts', async () => {
    expect(await getCloudAccounts()).toEqual([]);
    await saveCloudAccounts([sampleCloud]);
    expect(await getCloudAccounts()).toHaveLength(1);
  });

  it('addCloudAccount replaces same provider', async () => {
    await addCloudAccount({ ...sampleCloud, email: 'a@b.co' });
    await addCloudAccount({ ...sampleCloud, email: 'c@d.co' });
    const list = await getCloudAccounts();
    expect(list).toHaveLength(1);
    expect(list[0].email).toBe('c@d.co');
  });

  it('removeCloudAccount removes a provider', async () => {
    await addCloudAccount(sampleCloud);
    await removeCloudAccount('dropbox');
    expect(await getCloudAccounts()).toEqual([]);
  });
});

describe('storageService - misc', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('creates and reuses a device id', async () => {
    const a = await getOrCreateDeviceId();
    const b = await getOrCreateDeviceId();
    expect(a).toBeTruthy();
    expect(a).toBe(b);
  });

  it('last backup timestamp round trips', async () => {
    expect(await getLastBackupTimestamp()).toBeNull();
    const ts = Date.now();
    await setLastBackupTimestamp(ts);
    expect(await getLastBackupTimestamp()).toBe(ts);
  });

  it('getStorageSize > 0 when there is data', async () => {
    await saveSettings(sampleSettings);
    const size = await getStorageSize();
    expect(size).toBeGreaterThan(0);
  });

  it('clearAllData wipes our keys', async () => {
    await saveSettings(sampleSettings);
    await setLastBackupTimestamp(Date.now());
    await clearAllData();
    const settings = await loadSettings();
    expect(settings.onboardingComplete).toBe(false);
  });
});
