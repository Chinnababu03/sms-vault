// ============================================================
// SMS Vault v2.0 - App Reducer (extracted for testability)
// ============================================================

import type {
  AppState,
  AppAction,
  AppSettings,
} from '../types';

// === Initial Settings ===

export const defaultSettings: AppSettings = {
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

// === Initial State ===

export const initialState: AppState = {
  settings: defaultSettings,
  backups: [],
  cloudAccounts: [],
  isBackingUp: false,
  isRestoring: false,
  backupProgress: null,
  error: null,
};

// === Reducer ===

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_SETTINGS':
      return { ...state, settings: action.payload };

    case 'UPDATE_SETTING':
      return {
        ...state,
        settings: {
          ...state.settings,
          [action.payload.key]: action.payload.value,
        },
      };

    case 'SET_BACKUPS':
      return { ...state, backups: action.payload };

    case 'ADD_BACKUP':
      return {
        ...state,
        backups: [action.payload, ...state.backups].slice(0, 100),
      };

    case 'REMOVE_BACKUP':
      return {
        ...state,
        backups: state.backups.filter((b) => b.id !== action.payload),
      };

    case 'SET_CLOUD_ACCOUNTS':
      return { ...state, cloudAccounts: action.payload };

    case 'ADD_CLOUD_ACCOUNT':
      return {
        ...state,
        cloudAccounts: [
          ...state.cloudAccounts.filter((a) => a.provider !== action.payload.provider),
          action.payload,
        ],
      };

    case 'REMOVE_CLOUD_ACCOUNT':
      return {
        ...state,
        cloudAccounts: state.cloudAccounts.filter((a) => a.provider !== action.payload),
      };

    case 'SET_BACKING_UP':
      return { ...state, isBackingUp: action.payload };

    case 'SET_RESTORING':
      return { ...state, isRestoring: action.payload };

    case 'SET_BACKUP_PROGRESS':
      return { ...state, backupProgress: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload };

    case 'CLEAR_ERROR':
      return { ...state, error: null };

    default:
      return state;
  }
}

export default appReducer;
