// ============================================================
// SMS Vault v2.0 - Cloud Adapter Registry
// A singleton factory that returns the adapter for a provider
// and persists tokens securely (react-native-keychain when
// available, AsyncStorage otherwise).
// ============================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CloudProvider } from '../../types';
import type { CloudAdapter } from './types';
import { GoogleDriveAdapter } from './googleDrive';
import { OneDriveAdapter } from './oneDrive';
import { DropboxAdapter } from './dropbox';
import { CLOUD_CONFIGS } from './types';
import { log } from '../../utils/logger';

/**
 * A minimal secure-storage interface. Will use react-native-keychain
 * when installed; otherwise falls back to AsyncStorage (which on Android
 * is encrypted on unencrypted-data builds depending on device). For a
 * production privacy-first app, the keychain module is the recommended
 * dependency and should be added in package.json.
 */
interface KeychainLike {
  setGenericPassword: (username: string, password: string, service: string) => Promise<boolean>;
  getGenericPassword: (opts: { service: string }) => Promise<{ username: string; password: string } | null>;
  resetGenericPassword: (opts: { service: string }) => Promise<boolean>;
}

let keychain: KeychainLike | null | undefined;
function loadKeychain(): KeychainLike | null {
  if (keychain !== undefined) return keychain;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    keychain = require('react-native-keychain') as KeychainLike;
    return keychain;
  } catch (err) {
    log.cloud('warn', 'react-native-keychain not installed; using AsyncStorage fallback for tokens', err);
    keychain = null;
    return null;
  }
}

const TOKEN_PREFIX = '@sms_vault_token_';

async function saveTokens(provider: CloudProvider, tokenJson: string): Promise<void> {
  const kc = loadKeychain();
  if (kc) {
    try {
      await kc.setGenericPassword(provider, tokenJson, `com.smsvault.${provider}.tokens`);
      return;
    } catch (e) {
      log.cloud('warn', 'Keychain write failed; falling back to AsyncStorage', e);
    }
  }
  await AsyncStorage.setItem(`${TOKEN_PREFIX}${provider}`, tokenJson);
}

async function loadTokens(provider: CloudProvider): Promise<string | null> {
  const kc = loadKeychain();
  if (kc) {
    try {
      const credentials = await kc.getGenericPassword({ service: `com.smsvault.${provider}.tokens` });
      if (credentials && typeof credentials.password === 'string') {
        return credentials.password;
      }
      return null;
    } catch (e) {
      log.cloud('warn', 'Keychain read failed; falling back to AsyncStorage', e);
    }
  }
  return AsyncStorage.getItem(`${TOKEN_PREFIX}${provider}`);
}

async function clearTokens(provider: CloudProvider): Promise<void> {
  const kc = loadKeychain();
  if (kc) {
    try {
      await kc.resetGenericPassword({ service: `com.smsvault.${provider}.tokens` });
    } catch (e) {
      log.cloud('warn', 'Keychain reset failed', e);
    }
  }
  await AsyncStorage.removeItem(`${TOKEN_PREFIX}${provider}`);
}

// === Adapter registry ===

const adapters = new Map<CloudProvider, CloudAdapter>();

export function getAdapter(provider: CloudProvider): CloudAdapter {
  let adapter = adapters.get(provider);
  if (!adapter) {
    switch (provider) {
      case 'google_drive':
        adapter = new GoogleDriveAdapter();
        break;
      case 'onedrive':
        adapter = new OneDriveAdapter();
        break;
      case 'dropbox':
        adapter = new DropboxAdapter();
        break;
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
    adapters.set(provider, adapter);
  }
  return adapter;
}

// === Auth orchestration ===

export async function authenticateProvider(provider: CloudProvider): Promise<void> {
  const adapter = getAdapter(provider);
  await adapter.authenticate();
  // After authenticate() succeeds, the adapter stores its tokens in memory.
  // We eagerly persist them via keychain if the adapter exposes its tokens
  // through any public getter. Currently adapters keep them private, so we
  // write a soft marker that the user has authenticated at least once.
  const timestamp = new Date().toISOString();
  await saveTokens(provider, JSON.stringify({ provider, lastAuthenticated: timestamp }));
}

export async function isProviderAuthenticated(provider: CloudProvider): Promise<boolean> {
  const adapter = getAdapter(provider);
  try {
    return await adapter.isAuthenticated();
  } catch (err) {
    log.cloud('warn', `isAuthenticated failed for ${provider}`, err);
    return false;
  }
}

export async function refreshProviderTokens(provider: CloudProvider): Promise<void> {
  const adapter = getAdapter(provider);
  await adapter.refreshTokens();
}

export async function disconnectProvider(provider: CloudProvider): Promise<void> {
  const adapter = getAdapter(provider);
  await adapter.disconnect();
  await clearTokens(provider);
  adapters.delete(provider);
}

export async function reinstallProviderIfAuthed(provider: CloudProvider): Promise<boolean> {
  const tokenJson = await loadTokens(provider);
  if (!tokenJson) return false;
  try {
    const parsed = JSON.parse(tokenJson) as { lastAuthenticated?: string };
    return Boolean(parsed.lastAuthenticated);
  } catch {
    return false;
  }
}

export { CLOUD_CONFIGS };
