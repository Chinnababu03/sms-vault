// ============================================================
// SMS Vault v2.0 - Constants unit tests
// ============================================================

import {
  APP_NAME,
  APP_VERSION,
  BACKUP_VERSION,
  STORAGE_KEYS,
  ENCRYPTION,
  BACKUP,
  CLOUD,
  SCHEDULE,
  NETWORK,
  UI,
} from '../src/utils/constants';

describe('constants', () => {
  it('app metadata is wired', () => {
    expect(APP_NAME).toBe('SMS Vault');
    expect(APP_VERSION).toBe('2.0.0');
    expect(BACKUP_VERSION).toBe('2.0.0');
  });

  it('storage keys are stable strings', () => {
    for (const key of Object.values(STORAGE_KEYS)) {
      expect(typeof key).toBe('string');
      expect(key.startsWith('@sms_vault')).toBe(true);
    }
  });

  it('encryption constants match TRD', () => {
    expect(ENCRYPTION.ALGORITHM).toBe('AES-256-GCM');
    expect(ENCRYPTION.PBKDF2_ITERATIONS).toBe(100000);
    expect(ENCRYPTION.SALT_LENGTH).toBe(16);
    expect(ENCRYPTION.IV_LENGTH).toBe(12);
    expect(ENCRYPTION.KEY_LENGTH).toBe(32);
    expect(ENCRYPTION.TAG_LENGTH).toBe(16);
  });

  it('backup constants have sane defaults', () => {
    expect(BACKUP.MAX_HISTORY).toBe(100);
    expect(BACKUP.DEFAULT_KEEP_COUNT).toBe(10);
    expect(BACKUP.FILE_EXTENSION_ENC).toBe('.enc');
  });

  it('cloud auth endpoints are HTTPS', () => {
    expect(CLOUD.GOOGLE_DRIVE.AUTH_BASE).toMatch(/^https:\/\//);
    expect(CLOUD.ONEDRIVE.AUTH_BASE).toMatch(/^https:\/\//);
    expect(CLOUD.DROPBOX.AUTH_BASE).toMatch(/^https:\/\//);
  });

  it('schedule min interval is at least 15 minutes', () => {
    expect(SCHEDULE.MIN_INTERVAL_MS).toBeGreaterThanOrEqual(15 * 60 * 1000);
  });

  it('network has retry config', () => {
    expect(NETWORK.RETRY_COUNT).toBeGreaterThan(0);
    expect(NETWORK.UPLOAD_CHUNK_SIZE).toBeGreaterThan(0);
  });

  it('UI animation timings increase', () => {
    expect(UI.ANIMATION_FAST).toBeLessThan(UI.ANIMATION_NORMAL);
    expect(UI.ANIMATION_NORMAL).toBeLessThan(UI.ANIMATION_SLOW);
  });
});
