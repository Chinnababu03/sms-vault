import { NativeModules, Platform } from 'react-native';
import type { SmsMessage, MmsMessage, CallLogEntry, DeviceInfo } from '../types';

// ============================================================
// SMS Vault v2.0 - Native Bridge Interface
// ============================================================

const { SmsBridge, CallLogBridge, RestoreBridge, PermissionBridge } = NativeModules;

// === Type Definitions for Native Bridge ===

interface SmsBridgeModule {
  readSms(sinceTimestamp: number): Promise<string>;
  readMms(sinceTimestamp: number): Promise<string>;
  getSmsCount(): Promise<number>;
  getMmsCount(): Promise<number>;
}

interface CallLogBridgeModule {
  readCallLogs(sinceTimestamp: number): Promise<string>;
  getCallLogCount(): Promise<number>;
}

interface RestoreBridgeModule {
  writeSms(messagesJson: string): Promise<number>;
  writeCallLogs(entriesJson: string): Promise<number>;
  isDefaultSmsApp(): Promise<boolean>;
  requestDefaultSmsApp(): Promise<void>;
}

interface PermissionBridgeModule {
  hasSmsPermission(): Promise<boolean>;
  requestSmsPermission(): Promise<boolean>;
  hasCallLogPermission(): Promise<boolean>;
  requestCallLogPermission(): Promise<boolean>;
  hasWriteSmsPermission(): Promise<boolean>;
  requestWriteSmsPermission(): Promise<boolean>;
  hasNotificationPermission(): Promise<boolean>;
  requestNotificationPermission(): Promise<boolean>;
  getDeviceInfo(): Promise<DeviceInfo>;
  isDefaultSmsApp(): Promise<boolean>;
  requestDefaultSmsApp(): Promise<void>;
}

// === Typed Native Modules ===

const smsBridge = SmsBridge as SmsBridgeModule;
const callLogBridge = CallLogBridge as CallLogBridgeModule;
const restoreBridge = RestoreBridge as RestoreBridgeModule;
const permissionBridge = PermissionBridge as PermissionBridgeModule;

// === SMS Operations ===

export async function readSms(sinceTimestamp: number = 0): Promise<SmsMessage[]> {
  if (Platform.OS !== 'android') {
    console.warn('readSms is only supported on Android');
    return [];
  }
  try {
    const result = await smsBridge.readSms(sinceTimestamp);
    const messages = typeof result === 'string' ? JSON.parse(result) : result;
    return Array.isArray(messages) ? messages : [];
  } catch (error) {
    console.error('Failed to read SMS:', error);
    throw error;
  }
}

export async function readMms(sinceTimestamp: number = 0): Promise<MmsMessage[]> {
  if (Platform.OS !== 'android') {
    console.warn('readMms is only supported on Android');
    return [];
  }
  try {
    const result = await smsBridge.readMms(sinceTimestamp);
    const messages = typeof result === 'string' ? JSON.parse(result) : result;
    return Array.isArray(messages) ? messages : [];
  } catch (error) {
    console.error('Failed to read MMS:', error);
    throw error;
  }
}

export async function getSmsCount(): Promise<number> {
  if (Platform.OS !== 'android') return 0;
  try {
    return await smsBridge.getSmsCount();
  } catch (error) {
    console.error('Failed to get SMS count:', error);
    return 0;
  }
}

export async function getMmsCount(): Promise<number> {
  if (Platform.OS !== 'android') return 0;
  try {
    return await smsBridge.getMmsCount();
  } catch (error) {
    console.error('Failed to get MMS count:', error);
    return 0;
  }
}

// === Call Log Operations ===

export async function readCallLogs(sinceTimestamp: number = 0): Promise<CallLogEntry[]> {
  if (Platform.OS !== 'android') {
    console.warn('readCallLogs is only supported on Android');
    return [];
  }
  try {
    const result = await callLogBridge.readCallLogs(sinceTimestamp);
    const logs = typeof result === 'string' ? JSON.parse(result) : result;
    return Array.isArray(logs) ? logs : [];
  } catch (error) {
    console.error('Failed to read call logs:', error);
    throw error;
  }
}

