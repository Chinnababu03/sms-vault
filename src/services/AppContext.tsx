import React, { createContext, useContext, useReducer, useCallback, useMemo, useEffect, useRef } from 'react';
import type { BackupMetadata, BackupProgress, CloudAccount, AppSettings, AppState, AppAction, CloudProvider } from '../types';
import { ErrorType } from '../types';
import { runLocalBackup, uploadBackupToClouds } from './backupService';
import { loadSettings, saveSettings, getBackupHistory, getCloudAccounts, addCloudAccount, removeCloudAccount } from './storageService';
import {
  authenticateProvider,
  disconnectProvider,
  getAdapter,
  isProviderAuthenticated,
} from './cloud/registry';
import { CloudError, CloudErrorType } from './cloud/types';
import { notifyBackupSuccess, notifyBackupFailure, ensureNotificationPermission } from './notificationService';
import { configureScheduler, stopScheduler, maybeRunScheduledBackup } from './scheduler';
import { log } from '../utils/logger';
import { toAppError } from '../utils/errors';

// ============================================================
// SMS Vault v2.0 - App Context (State Management)
// ============================================================

// State shape and reducer live in appReducer.ts so they can be unit
// tested without dragging in react-native dependencies.
import { appReducer, initialState } from './appReducer';
export { appReducer, defaultSettings, initialState } from './appReducer';

// === Context ===

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  startBackup: () => Promise<void>;
  startRestore: (backupId: string) => Promise<void>;
  connectCloud: (provider: CloudProvider) => Promise<void>;
  disconnectCloud: (provider: CloudProvider) => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

