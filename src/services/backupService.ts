import RNFS from 'react-native-fs';
import type {
  BackupPayload,
  BackupMetadata,
  BackupProgress,
  BackupStep,
  SmsMessage,
  MmsMessage,
  CallLogEntry,
  AppSettings,
  DeviceInfo,
} from '../types';
import {
  readSms,
  readMms,
  readCallLogs,
  getDeviceInfo,
} from './nativeBridge';
import {
  encryptBackup,
  decryptBackup,
  calculateChecksum,
} from './encryptionService';
import {
  addBackup,
  getOrCreateDeviceId,
  getLastBackupTimestamp,
  setLastBackupTimestamp,
} from './storageService';

// ============================================================
// SMS Vault v2.0 - Backup Service
// ============================================================

const BACKUP_DIR = `${RNFS.DocumentDirectoryPath}/backups`;
const BACKUP_VERSION = '2.0.0';

// === Backup Directory Management ===

async function ensureBackupDir(): Promise<void> {
  const exists = await RNFS.exists(BACKUP_DIR);
  if (!exists) {
    await RNFS.mkdir(BACKUP_DIR);
  }
}

// === Progress Callback Type ===

export type ProgressCallback = (
  step: BackupStep,
  progress: number,
  message: string,
  currentCount?: number,
  totalCount?: number
) => void;

// === Main Backup Function ===

