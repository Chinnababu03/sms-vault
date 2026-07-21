import { Buffer } from 'buffer';
import AesGcmCrypto from 'react-native-aes-gcm-crypto';
import QuickCrypto from 'react-native-quick-crypto';

// ============================================================
// SMS Vault v2.0 - Encryption Service
// AES-256-GCM with PBKDF2 Key Derivation
// ============================================================

const PBKDF2_ITERATIONS = 100000;
const SALT_LENGTH = 16; // bytes
const IV_LENGTH = 12; // bytes for GCM
const KEY_LENGTH = 32; // bytes (256 bits)
const HASH_ALGORITHM = 'sha512';

// === Conversion Helpers ===

function uint8ArrayToBase64(arr: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < arr.length; i++) {
    binary += String.fromCharCode(arr[i]);
  }
  return Buffer.from(binary, 'binary').toString('base64');
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = Buffer.from(base64, 'base64').toString('binary');
  const arr = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    arr[i] = binary.charCodeAt(i);
  }
  return arr;
}

function stringToUint8Array(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

function uint8ArrayToString(arr: Uint8Array): string {
  return new TextDecoder().decode(arr);
}

// === Random Bytes Generation (using react-native-quick-crypto) ===

export function generateRandomBytes(length: number): Uint8Array {
  return QuickCrypto.randomBytes(length);
}

// === Key Generation ===

export function generateSalt(): Uint8Array {
  return generateRandomBytes(SALT_LENGTH);
}

export function generateIV(): Uint8Array {
  return generateRandomBytes(IV_LENGTH);
}

export function generateRandomPassword(): string {
  return uint8ArrayToBase64(generateRandomBytes(KEY_LENGTH));
}

// === Key Derivation (PBKDF2 using react-native-quick-crypto) ===

export function deriveKey(password: string, salt: Uint8Array): Uint8Array {
  const passwordBuffer = Buffer.from(password, 'utf-8');
  const saltBuffer = Buffer.from(salt);
  const result = QuickCrypto.pbkdf2Sync(
    passwordBuffer,
    saltBuffer,
    PBKDF2_ITERATIONS,
    KEY_LENGTH,
    HASH_ALGORITHM
  );
  // Buffer is a Uint8Array subclass; copy into a fresh Uint8Array to satisfy TS/structural types
  const bytes = new Uint8Array(result.length);
  for (let i = 0; i < result.length; i++) {
    bytes[i] = result[i];
  }
  return bytes;
}

// === Hash Generation (SHA-256 using react-native-quick-crypto) ===

export function sha256(data: string | Uint8Array): string {
  const buffer =
    typeof data === 'string'
      ? Buffer.from(data, 'utf-8')
      : Buffer.from(data as unknown as ArrayBuffer);
  // QuickCrypto's Hash.update expects string | ArrayBuffer.
  // Buffer is a Uint8Array subclass, so pass its underlying ArrayBuffer view.
  const ab: ArrayBuffer = buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength
  );
  return QuickCrypto.createHash('sha256').update(ab).digest('hex');
}

// === AES-256-GCM Encryption (using react-native-aes-gcm-crypto) ===

export interface EncryptionResult {
  ciphertext: string; // Base64 encoded
  iv: string; // Hex encoded
  tag: string; // Hex encoded (auth tag)
  salt: string; // Base64 encoded
}

export async function encrypt(
  plaintext: string | Uint8Array,
  password: string,
  salt?: Uint8Array
): Promise<EncryptionResult> {
  const saltBytes = salt || generateSalt();
  const key = deriveKey(password, saltBytes);
  const keyBase64 = uint8ArrayToBase64(new Uint8Array(key));

  const plaintextStr =
    typeof plaintext === 'string'
      ? plaintext
      : uint8ArrayToString(plaintext);

  // Encrypt using AES-256-GCM
  const result = await AesGcmCrypto.encrypt(plaintextStr, false, keyBase64);

  return {
    ciphertext: result.content, // Base64 encoded
    iv: result.iv, // Hex encoded
    tag: result.tag, // Hex encoded
    salt: uint8ArrayToBase64(saltBytes),
  };
}

// === AES-256-GCM Decryption (using react-native-aes-gcm-crypto) ===

export async function decrypt(
  ciphertext: string,
  password: string,
  iv: string,
  tag: string,
  salt: string
): Promise<string> {
  const key = deriveKey(password, base64ToUint8Array(salt));
  const keyBase64 = uint8ArrayToBase64(new Uint8Array(key));

  // Decrypt using AES-256-GCM
  const decrypted = await AesGcmCrypto.decrypt(
    ciphertext, // Base64 encoded ciphertext
    keyBase64, // Base64 encoded key
    iv, // Hex encoded IV
    tag, // Hex encoded auth tag
    false // not binary
  );

  return decrypted;
}

// === Checksum (SHA-256) ===

export function calculateChecksum(data: string | Uint8Array): string {
  return sha256(data);
}

export function verifyChecksum(data: string | Uint8Array, checksum: string): boolean {
  const calculated = calculateChecksum(data);
  return calculated === checksum;
}

// === Password Hashing ===

export function hashPassword(password: string, salt?: Uint8Array): {
  hash: string;
  salt: string;
} {
  const saltBytes = salt || generateSalt();
  const key = deriveKey(password, saltBytes);
  return {
    hash: uint8ArrayToBase64(new Uint8Array(key)),
    salt: uint8ArrayToBase64(saltBytes),
  };
}

// === Secure Storage Helpers ===

export function encodeData(data: unknown): string {
  return Buffer.from(JSON.stringify(data), 'utf-8').toString('base64');
}

export function decodeData<T>(encoded: string): T {
  return JSON.parse(Buffer.from(encoded, 'base64').toString('utf-8'));
}

// === Encryption Info Types ===

export interface EncryptionMetadata {
  algorithm: string;
  salt: string;
  iv: string;
  tag: string;
  keyVersion: number;
}

export function createEncryptionMetadata(
  salt: string,
  iv: string,
  tag: string,
  keyVersion: number = 1
): EncryptionMetadata {
  return {
    algorithm: 'AES-256-GCM',
    salt,
    iv,
    tag,
    keyVersion,
  };
}

// === Full Backup Encryption ===

export interface EncryptedBackup {
  data: string; // Base64 encoded encrypted JSON
  metadata: EncryptionMetadata;
  checksum: string; // Checksum of original plaintext
}

export async function encryptBackup<T>(
  data: T,
  password: string
): Promise<EncryptedBackup> {
  const json = JSON.stringify(data);
  const checksum = calculateChecksum(json);
  const encrypted = await encrypt(json, password);

  return {
    data: encrypted.ciphertext,
    metadata: createEncryptionMetadata(
      encrypted.salt,
      encrypted.iv,
      encrypted.tag
    ),
    checksum,
  };
}

export async function decryptBackup<T>(
  encryptedBackup: EncryptedBackup,
  password: string
): Promise<T> {
  const json = await decrypt(
    encryptedBackup.data,
    password,
    encryptedBackup.metadata.iv,
    encryptedBackup.metadata.tag,
    encryptedBackup.metadata.salt
  );

  // Verify checksum
  if (!verifyChecksum(json, encryptedBackup.checksum)) {
    throw new Error('Checksum verification failed - data may be corrupted');
  }

  return JSON.parse(json) as T;
}
