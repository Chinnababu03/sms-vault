// ============================================================
// SMS Vault v2.0 - AppContext reducer tests
// ============================================================

import { appReducer, initialState, defaultSettings } from '../src/services/appReducer';
import { ErrorType } from '../src/types';
import type {
  AppState,
  AppSettings,
  AppAction,
  BackupMetadata,
  CloudAccount,
  AppError,
} from '../src/types';

const backup = (id: string): BackupMetadata => ({
  id,
  date: Date.now(),
  totalSms: 1,
  totalMms: 0,
  totalCallLogs: 0,
  sizeBytes: 10,
  isEncrypted: true,
  isComplete: true,
  cloudProviders: [],
  checksum: 'x',
});

const cloud: CloudAccount = {
  provider: 'google_drive',
  isConnected: true,
  email: 'u@g.com',
  storageUsed: 0,
  storageTotal: 15 * 1024 ** 3,
  lastSyncDate: 1,
};

describe('appReducer', () => {
  it('returns same state reference for unknown action', () => {
    const next = appReducer(initialState, { type: 'UNKNOWN' } as unknown as AppAction);
    expect(next).toBe(initialState);
  });

  it('SET_SETTINGS replaces settings', () => {
    const settings: AppSettings = { ...defaultSettings, theme: 'dark', language: 'fr' };
    const next = appReducer(initialState, { type: 'SET_SETTINGS', payload: settings });
    expect(next.settings).toBe(settings);
  });

  it('UPDATE_SETTING updates single key immutably', () => {
    const next = appReducer(initialState, { type: 'UPDATE_SETTING', payload: { key: 'wifiOnly', value: false } });
    expect(next.settings.wifiOnly).toBe(false);
    expect(initialState.settings.wifiOnly).toBe(true);
  });

  it('SET_BACKUPS replaces list', () => {
    const backups = [backup('a'), backup('b')];
    const next = appReducer(initialState, { type: 'SET_BACKUPS', payload: backups });
    expect(next.backups).toEqual(backups);
  });

  it('ADD_BACKUP prepends and caps at 100', () => {
    let state: AppState = initialState;
    for (let i = 0; i < 105; i++) {
      state = appReducer(state, { type: 'ADD_BACKUP', payload: backup(`b${i}`) });
    }
    expect(state.backups).toHaveLength(100);
    expect(state.backups[0].id).toBe('b104');
  });

  it('REMOVE_BACKUP filters by id', () => {
    let state: AppState = { ...initialState, backups: [backup('x'), backup('y')] };
    state = appReducer(state, { type: 'REMOVE_BACKUP', payload: 'x' });
    expect(state.backups.map((b) => b.id)).toEqual(['y']);
  });

  it('SET_CLOUD_ACCOUNTS, ADD/REMOVE_CLOUD_ACCOUNT', () => {
    let state: AppState = appReducer(initialState, { type: 'SET_CLOUD_ACCOUNTS', payload: [] });
    state = appReducer(state, { type: 'ADD_CLOUD_ACCOUNT', payload: cloud });
    expect(state.cloudAccounts).toHaveLength(1);
    // Add different provider:
    const second: CloudAccount = { ...cloud, provider: 'dropbox' };
    state = appReducer(state, { type: 'ADD_CLOUD_ACCOUNT', payload: second });
    expect(state.cloudAccounts).toHaveLength(2);
    // Add same provider replaces
    state = appReducer(state, { type: 'ADD_CLOUD_ACCOUNT', payload: { ...second, email: 'new@dropbox.com' } });
    expect(state.cloudAccounts).toHaveLength(2);
    expect(state.cloudAccounts.find((a) => a.provider === 'dropbox')?.email).toBe('new@dropbox.com');
    state = appReducer(state, { type: 'REMOVE_CLOUD_ACCOUNT', payload: 'dropbox' });
    expect(state.cloudAccounts.find((a) => a.provider === 'dropbox')).toBeUndefined();
  });

  it('SET_BACKING_UP / SET_RESTORING flags', () => {
    let state = appReducer(initialState, { type: 'SET_BACKING_UP', payload: true });
    expect(state.isBackingUp).toBe(true);
    state = appReducer(state, { type: 'SET_BACKING_UP', payload: false });
    expect(state.isBackingUp).toBe(false);
    state = appReducer(state, { type: 'SET_RESTORING', payload: true });
    expect(state.isRestoring).toBe(true);
  });

  it('SET_BACKUP_PROGRESS stores the value', () => {
    const next = appReducer(initialState, {
      type: 'SET_BACKUP_PROGRESS',
      payload: { step: 'encrypting', progress: 0.6, message: 'going' },
    });
    expect(next.backupProgress?.step).toBe('encrypting');
  });

  it('SET_ERROR / CLEAR_ERROR', () => {
    const err: AppError = {
      type: ErrorType.UNKNOWN_ERROR,
      message: 'boom',
      recoverable: true,
    };
    let state = appReducer(initialState, { type: 'SET_ERROR', payload: err });
    expect(state.error).toEqual(err);
    state = appReducer(state, { type: 'CLEAR_ERROR' });
    expect(state.error).toBeNull();
  });
});