export async function runLocalBackup(
  settings: AppSettings,
  onProgress: ProgressCallback
): Promise<BackupMetadata> {
  await ensureBackupDir();

  // Initialize
  onProgress('initializing', 0, 'Preparing backup...');
  const deviceId = await getOrCreateDeviceId();
  const deviceInfo = await getDeviceInfo();

  // Read SMS
  let smsMessages: SmsMessage[] = [];
  if (settings.backupSms) {
    onProgress('reading_sms', 0.1, 'Reading SMS messages...');
    const sinceTimestamp = settings.incrementalMode
      ? (await getLastBackupTimestamp()) || 0
      : 0;
    smsMessages = await readSms(sinceTimestamp);
    onProgress('reading_sms', 0.2, `Found ${smsMessages.length} SMS messages`);
  }

  // Read MMS
  let mmsMessages: MmsMessage[] = [];
  if (settings.backupMms) {
    onProgress('reading_mms', 0.25, 'Reading MMS messages...');
    const sinceTimestamp = settings.incrementalMode
      ? (await getLastBackupTimestamp()) || 0
      : 0;
    mmsMessages = await readMms(sinceTimestamp);
    onProgress('reading_mms', 0.3, `Found ${mmsMessages.length} MMS messages`);
  }

  // Read Call Logs
  let callLogs: CallLogEntry[] = [];
  if (settings.backupCallLogs) {
    onProgress('reading_calllogs', 0.35, 'Reading call logs...');
    const sinceTimestamp = settings.incrementalMode
      ? (await getLastBackupTimestamp()) || 0
      : 0;
    callLogs = await readCallLogs(sinceTimestamp);
    onProgress('reading_calllogs', 0.4, `Found ${callLogs.length} call log entries`);
  }

  // Create backup payload
  onProgress('serializing', 0.5, 'Preparing backup data...');
  const backupPayload: BackupPayload = {
    version: BACKUP_VERSION,
    backupDate: Date.now(),
    deviceId,
    deviceInfo,
    statistics: {
      totalSms: smsMessages.length,
      totalMms: mmsMessages.length,
      totalCallLogs: callLogs.length,
    },
    encryption: null,
    checksum: '',
    messages: {
      sms: smsMessages,
      mms: mmsMessages,
      callLogs,
    },
  };

  // Calculate checksum of plaintext
  const plaintextJson = JSON.stringify(backupPayload);
  backupPayload.checksum = calculateChecksum(plaintextJson);

  // Encrypt if enabled
  let encryptedData: string;
  let isEncrypted = false;

  if (settings.encryptBackups) {
    onProgress('encrypting', 0.6, 'Encrypting backup with AES-256-GCM...');
    try {
      const password = await getOrCreateDeviceId(); // Use device ID as encryption key
      const encrypted = await encryptBackup(backupPayload, password);
      encryptedData = encrypted.data;
      isEncrypted = true;
      backupPayload.encryption = {
        algorithm: encrypted.metadata.algorithm,
        salt: encrypted.metadata.salt,
        iv: encrypted.metadata.iv,
        tag: encrypted.metadata.tag,
        keyVersion: encrypted.metadata.keyVersion,
      };
    } catch (error) {
      throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  } else {
    encryptedData = plaintextJson;
  }

  // Save to local storage
  onProgress('saving_local', 0.7, 'Saving backup to device...');
  const backupId = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  const fileName = `backup_${backupId}.enc`;
  const filePath = `${BACKUP_DIR}/${fileName}`;

  await RNFS.writeFile(filePath, encryptedData, 'utf8');

  // Get file size
  const fileInfo = await RNFS.stat(filePath);
  const sizeBytes = parseInt(fileInfo.size as unknown as string, 10);

  // Create metadata
  const metadata: BackupMetadata = {
    id: backupId,
    date: Date.now(),
    totalSms: smsMessages.length,
    totalMms: mmsMessages.length,
    totalCallLogs: callLogs.length,
    sizeBytes,
    isEncrypted,
    isComplete: true,
    cloudProviders: [],
    checksum: backupPayload.checksum,
  };

  // Save metadata
  onProgress('saving_local', 0.8, 'Saving backup metadata...');
  await addBackup(metadata);
  await setLastBackupTimestamp(Date.now());

  // Complete
  onProgress('complete', 1.0, 'Backup completed successfully!');

  return metadata;
}

// === Restore Function ===

export async function restoreBackup(
  backupId: string,
  password: string,
  onProgress: ProgressCallback
): Promise<{ smsRestored: number; mmsRestored: number; callLogsRestored: number }> {
  onProgress('initializing', 0, 'Preparing to restore...');

  // Find backup file
  const backupDirExists = await RNFS.exists(BACKUP_DIR);
  if (!backupDirExists) {
    throw new Error('Backup directory not found');
  }

  const files = await RNFS.readDir(BACKUP_DIR);
  const backupFile = files.find(
    (f) => f.name.includes(backupId) && (f.name.endsWith('.enc') || f.name.endsWith('.json'))
  );

  if (!backupFile) {
    throw new Error('Backup file not found');
  }

  // Read file
  onProgress('reading_sms', 0.2, 'Reading backup file...');
  const encryptedData = await RNFS.readFile(backupFile.path, 'utf8');

  // Decrypt if needed
  let payload: BackupPayload;
  try {
    onProgress('encrypting', 0.4, 'Decrypting backup...');
    const encryptedBackup = {
      data: encryptedData,
      metadata: {
        algorithm: 'AES-256-GCM',
        salt: '',
        iv: '',
        tag: '',
        keyVersion: 1,
      },
      checksum: '',
    };
    payload = await decryptBackup(encryptedBackup, password);
  } catch (error) {
    // Try parsing as plain JSON
    try {
      payload = JSON.parse(encryptedData);
    } catch {
      throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Wrong password or corrupted data'}`);
    }
  }

  // Verify checksum
  if (payload.checksum) {
    onProgress('serializing', 0.5, 'Verifying data integrity...');
    const { calculateChecksum } = await import('./encryptionService');
    const checksumData = JSON.stringify({
      ...payload,
      encryption: undefined,
      checksum: undefined,
    });
    if (calculateChecksum(checksumData) !== payload.checksum) {
      console.warn('Checksum mismatch - data may be corrupted');
    }
  }

  // Restore SMS
  let smsRestored = 0;
  if (payload.messages.sms.length > 0) {
    onProgress('reading_sms', 0.6, `Restoring ${payload.messages.sms.length} SMS messages...`);
    try {
      const { writeSms } = await import('./nativeBridge');
      smsRestored = await writeSms(payload.messages.sms);
    } catch (error) {
      console.error('Failed to restore SMS:', error);
    }
  }

  // Restore MMS (limited support)
  let mmsRestored = 0;
  if (payload.messages.mms.length > 0) {
    onProgress('reading_mms', 0.7, 'MMS restore not fully supported yet');
    mmsRestored = 0;
  }

  // Restore Call Logs
  let callLogsRestored = 0;
  if (payload.messages.callLogs.length > 0) {
    onProgress('reading_calllogs', 0.8, `Restoring ${payload.messages.callLogs.length} call logs...`);
    try {
      const { writeCallLogs } = await import('./nativeBridge');
      callLogsRestored = await writeCallLogs(payload.messages.callLogs);
    } catch (error) {
      console.error('Failed to restore call logs:', error);
    }
  }

  // Complete
  onProgress('complete', 1.0, 'Restore completed successfully!');

  return {
    smsRestored,
    mmsRestored,
    callLogsRestored,
  };
}

// === Cloud Upload Orchestration ===

import type { CloudProvider } from '../types';
import { getAdapter } from './cloud/registry';
import { CLOUD_BACKUP_FOLDER } from './cloud/types';
import { log } from '../utils/logger';

export interface CloudUploadProgress {
  provider: CloudProvider;
  progress: number; // 0..1
  status: 'uploading' | 'done' | 'failed';
  error?: string;
}

/**
 * Uploads an already-saved local backup file to the given cloud providers.
 * Returns the subset of providers that succeeded so metadata can be updated.
 */
export async function uploadBackupToClouds(
  backupId: string,
  providers: CloudProvider[],
  onProgress?: (p: CloudUploadProgress) => void
): Promise<CloudProvider[]> {
  const filePath = await getBackupFilePath(backupId);
  if (!filePath) {
    throw new Error(`Backup file not found for id: ${backupId}`);
  }
  const fileName = `backup_${backupId}.enc`;

  const succeeded: CloudProvider[] = [];

  for (const provider of providers) {
    const adapter = getAdapter(provider);
    try {
      const authed = await adapter.isAuthenticated();
      if (!authed) {
        log.cloud('warn', `Skipping upload to ${provider}: not authenticated`);
        onProgress?.({ provider, progress: 0, status: 'failed', error: 'not authenticated' });
        continue;
      }
      onProgress?.({ provider, progress: 0.05, status: 'uploading' });
      const result = await adapter.uploadFile(filePath, fileName, CLOUD_BACKUP_FOLDER, (p) => {
        onProgress?.({ provider, progress: Math.max(0.05, Math.min(1, p)), status: 'uploading' });
      });
      if (result.success) {
        succeeded.push(provider);
        onProgress?.({ provider, progress: 1, status: 'done' });
      } else {
        onProgress?.({ provider, progress: 1, status: 'failed', error: result.error });
      }
    } catch (e) {
      log.cloud('warn', `Upload to ${provider} failed`, e);
      onProgress?.({
        provider,
        progress: 1,
        status: 'failed',
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }
  return succeeded;
}

// === Backup File Management ===

export async function deleteBackupFile(backupId: string): Promise<void> {
  const files = await RNFS.readDir(BACKUP_DIR);
  const backupFile = files.find((f) => f.name.includes(backupId));
  if (backupFile) {
    await RNFS.unlink(backupFile.path);
  }
}

export async function getBackupFilePath(backupId: string): Promise<string | null> {
  const files = await RNFS.readDir(BACKUP_DIR);
  const backupFile = files.find((f) => f.name.includes(backupId));
  return backupFile ? backupFile.path : null;
}

export async function getLocalBackupSize(): Promise<number> {
  try {
    const exists = await RNFS.exists(BACKUP_DIR);
    if (!exists) return 0;

    const files = await RNFS.readDir(BACKUP_DIR);
    let totalSize = 0;
    for (const file of files) {
      const stat = await RNFS.stat(file.path);
      totalSize += parseInt(stat.size as unknown as string, 10);
    }
    return totalSize;
  } catch (error) {
    console.error('Failed to calculate backup size:', error);
    return 0;
  }
}

export async function listLocalBackups(): Promise<string[]> {
  try {
    const exists = await RNFS.exists(BACKUP_DIR);
    if (!exists) return [];

    const files = await RNFS.readDir(BACKUP_DIR);
    return files
      .filter((f) => f.name.endsWith('.enc') || f.name.endsWith('.json'))
      .map((f) => f.name);
  } catch (error) {
    console.error('Failed to list backups:', error);
    return [];
  }
}

// === Backup Validation ===

export async function validateBackupFile(backupId: string): Promise<boolean> {
  try {
    const filePath = await getBackupFilePath(backupId);
    if (!filePath) return false;

    const exists = await RNFS.exists(filePath);
    if (!exists) return false;

    const stat = await RNFS.stat(filePath);
    const size = parseInt(stat.size as unknown as string, 10);
    return size > 0;
  } catch (error) {
    console.error('Failed to validate backup:', error);
    return false;
  }
}
