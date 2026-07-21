// ============================================================
// SMS Vault v2.0 - App Constants
// ============================================================

export const APP_NAME = 'SMS Vault';
export const APP_VERSION = '2.0.0';
export const BACKUP_VERSION = '2.0.0';

// === Storage Keys ===
export const STORAGE_KEYS = {
  SETTINGS: '@sms_vault_settings',
  BACKUPS: '@sms_vault_backups',
  CLOUD_ACCOUNTS: '@sms_vault_clouds',
  DEVICE_ID: '@sms_vault_device_id',
  LAST_BACKUP: '@sms_vault_last_backup',
  ENCRYPTION_KEY: '@sms_vault_encryption_key',
  CLOUD_TOKENS: '@sms_vault_cloud_tokens',
} as const;

// === Encryption ===
export const ENCRYPTION = {
  ALGORITHM: 'AES-256-GCM',
  PBKDF2_ITERATIONS: 100000,
  SALT_LENGTH: 16,
  IV_LENGTH: 12,
  KEY_LENGTH: 32,
  TAG_LENGTH: 16,
  KEY_VERSION: 1,
} as const;

// === Backup ===
export const BACKUP = {
  DIR_NAME: 'backups',
  FILE_PREFIX: 'backup_',
  FILE_EXTENSION_ENC: '.enc',
  FILE_EXTENSION_JSON: '.json',
  MAX_HISTORY: 100,
  DEFAULT_KEEP_COUNT: 10,
} as const;

// === Cloud ===
export const CLOUD = {
  BACKUP_FOLDER: 'SMS Vault Backups',
  GOOGLE_DRIVE: {
    AUTH_BASE: 'https://accounts.google.com/o/oauth2/v2/auth',
    TOKEN_URL: 'https://oauth2.googleapis.com/token',
    API_BASE: 'https://www.googleapis.com/drive/v3',
    UPLOAD_BASE: 'https://www.googleapis.com/upload/drive/v3',
    SCOPE: 'https://www.googleapis.com/auth/drive.file',
  },
  ONEDRIVE: {
    AUTH_BASE: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    TOKEN_URL: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    API_BASE: 'https://graph.microsoft.com/v1.0',
    SCOPE: 'files.readwrite offline_access',
  },
  DROPBOX: {
    AUTH_BASE: 'https://www.dropbox.com/oauth2/authorize',
    TOKEN_URL: 'https://api.dropboxapi.com/oauth2/token',
    API_BASE: 'https://api.dropboxapi.com/2',
    CONTENT_BASE: 'https://content.dropboxapi.com/2',
    SCOPE: 'files.content.write files.content.read',
  },
} as const;

// === Schedule ===
export const SCHEDULE = {
  MIN_INTERVAL_MS: 15 * 60 * 1000, // 15 minutes
  FIRE_ON_BOOT_DELAY_MS: 60 * 1000, // 1 minute after boot
} as const;

// === Network ===
export const NETWORK = {
  TIMEOUT_MS: 30000,
  RETRY_COUNT: 3,
  RETRY_BACKOFF_MS: 1000,
  UPLOAD_CHUNK_SIZE: 5 * 1024 * 1024, // 5MB
} as const;

// === UI ===
export const UI = {
  ANIMATION_FAST: 150,
  ANIMATION_NORMAL: 250,
  ANIMATION_SLOW: 400,
  LIST_ITEM_HEIGHT: 72,
  PULL_TO_REFRESH_THRESHOLD: 60,
  TOAST_DURATION: 3000,
} as const;