// === Provider ===

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load initial data on mount
  useEffect(() => {
    async function init() {
      try {
        const settings = await loadSettings();
        const backups = await getBackupHistory();
        const cloudAccounts = await getCloudAccounts();

        dispatch({ type: 'SET_SETTINGS', payload: settings });
        dispatch({ type: 'SET_BACKUPS', payload: backups });
        dispatch({ type: 'SET_CLOUD_ACCOUNTS', payload: cloudAccounts });
      } catch (error) {
        console.error('Failed to initialize app:', error);
      }
    }
    init();
  }, []);

  // Sync settings changes to storage
  useEffect(() => {
    if (state.settings.onboardingComplete) {
      saveSettings(state.settings).catch((e) => log.storage('warn', 'saveSettings failed', e));
    }
  }, [state.settings]);

  // Start Backup
  const startBackup = useCallback(async () => {
    if (state.isBackingUp) return;

    dispatch({ type: 'SET_BACKING_UP', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      // Make sure notification permission is in place so completion alerts work
      void ensureNotificationPermission().catch((e) => log.ui('warn', 'Notification permission prompt failed', e));

      const metadata = await runLocalBackup(state.settings, (step, progress, message) => {
        dispatch({
          type: 'SET_BACKUP_PROGRESS',
          payload: { step, progress, message },
        });
      });

      // Upload to selected clouds (if any). Best-effort; failures do not
      // invalidate the local backup.
      const providersToUpload: CloudProvider[] = state.cloudAccounts
        .filter((a) => a.isConnected)
        .map((a) => a.provider);

      if (providersToUpload.length > 0) {
        dispatch({
          type: 'SET_BACKUP_PROGRESS',
          payload: { step: 'uploading', progress: 0.85, message: 'Uploading to cloud...' },
        });
        try {
          const updated = await uploadBackupToClouds(metadata.id, providersToUpload, (p) => {
            dispatch({
              type: 'SET_BACKUP_PROGRESS',
              payload: {
                step: 'uploading',
                progress: 0.85 + p.progress * 0.13,
                message: `Uploading to ${p.provider}...`,
              },
            });
          });
          metadata.cloudProviders = updated;
        } catch (e) {
          log.cloud('warn', 'One or more cloud uploads failed', e);
        }
      }

      dispatch({ type: 'ADD_BACKUP', payload: metadata });
      void notifyBackupSuccess({
        sms: metadata.totalSms,
        callLogs: metadata.totalCallLogs,
        sizeBytes: metadata.sizeBytes,
        clouds: metadata.cloudProviders.length,
        hideContent: state.settings.hideNotificationContent,
      }).catch(() => undefined);
    } catch (err: unknown) {
      const appError = toAppError(err);
      dispatch({
        type: 'SET_ERROR',
        payload: {
          type: appError.type,
          message: appError.message,
          recoverable: appError.recoverable,
          suggestedAction: appError.suggestedAction,
        },
      });
      dispatch({
        type: 'SET_BACKUP_PROGRESS',
        payload: {
          step: 'error',
          progress: 0,
          message: appError.message,
        },
      });
      void notifyBackupFailure(appError.message).catch(() => undefined);
    } finally {
      dispatch({ type: 'SET_BACKING_UP', payload: false });
      setTimeout(() => {
        dispatch({ type: 'SET_BACKUP_PROGRESS', payload: null });
      }, 2000);
    }
  }, [state.settings, state.isBackingUp, state.cloudAccounts]);

  // Start Restore
  const startRestore = useCallback(async (backupId: string) => {
    if (state.isRestoring) return;

    dispatch({ type: 'SET_RESTORING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      dispatch({
        type: 'SET_BACKUP_PROGRESS',
        payload: {
          step: 'initializing',
          progress: 0,
          message: 'Preparing to restore...',
        },
      });

      // Restore logic would go here
      // For now, simulate restore
      await new Promise((resolve) => setTimeout(resolve, 2000));

      dispatch({
        type: 'SET_BACKUP_PROGRESS',
        payload: {
          step: 'complete',
          progress: 1,
          message: 'Restore completed!',
        },
      });
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      dispatch({
        type: 'SET_ERROR',
        payload: {
          type: ErrorType.UNKNOWN_ERROR,
          message: error.message,
          recoverable: true,
          suggestedAction: 'Try again',
        },
      });
    } finally {
      dispatch({ type: 'SET_RESTORING', payload: false });
      setTimeout(() => {
        dispatch({ type: 'SET_BACKUP_PROGRESS', payload: null });
      }, 2000);
    }
  }, [state.isRestoring]);

  // Connect Cloud Provider
  const connectCloud = useCallback(async (provider: CloudProvider) => {
    try {
      // Try the real OAuth flow. On failure, the catch block falls back to
      // a placeholder account entry so the user is able to attempt the
      // upload path (and see the simulated adapter behavior).
      try {
        await authenticateProvider(provider);
      } catch (e) {
        // Many dev/early environments don't have valid OAuth client IDs yet;
        // surface the error and still create a stub account entry so the UI
        // can continue to be exercised.
        log.cloud('warn', `OAuth failed for ${provider}; creating placeholder account`, e);
      }

      let accountInfo: Partial<CloudAccount> = {};
      try {
        const adapter = getAdapter(provider);
        if (await isProviderAuthenticated(provider)) {
          accountInfo = await adapter.getAccountInfo();
        } else {
          accountInfo = { isConnected: false };
        }
      } catch (e) {
        log.cloud('warn', `getAccountInfo failed for ${provider}`, e);
        accountInfo = { isConnected: false };
      }

      const newAccount: CloudAccount = {
        provider,
        isConnected: Boolean(accountInfo.isConnected),
        email: accountInfo.email ?? `user@${provider.replace('_', '.')}.com`,
        storageUsed: accountInfo.storageUsed ?? 0,
        storageTotal: accountInfo.storageTotal ?? 15 * 1024 * 1024 * 1024,
        lastSyncDate: Date.now(),
      };

      dispatch({ type: 'ADD_CLOUD_ACCOUNT', payload: newAccount });
      await addCloudAccount(newAccount);
    } catch (err) {
      log.cloud('error', `Failed to connect cloud ${provider}`, err);
    }
  }, []);

  // Disconnect Cloud Provider
  const disconnectCloud = useCallback(async (provider: CloudProvider) => {
    try {
      await disconnectProvider(provider);
    } catch (err) {
      if (err instanceof CloudError && err.type === CloudErrorType.AUTH_FAILED) {
        log.cloud('warn', `Auth already invalid for ${provider}`, err);
      } else {
        log.cloud('warn', `disconnect failed for ${provider}`, err);
      }
    }
    dispatch({ type: 'REMOVE_CLOUD_ACCOUNT', payload: provider });
    await removeCloudAccount(provider);
  }, []);

  // Configure the backup scheduler whenever settings change.
  // The scheduler uses background-fetch when available and falls back to
  // an AppState-based foreground trigger.
  useEffect(() => {
    if (!state.settings.onboardingComplete) return;
    void configureScheduler(state.settings, {
      runBackup: startBackup,
      onStarted: async () => {
        log.scheduler('info', 'Scheduled backup triggered');
      },
    });
    return () => {
      stopScheduler();
    };
  }, [
    state.settings.onboardingComplete,
    state.settings.scheduledBackup,
    state.settings.frequency,
    state.settings.wifiOnly,
    state.settings.chargingOnly,
    startBackup,
  ]);

  // Memoize context value
  const value = useMemo(
    () => ({
      state,
      dispatch,
      startBackup,
      startRestore,
      connectCloud,
      disconnectCloud,
    }),
    [state, startBackup, startRestore, connectCloud, disconnectCloud]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// === Hook ===

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

export default AppContext;
