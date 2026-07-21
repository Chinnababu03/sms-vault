// ============================================================
// SMS Vault v2.0 - Backup Scheduler
// Schedules recurring backups using a background fetch library
// when present, falling back to an AppState-based timer that runs
// only while the app is foregrounded.
// ============================================================

import { AppState, AppStateStatus, Platform } from 'react-native';
import type { AppSettings } from '../types';
import { log } from '../utils/logger';
import { meetsBackupConstraints } from './networkService';

export interface SchedulerCallbacks {
  /** Called when the scheduler thinks a backup should run. The caller is responsible for showing a default-pin prompt. */
  runBackup: () => Promise<void>;
  /** Notify the user a scheduled backup kicked off. */
  onStarted?: () => Promise<void>;
}

interface BackgroundFetchLike {
  configure: (
    config: { minimumFetchInterval: number; stopOnTerminate: boolean; requiredNetworkType?: 'NONE' | 'UNMETERED' | 'ALL'; forceAlarmManager?: boolean },
    taskEvent: (taskId: string) => void,
    onTimeout: (taskId: string) => void
  ) => void;
  scheduleJob: (config: { jobKey: string; timeout: number }) => Promise<boolean>;
  stop?: (taskKey?: string) => void;
  status: { denied: number; restricted: number; available: number; fail: number };
}

const TAG = 'Scheduler';

let cachedSettings: Pick<AppSettings, 'scheduledBackup' | 'frequency' | 'wifiOnly' | 'chargingOnly' | 'scheduledHour' | 'scheduledMinute'> | null = null;
let callbacks: SchedulerCallbacks | null = null;
let configured = false;

function loadBackgroundFetch(): BackgroundFetchLike | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('react-native-background-fetch') as BackgroundFetchLike;
  } catch {
    log.scheduler('debug', 'react-native-background-fetch not installed; using foreground fallback');
    return null;
  }
}

function intervalMinutes(frequency: AppSettings['frequency']): number {
  switch (frequency) {
    case 'daily': return 60 * 24;
    case 'weekly': return 60 * 24 * 7;
    case 'monthly': return 60 * 24 * 30;
    default: return 60 * 24;
  }
}

/** In-foreground scheduler backed by recurring setTimeouts triggered on AppState active events. */
export async function maybeRunScheduledBackup(
  settings: Pick<AppSettings, 'scheduledBackup' | 'frequency' | 'wifiOnly' | 'chargingOnly'>,
  cb: SchedulerCallbacks
): Promise<void> {
  if (!settings.scheduledBackup) return;
  if (!(await meetsBackupConstraints({ wifiOnly: settings.wifiOnly, chargingOnly: settings.chargingOnly }))) {
    return;
  }
  log.scheduler('info', 'Running scheduled foreground backup');
  try {
    await cb.onStarted?.();
    await cb.runBackup();
  } catch (e) {
    log.scheduler('error', 'Scheduled backup failed', e);
  }
}

export async function configureScheduler(settings: AppSettings, cb: SchedulerCallbacks): Promise<void> {
  cachedSettings = settings;
  callbacks = cb;
  if (!settings.scheduledBackup) {
    log.scheduler('info', 'Scheduled backups disabled; not configuring native fetch');
    return;
  }

  const bgFetch = loadBackgroundFetch();
  if (!bgFetch) {
    // ForegroundFallback: hook the AppState 'active' event to trigger an opportunistic check.
    setupForegroundFallback();
    return;
  }

  if (configured) return;

  try {
    const requiredNetworkType = settings.wifiOnly ? 'UNMETERED' : 'ALL';
    bgFetch.configure(
      {
        minimumFetchInterval: Math.max(15, Math.floor(intervalMinutes(settings.frequency) / 15) * 15),
        stopOnTerminate: false,
        requiredNetworkType,
        forceAlarmManager: Platform.OS === 'android',
      },
      async (taskId) => {
        log.scheduler('debug', 'Background fetch fired', { taskId });
        if (!callbacks) return;
        try {
          await maybeRunScheduledBackup(
            cachedSettings ?? settings,
            callbacks
          );
        } finally {
          // RNBackgroundFetch requires clients to call finish on each event when they're done.
          // The library exposes its own .finish method via the React Native EventEmitter flow.
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          try {
            const fin = require('react-native-background-fetch') as { finish: (taskId: string) => void };
            fin.finish(taskId);
          } catch {
            /* ignore if finish isn't available */
          }
        }
      },
      (taskId) => {
        log.scheduler('warn', 'Background fetch timed out', { taskId });
        try {
          const fin = require('react-native-background-fetch') as { finish: (taskId: string) => void };
          fin.finish(taskId);
        } catch {
          /* noop */
        }
      }
    );
    configured = true;
    log.scheduler('info', 'Native background fetch configured');
  } catch (e) {
    log.scheduler('error', 'Failed to configure background fetch', e);
    setupForegroundFallback();
  }
}

let foregroundActiveListener: ReturnType<typeof AppState.addEventListener> | null = null;
let lastRunTimestamp = 0;

function setupForegroundFallback(): void {
  if (foregroundActiveListener) return;
  foregroundActiveListener = AppState.addEventListener('change', (state: AppStateStatus) => {
    if (state !== 'active') return;
    if (!cachedSettings || !callbacks) return;
    const now = Date.now();
    const minMs = Math.min(intervalMinutes(cachedSettings.frequency) * 60 * 1000, 12 * 60 * 60 * 1000);
    if (now - lastRunTimestamp < minMs) return;
    lastRunTimestamp = now;
    void maybeRunScheduledBackup(cachedSettings as AppSettings, callbacks);
  });
  log.scheduler('info', 'Foreground fallback AppState fallback active');
}

export function stopScheduler(): void {
  if (foregroundActiveListener) {
    foregroundActiveListener.remove();
    foregroundActiveListener = null;
  }
  callbacks = null;
  cachedSettings = null;
  configured = false;
}
