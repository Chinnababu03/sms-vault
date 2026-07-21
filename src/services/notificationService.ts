// ============================================================
// SMS Vault v2.0 - Notification Service
// Posts local notifications for backup/restore events.
// Uses @notifee/react-native when available; gracefully no-ops
// in environments where the module isn't installed (e.g. tests,
// bare JS) so the rest of the app stays functional.
// ============================================================

import { Platform, AppState, AppStateStatus } from 'react-native';
import { theme } from '../utils/theme';
import { log } from '../utils/logger';
import { requestNotificationPermission, hasNotificationPermission } from './nativeBridge';

export type NotificationChannel = 'backup' | 'restore' | 'schedule' | 'error';

/** Lazily-loaded notifee module. */
interface NotifeeModule {
  createChannel(channel: {
    id: string;
    name: string;
    description?: string;
    importance?: 'NONE' | 'MIN' | 'LOW' | 'DEFAULT' | 'HIGH';
  }): Promise<string>;
  displayNotification(notification: {
    id?: string;
    title: string;
    body: string;
    android?: {
      channelId?: string;
      smallIcon?: string;
      pressAction?: { id: string };
      color?: string;
    };
    ios?: {
      foregroundPresentationOptions?: { banner?: boolean; sound?: boolean; badge?: boolean };
    };
  }): Promise<string>;
  cancelAllNotifications(): Promise<void>;
  cancelNotification(id: string): Promise<void>;
}

let notifee: NotifeeModule | null | undefined;

function loadNotifee(): NotifeeModule | null {
  if (notifee !== undefined) return notifee;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('@notifee/react-native') as NotifeeModule;
    notifee = mod;
    return mod;
  } catch (err) {
    log.ui('warn', '@notifee/react-native not installed; notifications disabled', err);
    notifee = null;
    return null;
  }
}

const CHANNEL_IDS: Record<NotificationChannel, string> = {
  backup: 'sms_vault_backup',
  restore: 'sms_vault_restore',
  schedule: 'sms_vault_schedule',
  error: 'sms_vault_error',
};

const CHANNEL_DETAILS: Record<NotificationChannel, { name: string; importance: 'DEFAULT' | 'LOW' | 'HIGH' }> = {
  backup: { name: 'Backup Events', importance: 'DEFAULT' },
  restore: { name: 'Restore Events', importance: 'DEFAULT' },
  schedule: { name: 'Scheduled Backups', importance: 'LOW' },
  error: { name: 'Errors', importance: 'HIGH' },
};

let channelsReady = false;

async function ensureChannels(): Promise<void> {
  const mod = loadNotifee();
  if (!mod || channelsReady) return;
  if (Platform.OS !== 'android') {
    channelsReady = true;
    return;
  }
  try {
    await Promise.all(
      (Object.keys(CHANNEL_IDS) as NotificationChannel[]).map((channel) =>
        mod.createChannel({
          id: CHANNEL_IDS[channel],
          name: CHANNEL_DETAILS[channel].name,
          importance: CHANNEL_DETAILS[channel].importance,
        })
      )
    );
    channelsReady = true;
    log.ui('debug', 'Notification channels registered');
  } catch (e) {
    log.ui('warn', 'Failed to create notification channels', e);
  }
}

export async function ensureNotificationPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  if (await hasNotificationPermission()) return true;
  return requestNotificationPermission();
}

export async function showNotification(payload: {
  channel?: NotificationChannel;
  title: string;
  body: string;
  id?: string;
  hideContent?: boolean; // honor hideNotificationContent setting
}): Promise<void> {
  const mod = loadNotifee();
  if (!mod) return;

  try {
    await ensureChannels();
    const channel = payload.channel ?? 'backup';

    // Respect user's preference to hide content
    const body = payload.hideContent
      ? 'Tap to open SMS Vault'
      : payload.body;

    await mod.displayNotification({
      id: payload.id,
      title: payload.title,
      body,
      android: {
        channelId: CHANNEL_IDS[channel],
        smallIcon: 'ic_notification',
        color: theme.colors.primary,
        pressAction: { id: 'default' },
      },
      ios: {
        foregroundPresentationOptions: { banner: true, sound: true, badge: false },
      },
    });
  } catch (e) {
    log.ui('warn', 'displayNotification failed', e);
  }
}

export async function cancelNotification(id: string): Promise<void> {
  const mod = loadNotifee();
  if (!mod) return;
  try {
    await mod.cancelNotification(id);
  } catch (e) {
    log.ui('warn', 'cancelNotification failed', e);
  }
}

export async function cancelAll(): Promise<void> {
  const mod = loadNotifee();
  if (!mod) return;
  try {
    await mod.cancelAllNotifications();
  } catch (e) {
    log.ui('warn', 'cancelAllNotifications failed', e);
  }
}

// === Convenient helpers for backup results ===

export async function notifyBackupSuccess(stats: {
  sms: number;
  callLogs: number;
  sizeBytes: number;
  clouds: number;
  hideContent?: boolean;
}): Promise<void> {
  const cloudsSummary = stats.clouds > 0 ? ` · ${stats.clouds} cloud${stats.clouds > 1 ? 's' : ''}` : '';
  await showNotification({
    channel: 'backup',
    title: 'Backup complete',
    body: `${stats.sms.toLocaleString()} SMS · ${stats.callLogs.toLocaleString()} calls${cloudsSummary}`,
    hideContent: stats.hideContent,
  });
}

export async function notifyBackupFailure(error: string): Promise<void> {
  await showNotification({
    channel: 'error',
    title: 'Backup failed',
    body: error || 'An unexpected error occurred during backup.',
  });
}

export async function notifyRestoreSuccess(stats: { sms: number; callLogs: number }): Promise<void> {
  await showNotification({
    channel: 'restore',
    title: 'Restore complete',
    body: `${stats.sms.toLocaleString()} SMS · ${stats.callLogs.toLocaleString()} call logs restored`,
  });
}

export async function notifyScheduledStart(): Promise<void> {
  await showNotification({
    channel: 'schedule',
    title: 'Scheduled backup started',
    body: 'Your backup is running in the background.',
  });
}

// === Foreground/background state observer for backup progress notifications ===

let lastAppState: AppStateStatus = AppState.currentState;
export function observingAppStateForAlwaysOnNotifications(): void {
  // Allow consumers to surface progress when app is backgrounded.
  lastAppState = AppState.currentState;
}
export function getLastAppState(): AppStateStatus {
  return lastAppState;
}

let appStateListener: ReturnType<typeof AppState.addEventListener> | null = null;
export function startObservingAppState(): void {
  if (appStateListener) return;
  appStateListener = AppState.addEventListener('change', (state) => {
    lastAppState = state;
  });
}
export function stopObservingAppState(): void {
  if (appStateListener) {
    appStateListener.remove();
    appStateListener = null;
  }
}

export default {
  showNotification,
  cancelNotification,
  cancelAll,
  ensureNotificationPermission,
  notifyBackupSuccess,
  notifyBackupFailure,
  notifyRestoreSuccess,
  notifyScheduledStart,
  startObservingAppState,
  stopObservingAppState,
};
