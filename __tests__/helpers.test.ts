// ============================================================
// SMS Vault v2.0 - Helpers unit tests
// ============================================================

import {
  formatBytes,
  formatDate,
  formatTime,
  formatDateTime,
  formatDuration,
  formatPhoneNumber,
  formatSmsCount,
  formatCallCount,
  generateId,
  generateUUID,
  isValidPhoneNumber,
  isValidEmail,
  chunkArray,
  uniqueById,
  startOfDay,
  endOfDay,
  daysBetween,
  truncate,
  capitalize,
  pluralize,
  getSmsTypeName,
  getCallTypeName,
  getCallTypeColor,
} from '../src/utils/helpers';

describe('formatBytes', () => {
  it('formats 0 bytes', () => {
    expect(formatBytes(0)).toBe('0 B');
  });
  it('formats KB', () => {
    expect(formatBytes(1024)).toBe('1 KB');
  });
  it('formats MB', () => {
    expect(formatBytes(1024 * 1024 * 2.5)).toBe('2.5 MB');
  });
  it('formats GB', () => {
    expect(formatBytes(1024 ** 3 * 5)).toBe('5 GB');
  });
});

describe('formatTime', () => {
  it('formats time of day in HH:MM', () => {
    const ts = new Date('2026-07-01T14:30:00').getTime();
    expect(formatTime(ts)).toMatch(/\d{1,2}:\d{2}/);
  });
});

describe('formatDateTime', () => {
  it('returns a readable month/day/time string', () => {
    const ts = new Date('2026-07-01T14:30:00').getTime();
    expect(formatDateTime(ts)).toContain('Jul');
    expect(formatDateTime(ts)).toMatch(/\d{1,2}:\d{2}/);
  });
});

describe('formatDuration', () => {
  it('formats seconds', () => {
    expect(formatDuration(45)).toBe('45s');
  });
  it('formats minutes with seconds', () => {
    expect(formatDuration(125)).toBe('2m 5s');
  });
  it('formats minutes without seconds', () => {
    expect(formatDuration(120)).toBe('2m');
  });
  it('formats hours+minutes', () => {
    expect(formatDuration(3700)).toBe('1h 1m');
  });
});

describe('formatPhoneNumber', () => {
  it('formats 10-digit numbers', () => {
    expect(formatPhoneNumber('1234567890')).toBe('(123) 456-7890');
  });
  it('formats 11-digit numbers starting with 1', () => {
    expect(formatPhoneNumber('11234567890')).toBe('+1 (123) 456-7890');
  });
  it('passes through unusual formats untouched', () => {
    expect(formatPhoneNumber('abc12345')).toBe('abc12345');
  });
});

describe('formatSmsCount / formatCallCount', () => {
  it('handles single/plural SMS', () => {
    expect(formatSmsCount(1)).toBe('1 message');
    expect(formatSmsCount(1234)).toBe('1,234 messages');
  });
  it('handles single/plural calls', () => {
    expect(formatCallCount(1)).toBe('1 call');
    expect(formatCallCount(50)).toBe('50 calls');
  });
});

describe('IDs', () => {
  it('generateId is unique-ish and nonempty', () => {
    const a = generateId();
    const b = generateId();
    expect(a).toBeTruthy();
    expect(b).toBeTruthy();
    expect(a).not.toBe(b);
  });
  it('generateUUID looks like a UUID', () => {
    expect(generateUUID()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });
});

describe('validators', () => {
  it('validates phone numbers', () => {
    expect(isValidPhoneNumber('1234567890')).toBe(true);
    expect(isValidPhoneNumber('123')).toBe(false);
  });
  it('validates emails', () => {
    expect(isValidEmail('a@b.co')).toBe(true);
    expect(isValidEmail('not-email')).toBe(false);
  });
});

describe('array helpers', () => {
  it('chunks arrays', () => {
    expect(chunkArray([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });
  it('dedupes by id', () => {
    expect(uniqueById([{ id: 1 }, { id: 1 }, { id: 2 }])).toEqual([{ id: 1 }, { id: 2 }]);
  });
});

describe('date helpers', () => {
  it('startOfDay zeroes the clock', () => {
    const noon = new Date('2026-01-15T12:30:45').getTime();
    const sod = new Date(startOfDay(noon));
    expect(sod.getHours()).toBe(0);
    expect(sod.getMinutes()).toBe(0);
  });
  it('endOfDay sets max time', () => {
    const eod = new Date(endOfDay(new Date('2026-01-15T12:30:45').getTime()));
    expect(eod.getHours()).toBe(23);
    expect(eod.getMinutes()).toBe(59);
    expect(eod.getMilliseconds()).toBe(999);
  });
  it('daysBetween counts days', () => {
    const a = new Date('2026-01-01').getTime();
    const b = new Date('2026-01-05').getTime();
    expect(daysBetween(a, b)).toBe(4);
  });
});

describe('string helpers', () => {
  it('truncate adds ellipsis', () => {
    expect(truncate('hello world!', 8)).toBe('hello...');
  });
  it('truncate noop for short strings', () => {
    expect(truncate('hi', 5)).toBe('hi');
  });
  it('capitalize', () => {
    expect(capitalize('SMS Vault')).toBe('Sms vault');
  });
  it('pluralize', () => {
    expect(pluralize(1, 'cat')).toBe('cat');
    expect(pluralize(2, 'cat')).toBe('cats');
    expect(pluralize(2, 'child', 'children')).toBe('children');
  });
});

describe('message type helpers', () => {
  it('getSmsTypeName', () => {
    expect(getSmsTypeName(1)).toBe('Received');
    expect(getSmsTypeName(2)).toBe('Sent');
    expect(getSmsTypeName(99)).toBe('Unknown');
  });
  it('getCallTypeName', () => {
    expect(getCallTypeName(1)).toBe('Incoming');
    expect(getCallTypeName(3)).toBe('Missed');
    expect(getCallTypeName(99)).toBe('Unknown');
  });
  it('getCallTypeColor returns a hex color', () => {
    expect(getCallTypeColor(1)).toMatch(/^#/);
  });
});
