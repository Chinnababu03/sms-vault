// ============================================================
// SMS Vault v2.0 - Domain Error Classes
// ============================================================

import { ErrorType } from '../types';

/** Base error for SMS Vault. Carries an ErrorType discriminator. */
export class AppErrorImpl extends Error {
  type: ErrorType;
  recoverable: boolean;
  suggestedAction?: string;
  details?: unknown;

  constructor(
    type: ErrorType,
    message: string,
    opts?: { recoverable?: boolean; suggestedAction?: string; details?: unknown; cause?: unknown }
  ) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.recoverable = opts?.recoverable ?? true;
    this.suggestedAction = opts?.suggestedAction;
    this.details = opts?.details;
  }
}

export class PermissionError extends AppErrorImpl {
  constructor(message: string, details?: unknown) {
    super(ErrorType.PERMISSION_DENIED, message, { recoverable: true, suggestedAction: 'Grant the required permission', details });
    this.name = 'PermissionError';
  }
}

export class StorageErrorImpl extends AppErrorImpl {
  constructor(message: string, details?: unknown) {
    super(ErrorType.STORAGE_ERROR, message, { recoverable: true, suggestedAction: 'Retry the operation', details });
    this.name = 'StorageError';
  }
}

export class EncryptionErrorImpl extends AppErrorImpl {
  constructor(message: string, details?: unknown) {
    super(ErrorType.ENCRYPTION_ERROR, message, { recoverable: false, suggestedAction: 'Ensure your password is correct', details });
    this.name = 'EncryptionError';
  }
}

export class CloudAuthErrorImpl extends AppErrorImpl {
  constructor(message: string, details?: unknown) {
    super(ErrorType.CLOUD_AUTH_ERROR, message, { recoverable: true, suggestedAction: 'Reconnect the cloud provider', details });
    this.name = 'CloudAuthError';
  }
}

export class CloudUploadErrorImpl extends AppErrorImpl {
  constructor(message: string, details?: unknown) {
    super(ErrorType.CLOUD_UPLOAD_ERROR, message, { recoverable: true, suggestedAction: 'Retry the upload', details });
    this.name = 'CloudUploadError';
  }
}

export class CloudDownloadErrorImpl extends AppErrorImpl {
  constructor(message: string, details?: unknown) {
    super(ErrorType.CLOUD_DOWNLOAD_ERROR, message, { recoverable: true, suggestedAction: 'Retry the download', details });
    this.name = 'CloudDownloadError';
  }
}

export class NetworkError extends AppErrorImpl {
  constructor(message: string, details?: unknown) {
    super(ErrorType.NETWORK_ERROR, message, { recoverable: true, suggestedAction: 'Check your internet connection and retry', details });
    this.name = 'NetworkError';
  }
}

export class DeviceNotSupportedError extends AppErrorImpl {
  constructor(message: string, details?: unknown) {
    super(ErrorType.DEVICE_NOT_SUPPORTED, message, { recoverable: false, details });
    this.name = 'DeviceNotSupportedError';
  }
}

/** Classify an arbitrary error into an AppError using heuristics. */
export function toAppError(err: unknown): AppErrorImpl {
  if (err instanceof AppErrorImpl) return err;
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    if (msg.includes('permission')) return new PermissionError(err.message, err);
    if (msg.includes('network') || msg.includes('offline')) return new NetworkError(err.message, err);
    if (msg.includes('encrypt') || msg.includes('decrypt') || msg.includes('checksum')) {
      return new EncryptionErrorImpl(err.message, err);
    }
    if (msg.includes('upload') || msg.includes('cloud')) return new CloudUploadErrorImpl(err.message, err);
    if (msg.includes('storage') || msg.includes('asyncstorage')) return new StorageErrorImpl(err.message, err);
    return new AppErrorImpl(ErrorType.UNKNOWN_ERROR, err.message, { recoverable: true, details: err });
  }
  return new AppErrorImpl(ErrorType.UNKNOWN_ERROR, String(err));
}