export async function getCallLogCount(): Promise<number> {
  if (Platform.OS !== 'android') return 0;
  try {
    return await callLogBridge.getCallLogCount();
  } catch (error) {
    console.error('Failed to get call log count:', error);
    return 0;
  }
}

// === Restore Operations ===

export async function writeSms(messages: SmsMessage[]): Promise<number> {
  if (Platform.OS !== 'android') {
    throw new Error('writeSms is only supported on Android');
  }
  try {
    const json = JSON.stringify(messages);
    return await restoreBridge.writeSms(json);
  } catch (error) {
    console.error('Failed to write SMS:', error);
    throw error;
  }
}

export async function writeCallLogs(entries: CallLogEntry[]): Promise<number> {
  if (Platform.OS !== 'android') {
    throw new Error('writeCallLogs is only supported on Android');
  }
  try {
    const json = JSON.stringify(entries);
    return await restoreBridge.writeCallLogs(json);
  } catch (error) {
    console.error('Failed to write call logs:', error);
    throw error;
  }
}

export async function isDefaultSmsApp(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  try {
    return await restoreBridge.isDefaultSmsApp();
  } catch (error) {
    console.error('Failed to check default SMS app:', error);
    return false;
  }
}

export async function requestDefaultSmsApp(): Promise<void> {
  if (Platform.OS !== 'android') return;
  try {
    await restoreBridge.requestDefaultSmsApp();
  } catch (error) {
    console.error('Failed to request default SMS app:', error);
    throw error;
  }
}

// === Permission Operations ===

export async function hasSmsPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  try {
    return await permissionBridge.hasSmsPermission();
  } catch (error) {
    console.error('Failed to check SMS permission:', error);
    return false;
  }
}

export async function requestSmsPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  try {
    return await permissionBridge.requestSmsPermission();
  } catch (error) {
    console.error('Failed to request SMS permission:', error);
    return false;
  }
}

export async function hasCallLogPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  try {
    return await permissionBridge.hasCallLogPermission();
  } catch (error) {
    console.error('Failed to check call log permission:', error);
    return false;
  }
}

export async function requestCallLogPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  try {
    return await permissionBridge.requestCallLogPermission();
  } catch (error) {
    console.error('Failed to request call log permission:', error);
    return false;
  }
}

export async function hasWriteSmsPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  try {
    return await permissionBridge.hasWriteSmsPermission();
  } catch (error) {
    console.error('Failed to check write SMS permission:', error);
    return false;
  }
}

export async function requestWriteSmsPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  try {
    return await permissionBridge.requestWriteSmsPermission();
  } catch (error) {
    console.error('Failed to request write SMS permission:', error);
    return false;
  }
}

export async function hasNotificationPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  try {
    return await permissionBridge.hasNotificationPermission();
  } catch (error) {
    console.error('Failed to check notification permission:', error);
    return false;
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  try {
    return await permissionBridge.requestNotificationPermission();
  } catch (error) {
    console.error('Failed to request notification permission:', error);
    return false;
  }
}

export async function getDeviceInfo(): Promise<DeviceInfo> {
  if (Platform.OS !== 'android') {
    return {
      manufacturer: 'Apple',
      model: 'iPhone',
      osVersion: Platform.Version.toString(),
      appVersion: '2.0.0',
      sdkVersion: Platform.Version as number,
      uniqueId: 'ios-device',
    };
  }
  try {
    return await permissionBridge.getDeviceInfo();
  } catch (error) {
    console.error('Failed to get device info:', error);
    throw error;
  }
}

// === Batch Permission Check ===

export async function checkAllPermissions(): Promise<{
  sms: boolean;
  callLog: boolean;
  writeSms: boolean;
  notification: boolean;
}> {
  const [sms, callLog, writeSms, notification] = await Promise.all([
    hasSmsPermission(),
    hasCallLogPermission(),
    hasWriteSmsPermission(),
    hasNotificationPermission(),
  ]);
  return { sms, callLog, writeSms, notification };
}

export async function requestAllPermissions(): Promise<{
  sms: boolean;
  callLog: boolean;
  writeSms: boolean;
}> {
  const [sms, callLog] = await Promise.all([
    requestSmsPermission(),
    requestCallLogPermission(),
  ]);
  return { sms, callLog, writeSms: false };
}
