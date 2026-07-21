// ============================================================
// SMS Vault v2.0 - errors unit tests
// ============================================================

import {
  PermissionError,
  StorageErrorImpl,
  EncryptionErrorImpl,
  CloudAuthErrorImpl,
  CloudUploadErrorImpl,
  CloudDownloadErrorImpl,
  NetworkError,
  DeviceNotSupportedError,
  toAppError,
  AppErrorImpl,
} from '../src/utils/errors';
import { ErrorType } from '../src/types';

describe('error classes', () => {
  it('PermissionError maps to PERMISSION_DENIED', () => {
    const e = new PermissionError('nope');
    expect(e.type).toBe(ErrorType.PERMISSION_DENIED);
    expect(e.recoverable).toBe(true);
  });
  it('StorageErrorImpl maps to STORAGE_ERROR', () => {
    const e = new StorageErrorImpl('io fail');
    expect(e.type).toBe(ErrorType.STORAGE_ERROR);
  });
  it('EncryptionErrorImpl is non-recoverable by default', () => {
    const e = new EncryptionErrorImpl('bad');
    expect(e.type).toBe(ErrorType.ENCRYPTION_ERROR);
    expect(e.recoverable).toBe(false);
  });
  it('CloudAuthErrorImpl maps to CLOUD_AUTH_ERROR', () => {
    expect(new CloudAuthErrorImpl('x').type).toBe(ErrorType.CLOUD_AUTH_ERROR);
  });
  it('CloudUploadErrorImpl maps to CLOUD_UPLOAD_ERROR', () => {
    expect(new CloudUploadErrorImpl('x').type).toBe(ErrorType.CLOUD_UPLOAD_ERROR);
  });
  it('CloudDownloadErrorImpl maps to CLOUD_DOWNLOAD_ERROR', () => {
    expect(new CloudDownloadErrorImpl('x').type).toBe(ErrorType.CLOUD_DOWNLOAD_ERROR);
  });
  it('NetworkError maps to NETWORK_ERROR', () => {
    expect(new NetworkError('x').type).toBe(ErrorType.NETWORK_ERROR);
  });
  it('DeviceNotSupportedError maps to DEVICE_NOT_SUPPORTED', () => {
    expect(new DeviceNotSupportedError('x').type).toBe(ErrorType.DEVICE_NOT_SUPPORTED);
  });
});

describe('toAppError heuristic', () => {
  it('passes AppError through unchanged', () => {
    const original = new StorageErrorImpl('x');
    expect(toAppError(original)).toBe(original);
  });
  it('classifies permission messages', () => {
    expect(toAppError(new Error('permission denied')).type).toBe(ErrorType.PERMISSION_DENIED);
  });
  it('classifies network messages', () => {
    expect(toAppError(new Error('network unavailable')).type).toBe(ErrorType.NETWORK_ERROR);
  });
  it('classifies encrypt messages', () => {
    expect(toAppError(new Error('failed to decrypt payload')).type).toBe(ErrorType.ENCRYPTION_ERROR);
  });
  it('classifies upload messages', () => {
    expect(toAppError(new Error('cloud upload timed out')).type).toBe(ErrorType.CLOUD_UPLOAD_ERROR);
  });
  it('classifies storage messages', () => {
    expect(toAppError(new Error('AsyncStorage failure')).type).toBe(ErrorType.STORAGE_ERROR);
  });
  it('falls back to UNKNOWN_ERROR for anything else', () => {
    expect(toAppError(new Error('boom')).type).toBe(ErrorType.UNKNOWN_ERROR);
  });
  it('handles non-Error values', () => {
    expect(toAppError('stringy').message).toBe('stringy');
  });
  it('AppErrorImpl defaults', () => {
    const e = new AppErrorImpl(ErrorType.UNKNOWN_ERROR, 'x');
    expect(e.recoverable).toBe(true);
  });
});
