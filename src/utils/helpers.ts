import type { CloudProvider } from '../types';

// ============================================================
// SMS Vault v2.0 - Helper Functions
// ============================================================

// === Cloud Provider Helpers ===

export const CLOUD_LABELS: Record<CloudProvider, string> = {
  google_drive: 'Google Drive',
  onedrive: 'OneDrive',
  dropbox: 'Dropbox',
};

export const CLOUD_COLORS: Record<CloudProvider, string> = {
  google_drive: '#34A853',
  onedrive: '#0078D4',
  dropbox: '#0061FF',
};

export const CLOUD_ICONS: Record<CloudProvider, string> = {
  google_drive: 'google-drive',
  onedrive: 'onedrive',
  dropbox: 'dropbox',
};

export const CLOUD_LOGOS: Record<CloudProvider, string> = {
  google_drive: '🔷',
  onedrive: '☁️',
  dropbox: '📦',
};

// === Formatting Helpers ===

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) {
    return 'Just now';
  } else if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays === 1) {
    return `Yesterday`;
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  }
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

export function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDateTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) {
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}

export function formatPhoneNumber(phoneNumber: string): string {
  const cleaned = phoneNumber.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  if (cleaned.length === 11 && cleaned[0] === '1') {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  return phoneNumber;
}

export function formatSmsCount(count: number): string {
  if (count === 1) return '1 message';
  return `${count.toLocaleString()} messages`;
}

export function formatCallCount(count: number): string {
  if (count === 1) return '1 call';
  return `${count.toLocaleString()} calls`;
}

// === ID Generation ===

export function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// === Validation Helpers ===

export function isValidPhoneNumber(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length >= 10 && cleaned.length <= 15;
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// === Array Helpers ===

export function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

export function uniqueById<T extends { id: number }>(array: T[]): T[] {
  const seen = new Set<number>();
  return array.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

// === Date Helpers ===

export function startOfDay(timestamp: number): number {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

export function endOfDay(timestamp: number): number {
  const date = new Date(timestamp);
  date.setHours(23, 59, 59, 999);
  return date.getTime();
}

export function daysBetween(timestamp1: number, timestamp2: number): number {
  const diffMs = Math.abs(timestamp2 - timestamp1);
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

// === String Helpers ===

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return `${str.slice(0, maxLength - 3)}...`;
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function pluralize(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : (plural || `${singular}s`);
}

// === Message Type Helpers ===

export function getSmsTypeName(type: number): string {
  switch (type) {
    case 1: return 'Received';
    case 2: return 'Sent';
    case 3: return 'Draft';
    case 4: return 'Outbox';
    default: return 'Unknown';
  }
}

export function getCallTypeName(type: number): string {
  switch (type) {
    case 1: return 'Incoming';
    case 2: return 'Outgoing';
    case 3: return 'Missed';
    case 4: return 'Voicemail';
    case 5: return 'Rejected';
    case 6: return 'Blocked';
    default: return 'Unknown';
  }
}

export function getCallTypeColor(type: number): string {
  switch (type) {
    case 1: return '#00E676'; // Incoming - green
    case 2: return '#29B6F6'; // Outgoing - blue
    case 3: return '#FF1744'; // Missed - red
    case 4: return '#FFD600'; // Voicemail - yellow
    case 5: return '#FF9100'; // Rejected - orange
    case 6: return '#9E9E9E'; // Blocked - gray
    default: return '#9E9E9E';
  }
}
