// ============================================================
// SMS Vault v2.0 - Type Definitions
// ============================================================

// === Message Types ===

export interface SmsMessage {
  id: number;
  address: string;
  body: string;
  date: number;
  dateSent: number;
  type: SmsType;
  read: number;
  threadId: number;
}

export enum SmsType {
  INBOX = 1,
  SENT = 2,
  DRAFT = 3,
  OUTBOX = 4,
}

export interface MmsMessage {
  id: number;
  subject: string;
  body: string;
  date: number;
  type: number;
  read: number;
  threadId: number;
}

export interface CallLogEntry {
  id: number;
  number: string | null;
  name: string | null;
  type: CallType;
  duration: number;
  date: number;
}

export enum CallType {
  INCOMING = 1,
  OUTGOING = 2,
  MISSED = 3,
  VOICEMAIL = 4,
  REJECTED = 5,
  BLOCKED = 6,
}

// === Backup Types ===

export interface BackupPayload {
  version: string;
  backupDate: number;
  deviceId: string;
  deviceInfo: DeviceInfo;
  statistics: BackupStatistics;
  encryption: EncryptionInfo | null;
  checksum: string;
  messages: BackupMessages;
}

export interface BackupStatistics {
  totalSms: number;
  totalMms: number;
  totalCallLogs: number;
}

export interface BackupMessages {
  sms: SmsMessage[];
  mms: MmsMessage[];
  callLogs: CallLogEntry[];
}

export interface EncryptionInfo {
  algorithm: string;
  salt: string;
  iv: string;
  tag: string;
  keyVersion: number;
}

export interface BackupMetadata {
  id: string;
  date: number;
  totalSms: number;
  totalMms: number;
  totalCallLogs: number;
  sizeBytes: number;
  isEncrypted: boolean;
  isComplete: boolean;
  cloudProviders: CloudProvider[];
  checksum: string;
  errorMessage?: string;
}

export interface BackupProgress {
  step: BackupStep;
  progress: number;
  message: string;
  currentCount?: number;
  totalCount?: number;
  bytesProcessed?: number;
  totalBytes?: number;
}

export type BackupStep =
  | 'initializing'
  | 'reading_sms'
  | 'reading_mms'
  | 'reading_calllogs'
  | 'serializing'
  | 'encrypting'
  | 'saving_local'
  | 'uploading'
  | 'complete'
  | 'error';

// === Cloud Types ===

export type CloudProvider = 'google_drive' | 'onedrive' | 'dropbox';

export interface CloudAccount {
  provider: CloudProvider;
  isConnected: boolean;
  email?: string;
  storageUsed?: number;
  storageTotal?: number;
  lastSyncDate?: number;
}

export interface CloudFile {
  id: string;
  name: string;
  size: number;
  lastModified: number;
  mimeType: string;
  downloadUrl?: string;
}

export interface CloudUploadResult {
  success: boolean;
  fileId?: string;
  fileName?: string;
  error?: string;
}

export interface CloudAdapter {
  provider: CloudProvider;
  authenticate(): Promise<void>;
  isAuthenticated(): Promise<boolean>;
  getAccountInfo(): Promise<CloudAccount>;
  uploadFile(
    filePath: string,
    fileName: string,
    onProgress?: (progress: number) => void
  ): Promise<CloudUploadResult>;
  downloadFile(
    fileId: string,
    destPath: string,
    onProgress?: (progress: number) => void
  ): Promise<void>;
  listFiles(folder?: string): Promise<CloudFile[]>;
  deleteFile(fileId: string): Promise<void>;
  disconnect(): Promise<void>;
}

// === Settings Types ===

export interface AppSettings {
  // Backup Settings
  backupSms: boolean;
  backupMms: boolean;
  backupCallLogs: boolean;
  encryptBackups: boolean;
  incrementalMode: boolean;

  // Schedule Settings
  scheduledBackup: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  scheduledHour: number;
  scheduledMinute: number;

  // Network Settings
  wifiOnly: boolean;
  chargingOnly: boolean;

  // Storage Settings
  autoDeleteOldBackups: boolean;
  keepBackupsCount: number;

  // Cloud Settings
  selectedClouds: CloudProvider[];

  // App Settings
  onboardingComplete: boolean;
  theme: 'system' | 'light' | 'dark';
  language: string;

  // Security Settings
  biometricLock: boolean;
  hideNotificationContent: boolean;
}

// === Device Types ===

export interface DeviceInfo {
  manufacturer: string;
  model: string;
  osVersion: string;
  appVersion: string;
  sdkVersion: number;
  uniqueId: string;
}

// === Error Types ===

export enum ErrorType {
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  STORAGE_ERROR = 'STORAGE_ERROR',
  ENCRYPTION_ERROR = 'ENCRYPTION_ERROR',
  CLOUD_AUTH_ERROR = 'CLOUD_AUTH_ERROR',
  CLOUD_UPLOAD_ERROR = 'CLOUD_UPLOAD_ERROR',
  CLOUD_DOWNLOAD_ERROR = 'CLOUD_DOWNLOAD_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  DEVICE_NOT_SUPPORTED = 'DEVICE_NOT_SUPPORTED',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export interface AppError {
  type: ErrorType;
  message: string;
  details?: unknown;
  recoverable: boolean;
  suggestedAction?: string;
}

// === App State Types ===

export interface AppState {
  settings: AppSettings;
  backups: BackupMetadata[];
  cloudAccounts: CloudAccount[];
  isBackingUp: boolean;
  isRestoring: boolean;
  backupProgress: BackupProgress | null;
  error: AppError | null;
}

export type AppAction =
  | { type: 'SET_SETTINGS'; payload: AppSettings }
  | { type: 'UPDATE_SETTING'; payload: { key: keyof AppSettings; value: unknown } }
  | { type: 'SET_BACKUPS'; payload: BackupMetadata[] }
  | { type: 'ADD_BACKUP'; payload: BackupMetadata }
  | { type: 'REMOVE_BACKUP'; payload: string }
  | { type: 'SET_CLOUD_ACCOUNTS'; payload: CloudAccount[] }
  | { type: 'ADD_CLOUD_ACCOUNT'; payload: CloudAccount }
  | { type: 'REMOVE_CLOUD_ACCOUNT'; payload: CloudProvider }
  | { type: 'SET_BACKING_UP'; payload: boolean }
  | { type: 'SET_RESTORING'; payload: boolean }
  | { type: 'SET_BACKUP_PROGRESS'; payload: BackupProgress | null }
  | { type: 'SET_ERROR'; payload: AppError | null }
  | { type: 'CLEAR_ERROR' };

// === Navigation Types ===

export type RootStackParamList = {
  Onboarding: undefined;
  MainTabs: undefined;
  Backup: undefined;
  Restore: { backupId?: string };
  CloudManager: undefined;
};

export type TabParamList = {
  Dashboard: undefined;
  Settings: undefined;
};
