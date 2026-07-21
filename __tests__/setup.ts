// ============================================================
// SMS Vault v2.0 - Jest setup / native module mocks
// ============================================================

// Polyfills for Buffer & TextEncoder/Decoder used by our crypto helpers.
const { Buffer } = require('buffer');
global.Buffer = global.Buffer || Buffer;

if (typeof global.TextEncoder === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const util = require('util');
  global.TextEncoder = util.TextEncoder;
  global.TextDecoder = util.TextDecoder;
}

// Stub react-native so utilities and types can be imported without a real
// bundler environment.
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native'); // keep React Native exports (Platform etc.)
  return {
    ...RN,
    NativeModules: {
      SmsBridge: {
        readSms: jest.fn(() => Promise.resolve('[]')),
        readMms: jest.fn(() => Promise.resolve('[]')),
        getSmsCount: jest.fn(() => Promise.resolve(0)),
        getMmsCount: jest.fn(() => Promise.resolve(0)),
      },
      CallLogBridge: {
        readCallLogs: jest.fn(() => Promise.resolve('[]')),
        getCallLogCount: jest.fn(() => Promise.resolve(0)),
      },
      RestoreBridge: {
        writeSms: jest.fn(() => Promise.resolve(0)),
        writeCallLogs: jest.fn(() => Promise.resolve(0)),
        isDefaultSmsApp: jest.fn(() => Promise.resolve(false)),
        requestDefaultSmsApp: jest.fn(() => Promise.resolve(undefined)),
      },
      PermissionBridge: {
        hasSmsPermission: jest.fn(() => Promise.resolve(false)),
        requestSmsPermission: jest.fn(() => Promise.resolve(true)),
        hasCallLogPermission: jest.fn(() => Promise.resolve(false)),
        requestCallLogPermission: jest.fn(() => Promise.resolve(true)),
        hasWriteSmsPermission: jest.fn(() => Promise.resolve(false)),
        requestWriteSmsPermission: jest.fn(() => Promise.resolve(true)),
        hasNotificationPermission: jest.fn(() => Promise.resolve(true)),
        requestNotificationPermission: jest.fn(() => Promise.resolve(true)),
        getDeviceInfo: jest.fn(() =>
          Promise.resolve({
            manufacturer: 'Test',
            model: 'Jest',
            osVersion: '1',
            appVersion: '2.0.0',
            sdkVersion: 30,
            uniqueId: 'test-device',
          })
        ),
        isDefaultSmsApp: jest.fn(() => Promise.resolve(false)),
        requestDefaultSmsApp: jest.fn(() => Promise.resolve(undefined)),
      },
    },
  };
});

jest.mock('react-native-fs', () => ({
  __esModule: true,
  default: {
    DocumentDirectoryPath: '/tmp/docs',
    exists: jest.fn(() => Promise.resolve(true)),
    mkdir: jest.fn(() => Promise.resolve()),
    writeFile: jest.fn(() => Promise.resolve()),
    readFile: jest.fn(() => Promise.resolve('')),
    readDir: jest.fn(() => Promise.resolve([])),
    unlink: jest.fn(() => Promise.resolve()),
    stat: jest.fn(() =>
      Promise.resolve({ size: 1024 })
    ),
  },
  DocumentDirectoryPath: '/tmp/docs',
  exists: jest.fn(() => Promise.resolve(true)),
  mkdir: jest.fn(() => Promise.resolve()),
  writeFile: jest.fn(() => Promise.resolve()),
  readFile: jest.fn(() => Promise.resolve('')),
  readDir: jest.fn(() => Promise.resolve([])),
  unlink: jest.fn(() => Promise.resolve()),
  stat: jest.fn(() => Promise.resolve({ size: 1024 })),
}));

jest.mock('@react-native-async-storage/async-storage', () => {
  let store: Record<string, string> = {};
  return {
    __esModule: true,
    default: {
      getItem: jest.fn((key: string) => Promise.resolve(store[key] ?? null)),
      setItem: jest.fn((key: string, value: string) => {
        store[key] = value;
        return Promise.resolve();
      }),
      removeItem: jest.fn((key: string) => {
        delete store[key];
        return Promise.resolve();
      }),
      getAllKeys: jest.fn(() => Promise.resolve(Object.keys(store))),
      multiGet: jest.fn((keys: string[]) =>
        Promise.resolve(keys.map((k) => [k, store[k] ?? null]))
      ),
      multiRemove: jest.fn((keys: string[]) => {
        keys.forEach((k) => {
          delete store[k];
        });
        return Promise.resolve();
      }),
      clear: jest.fn(() => {
        store = {};
        return Promise.resolve();
      }),
    },
  };
});

jest.mock('react-native-keychain', () => ({
  setGenericPassword: jest.fn(() => Promise.resolve(true)),
  getGenericPassword: jest.fn(() => Promise.resolve(null)),
  resetGenericPassword: jest.fn(() => Promise.resolve(true)),
}), { virtual: true });

jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(() =>
    Promise.resolve({ isConnected: true, type: 'wifi', isMetered: false })
  ),
  addEventListener: jest.fn(),
  useNetInfo: () => ({ isConnected: true, type: 'wifi', isMetered: false }),
}), { virtual: true });

// Optional deps guarded behind require() inside our code paths
jest.mock('@notifee/react-native', () => ({
  createChannel: jest.fn(() => Promise.resolve('id')),
  displayNotification: jest.fn(() => Promise.resolve('notif-id')),
  cancelAllNotifications: jest.fn(() => Promise.resolve()),
  cancelNotification: jest.fn(() => Promise.resolve()),
}), { virtual: true });

jest.mock('react-native-background-fetch', () => ({
  configure: jest.fn(),
  scheduleJob: jest.fn(() => Promise.resolve(true)),
  stop: jest.fn(),
  status: { denied: 0, restricted: 0, available: 1, fail: -1 },
  finish: jest.fn(),
}), { virtual: true });

jest.mock('@react-native-community/battery', () => ({
  addListener: jest.fn(() => ({ remove: jest.fn() })),
}), { virtual: true });

jest.mock('react-native-aes-gcm-crypto', () => ({
  __esModule: true,
  default: {
    encrypt: jest.fn(() => Promise.resolve({
      content: 'enc',
      iv: '000000000000000000000000',
      tag: '00000000000000000000000000000000',
    })),
    decrypt: jest.fn(() => Promise.resolve('{ "roundtrip": true }')),
  },
}), { virtual: true });

jest.mock('react-native-quick-crypto', () => {
  const { Buffer } = require('buffer');
  const crypto = require('crypto');
  // Wrap node's createHash so it tolerates ArrayBuffer inputs that the
  // production code passes via `Buffer.prototype.buffer.slice(...)`.
  const createHash = (algo: string) => {
    const hash = crypto.createHash(algo);
    const originalUpdate = hash.update.bind(hash);
    hash.update = (data: string | ArrayBuffer | Buffer) => {
      if (typeof data === 'string') {
        return originalUpdate(data, 'utf8');
      }
      if (data instanceof ArrayBuffer) {
        return originalUpdate(Buffer.from(data));
      }
      return originalUpdate(data);
    };
    return hash;
  };
  return {
    __esModule: true,
    default: {
      randomBytes: (len: number) => new Uint8Array(crypto.randomBytes(len)),
      pbkdf2Sync: (password: Buffer, salt: Buffer, iter: number, keyLen: number, algo: string) =>
        crypto.pbkdf2Sync(password, salt, iter, keyLen, algo.replace('-', '').toLowerCase()),
      createHash: (algo: string) => createHash(algo),
    },
  };
}, { virtual: true });
