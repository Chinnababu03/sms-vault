import type { CloudProvider, CloudAccount, CloudFile, CloudUploadResult } from '../../types';

// ============================================================
// SMS Vault v2.0 - Cloud Service Types
// ============================================================

// === Cloud Adapter Interface ===

export interface CloudAdapter {
  provider: CloudProvider;
  
  // Authentication
  authenticate(): Promise<void>;
  isAuthenticated(): Promise<boolean>;
  refreshTokens(): Promise<void>;
  
  // Account
  getAccountInfo(): Promise<CloudAccount>;
  
  // File Operations
  uploadFile(
    filePath: string,
    fileName: string,
    folder?: string,
    onProgress?: (progress: number) => void
  ): Promise<CloudUploadResult>;
  
  downloadFile(
    fileId: string,
    destPath: string,
    onProgress?: (progress: number) => void
  ): Promise<void>;
  
  listFiles(folder?: string): Promise<CloudFile[]>;
  deleteFile(fileId: string): Promise<void>;
  
  // Disconnect
  disconnect(): Promise<void>;
}

// === Cloud Configuration ===

export interface CloudConfig {
  clientId: string;
  redirectUri: string;
  scopes: string[];
  backupFolder: string;
}

// === Cloud Error Types ===

export enum CloudErrorType {
  AUTH_FAILED = 'AUTH_FAILED',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  UPLOAD_FAILED = 'UPLOAD_FAILED',
  DOWNLOAD_FAILED = 'DOWNLOAD_FAILED',
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export class CloudError extends Error {
  type: CloudErrorType;
  provider: CloudProvider;
  recoverable: boolean;

  constructor(
    message: string,
    provider: CloudProvider,
    type: CloudErrorType,
    recoverable: boolean = true
  ) {
    super(message);
    this.name = 'CloudError';
    this.type = type;
    this.provider = provider;
    this.recoverable = recoverable;
  }
}

// === Cloud Constants ===

export const CLOUD_BACKUP_FOLDER = 'SMS Vault Backups';

export const CLOUD_CONFIGS: Record<CloudProvider, CloudConfig> = {
  google_drive: {
    clientId: '', // Will be set from environment
    redirectUri: 'com.smsvault://google-auth',
    scopes: ['https://www.googleapis.com/auth/drive.file'],
    backupFolder: CLOUD_BACKUP_FOLDER,
  },
  onedrive: {
    clientId: '',
    redirectUri: 'com.smsvault://onedrive-auth',
    scopes: ['files.readwrite'],
    backupFolder: CLOUD_BACKUP_FOLDER,
  },
  dropbox: {
    clientId: '',
    redirectUri: 'com.smsvault://dropbox-auth',
    scopes: ['files.content.write', 'files.content.read'],
    backupFolder: CLOUD_BACKUP_FOLDER,
  },
};
