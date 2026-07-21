// ============================================================
// SMS Vault v2.0 - Encryption Service tests
// ============================================================

import {
  generateSalt,
  generateIV,
  generateRandomPassword,
  deriveKey,
  sha256,
  calculateChecksum,
  verifyChecksum,
  encrypt,
  decrypt,
  encryptBackup,
  decryptBackup,
  encodeData,
  decodeData,
  hashPassword,
  createEncryptionMetadata,
} from '../src/services/encryptionService';

describe('encryptionService - randomness', () => {
  it('generateSalt returns 16 bytes', () => {
    expect(generateSalt().length).toBe(16);
  });
  it('generateIV returns 12 bytes', () => {
    expect(generateIV().length).toBe(12);
  });
  it('generateRandomPassword is nonempty base64', () => {
    const pw = generateRandomPassword();
    expect(pw.length).toBeGreaterThan(10);
  });
  it('two salts differ', () => {
    expect(generateSalt()).not.toEqual(generateSalt());
  });
});

describe('encryptionService - derivation + hashing', () => {
  it('deriveKey is deterministic for the same password+salt', () => {
    const salt = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
    const a = deriveKey('hunter2', salt);
    const b = deriveKey('hunter2', salt);
    expect(a).toEqual(b);
  });
  it('deriveKey changes with password', () => {
    const salt = generateSalt();
    expect(deriveKey('a', salt)).not.toEqual(deriveKey('b', salt));
  });
  it('deriveKey has 32 bytes', () => {
    expect(deriveKey('x', generateSalt()).length).toBe(32);
  });

  it('sha256 has 64 hex chars', () => {
    const h = sha256('hello');
    expect(h).toMatch(/^[0-9a-f]{64}$/);
  });

  it('sha256 matches node crypto for ASCII strings', () => {
    // sha256("abc") = ...
    expect(sha256('abc')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'
    );
  });
});

describe('encryptionService - checksum helpers', () => {
  it('calculateChecksum returns sha256 hex', () => {
    expect(calculateChecksum('test')).toMatch(/^[0-9a-f]{64}$/);
  });
  it('verifyChecksum true for correct checksum', () => {
    const cs = calculateChecksum('payload');
    expect(verifyChecksum('payload', cs)).toBe(true);
  });
  it('verifyChecksum false for wrong checksum', () => {
    expect(verifyChecksum('payload', 'wrong')).toBe(false);
  });
});

describe('encryptionService - encode/decode helpers', () => {
  it('encodeData round-trips an object', () => {
    const data = { a: 1, b: ['x', 'y'] };
    const encoded = encodeData(data);
    expect(decodeData(encoded)).toEqual(data);
  });

  it('hashPassword returns a hash + salt', () => {
    const { hash, salt } = hashPassword('pw');
    expect(hash).toBeTruthy();
    expect(salt).toBeTruthy();
  });

  it('createEncryptionMetadata provides defaults', () => {
    const m = createEncryptionMetadata('s', 'iv', 'tag');
    expect(m.algorithm).toBe('AES-256-GCM');
    expect(m.keyVersion).toBe(1);
    expect(m.salt).toBe('s');
  });
});

describe('encryptionService - encrypt/decrypt end-to-end (mock-backed)', () => {
  it('encrypt returns iv/tag/salt metadata', async () => {
    const enc = await encrypt('plain text', 'pw');
    expect(enc.iv).toMatch(/^[0-9a-f]+$/);
    expect(enc.tag).toHaveLength(32);
    expect(enc.salt).toBeTruthy();
  });

  it('decrypt returns a string when called with the mock', async () => {
    const plain = await decrypt('irrelevant-ciphertext', 'pw', 'iv', 'tag', 'salt');
    expect(plain).toBe('{ "roundtrip": true }');
  });

  it('encryptBackup returns checksum + metadata', async () => {
    const enc = await encryptBackup({ hello: 'world' }, 'pw');
    expect(enc.checksum).toMatch(/^[0-9a-f]{64}$/);
    expect(enc.metadata.algorithm).toBe('AES-256-GCM');
  });

  it('decryptBackup throws on checksum mismatch when mock returns different plaintext', async () => {
    // The decrypt() mock returns a fixed '{ "roundtrip": true }' string which
    // will not match the original data's checksum — verifying the service
    // does enforce integrity in the round-trip.
    const enc = await encryptBackup({ x: 1 }, 'pw');
    await expect(decryptBackup(enc, 'pw')).rejects.toThrow(/Checksum verification failed/);
  });
});