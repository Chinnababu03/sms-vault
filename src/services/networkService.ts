// ============================================================
// SMS Vault v2.0 - Network Service
// Monitors connectivity and respects user's wifiOnly/chargingOnly
// settings so backup operations can guard correctly.
// ============================================================

import { Platform } from 'react-native';
import { log } from '../utils/logger';
import { NetworkError } from '../utils/errors';

export interface NetworkState {
  /** Is the device online at all? */
  isConnected: boolean;
  /** Is the active connection metered (e.g. cellular)? false => WiFi/Ethernet. */
  isMetered: boolean;
  /** Best-guess WiFi-only signal — true when connected via WiFi/Ethernet. */
  isWifi: boolean;
  /** Native provides battery/charging info via NativeModules if available. */
  isCharging: boolean;
  /** Battery percentage 0..1 (or -1 if unknown). */
  batteryLevel: number;
}

const initial: NetworkState = {
  isConnected: true,
  isMetered: false,
  isWifi: true,
  isCharging: false,
  batteryLevel: -1,
};

// Lazily load optional RN native modules to keep this module resilient
// in non-native test environments.
function loadNetInfo(): {
  useNetInfo: () => { isConnected?: boolean | null; type?: string; isMetered?: boolean | null; isWifiEnabled?: boolean | null };
} | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('@react-native-community/netinfo') as {
      useNetInfo: () => { isConnected?: boolean | null; type?: string; isMetered?: boolean | null; isWifiEnabled?: boolean | null };
    };
  } catch {
    return null;
  }
}

function loadBattery(): {
  addListener: (cb: (state: { level?: number | null; charging?: boolean | null }) => void) => { remove: () => void };
} | null {
  try {
    // @react-native-community/battery is optional
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('@react-native-community/battery') as {
      addListener: (cb: (state: { level?: number | null; charging?: boolean | null }) => void) => { remove: () => void };
    };
  } catch {
    return null;
  }
}

let cachedBattery: { isCharging: boolean; batteryLevel: number } = { isCharging: false, batteryLevel: -1 };

export function startMonitoringBattery(): void {
  if (Platform.OS !== 'android' && Platform.OS !== 'ios') return;
  const battery = loadBattery();
  if (!battery) return;
  try {
    const sub = battery.addListener((state) => {
      cachedBattery = {
        isCharging: Boolean(state.charging),
        batteryLevel: typeof state.level === 'number' ? state.level : -1,
      };
    });
    // Stored subscription kept for the lifetime of the app.
    void sub;
  } catch (e) {
    log.network('warn', 'Failed to register battery listener', e);
  }
}

let unsubscribeNet: (() => void) | null = null;
let cachedNet: NetworkState = initial;

export async function refreshNetworkState(): Promise<NetworkState> {
  const netInfo = loadNetInfo();
  if (!netInfo) {
    cachedNet = initial;
    return initial;
  }
  try {
    // useNetInfo is a hook — we only call modules via reflection-free read.
    // Note: For reads outside React, fetch latest using the underlying fetch API shape.
    // Many RN netinfo modules also expose fetchData; use it when present.
    const mod = netInfo as unknown as {
      fetch?: () => Promise<{ isConnected?: boolean | null; type?: string; isMetered?: boolean | null }>;
    };
    if (typeof mod.fetch === 'function') {
      const latest = await mod.fetch();
      cachedNet = {
        isConnected: Boolean(latest.isConnected),
        isMetered: Boolean(latest.isMetered),
        isWifi: (latest.type && ['wifi', 'ethernet'].includes(latest.type)) || (!!latest.isConnected && !latest.isMetered),
        isCharging: cachedBattery.isCharging,
        batteryLevel: cachedBattery.batteryLevel,
      };
    }
  } catch (e) {
    log.network('warn', 'Failed to refresh network state', e);
  }
  return cachedNet;
}

export async function getNetworkState(): Promise<NetworkState> {
  return refreshNetworkState();
}

/** Helper for when a backup operation must meet user's network constraints. */
export async function meetsBackupConstraints(req: { wifiOnly: boolean; chargingOnly: boolean }): Promise<boolean> {
  const net = await refreshNetworkState();
  if (!net.isConnected) {
    log.network('warn', 'Backup refused: no connectivity');
    return false;
  }
  if (req.wifiOnly && net.isMetered && !net.isWifi) {
    log.network('warn', 'Backup refused: metered network (wifiOnly=true)');
    return false;
  }
  if (req.chargingOnly && !net.isCharging) {
    log.network('warn', 'Backup refused: not charging (chargingOnly=true)');
    return false;
  }
  return true;
}

/** Throws when constraints aren't met — convenient for service-layer guards. */
export async function assertBackupConstraints(req: { wifiOnly: boolean; chargingOnly: boolean }): Promise<void> {
  const ok = await meetsBackupConstraints(req);
  if (!ok) {
    throw new NetworkError(
      'Backup skipped: network or charging constraints not met',
      { chargingOnly: req.chargingOnly, wifiOnly: req.wifiOnly }
    );
  }
}

export function watchNetworkState(handler: (s: NetworkState) => void): () => void {
  if (unsubscribeNet) {
    return () => {
      /* no-op if already running */
    };
  }
  const netInfo = loadNetInfo();
  if (!netInfo) {
    handler(initial);
    return () => {
      /* no-op */
    };
  }
  // @react-native-community/netinfo exposes an addEventListener
  try {
    const mod = netInfo as unknown as {
      addEventListener?: (cb: (s: { isConnected?: boolean | null; type?: string; isMetered?: boolean | null }) => void) => () => void;
    };
    if (mod.addEventListener) {
      const inner = mod.addEventListener((s) => {
        cachedNet = {
          isConnected: Boolean(s.isConnected),
          isMetered: Boolean(s.isMetered),
          isWifi: (s.type && ['wifi', 'ethernet'].includes(s.type)) || (!!s.isConnected && !s.isMetered),
          isCharging: cachedBattery.isCharging,
          batteryLevel: cachedBattery.batteryLevel,
        };
        handler(cachedNet);
      });
      unsubscribeNet = inner;
      return () => {
        try {
          inner();
        } catch {
          /* ignore */
        }
        unsubscribeNet = null;
      };
    }
  } catch (e) {
    log.network('warn', 'watchNetworkState failed', e);
  }
  return () => {
    /* fallback noop */
  };
}

export default {
  getNetworkState,
  refreshNetworkState,
  meetsBackupConstraints,
  assertBackupConstraints,
  watchNetworkState,
  startMonitoringBattery,
};
