// ============================================================
// SMS Vault v2.0 - usePermissions Hook
// Stateful wrapper around the native permission bridge.
// ============================================================

import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as bridge from '../services/nativeBridge';
import { log } from '../utils/logger';

export type PermissionStatus = 'idle' | 'checking' | 'granted' | 'denied';

export interface PermissionState {
  sms: PermissionStatus;
  callLog: PermissionStatus;
  writeSms: PermissionStatus;
  notification: PermissionStatus;
}

const initial: PermissionState = {
  sms: 'idle',
  callLog: 'idle',
  writeSms: 'idle',
  notification: 'idle',
};

function statusOf(granted: boolean): PermissionStatus {
  return granted ? 'granted' : 'denied';
}

export interface UsePermissionsResult {
  status: PermissionState;
  refresh: () => Promise<void>;
  requestSms: () => Promise<boolean>;
  requestCallLog: () => Promise<boolean>;
  requestWriteSms: () => Promise<boolean>;
  requestNotification: () => Promise<boolean>;
  requestAll: () => Promise<{ sms: boolean; callLog: boolean; notification: boolean }>;
  isReady: boolean;
}

export function usePermissions(refreshOnMount = true): UsePermissionsResult {
  const [status, setStatus] = useState<PermissionState>(initial);
  const [isReady, setIsReady] = useState(false);

  const refresh = useCallback(async (): Promise<void> => {
    setStatus((s) => ({ ...s, sms: 'checking', callLog: 'checking', notification: 'checking' }));
    try {
      const [sms, callLog, writeSms, notification] = await Promise.all([
        bridge.hasSmsPermission(),
        bridge.hasCallLogPermission(),
        bridge.hasWriteSmsPermission(),
        bridge.hasNotificationPermission(),
      ]);
      setStatus({
        sms: statusOf(sms),
        callLog: statusOf(callLog),
        writeSms: statusOf(writeSms),
        notification: statusOf(notification),
      });
    } catch (e) {
      log.permission('error', 'Failed to refresh permissions', e);
      setStatus((s) => ({ ...s, sms: 'idle', callLog: 'idle', notification: 'idle' }));
    } finally {
      setIsReady(true);
    }
  }, []);

  const setPart = useCallback(
    (key: 'sms' | 'callLog' | 'writeSms' | 'notification', granted: boolean) => {
      setStatus((s) => ({ ...s, [key]: statusOf(granted) }));
    },
    []
  );

  const requestSms = useCallback(async (): Promise<boolean> => {
    setStatus((s) => ({ ...s, sms: 'checking' }));
    let ok = false;
    try {
      ok = Platform.OS === 'android' ? await bridge.requestSmsPermission() : true;
    } finally {
      setPart('sms', ok);
    }
    return ok;
  }, [setPart]);

  const requestCallLog = useCallback(async (): Promise<boolean> => {
    setStatus((s) => ({ ...s, callLog: 'checking' }));
    let ok = false;
    try {
      ok = Platform.OS === 'android' ? await bridge.requestCallLogPermission() : true;
    } finally {
      setPart('callLog', ok);
    }
    return ok;
  }, [setPart]);

  const requestWriteSms = useCallback(async (): Promise<boolean> => {
    setStatus((s) => ({ ...s, writeSms: 'checking' }));
    let ok = false;
    try {
      ok = Platform.OS === 'android' ? await bridge.requestWriteSmsPermission() : true;
    } finally {
      setPart('writeSms', ok);
    }
    return ok;
  }, [setPart]);

  const requestNotification = useCallback(async (): Promise<boolean> => {
    setStatus((s) => ({ ...s, notification: 'checking' }));
    let ok = true;
    try {
      ok = await bridge.requestNotificationPermission();
    } finally {
      setPart('notification', ok);
    }
    return ok;
  }, [setPart]);

  const requestAll = useCallback(async (): Promise<{ sms: boolean; callLog: boolean; notification: boolean }> => {
    const [sms, callLog, notification] = await Promise.all([
      requestSms(),
      requestCallLog(),
      requestNotification(),
    ]);
    return { sms, callLog, notification };
  }, [requestSms, requestCallLog, requestNotification]);

  useEffect(() => {
    if (refreshOnMount) {
      refresh();
    }
  }, [refresh, refreshOnMount]);

  return {
    status,
    refresh,
    requestSms,
    requestCallLog,
    requestWriteSms,
    requestNotification,
    requestAll,
    isReady,
  };
}

export default usePermissions;
