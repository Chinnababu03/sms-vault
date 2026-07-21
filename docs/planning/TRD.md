# Technical Requirements Document (TRD)
# SMS Vault — Technical Specifications

---

## 1. Technology Stack

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| Framework | React Native | 0.76+ | Cross-platform app framework |
| Language | TypeScript | 5.x | Type-safe JavaScript |
| Navigation | React Navigation | 7.x | Screen routing |
| State | React Context + useReducer | - | Global state management |
| Storage | @react-native-async-storage | 2.x | Settings persistence |
| File System | react-native-fs | 2.x | File I/O for backups |
| Encryption | react-native-quick-crypto | 0.7+ | AES-256-GCM encryption |
| InAppBrowser | react-native-inappbrowser-reborn | 3.x | OAuth flows |
| SafeArea | react-native-safe-area-context | 5.x | Device safe areas |
| Gestures | react-native-gesture-handler | 2.x | Swipe, pull-to-refresh |
| Reanimated | react-native-reanimated | 3.x | Animations |
| Linear Gradient | react-native-linear-gradient | 2.x | UI gradients |
| Icons | react-native-vector-icons | 10.x | Icons |

---

## 2. Native Bridge API Specifications

### 2.1 SmsBridgeModule

```kotlin
@ReactMethod
fun readSms(sinceTimestamp: Double, promise: Promise) {
    // Queries Telephony.Sms.CONTENT_URI
    // Returns JSON array of SmsMessage objects
    // Permissions: READ_SMS
}

@ReactMethod
fun readMms(sinceTimestamp: Double, promise: Promise) {
    // Queries Telephony.Mms.CONTENT_URI
    // Returns JSON array of MmsMessage objects
    // Permissions: READ_SMS
}

@ReactMethod
fun getSmsCount(promise: Promise) {
    // Returns total SMS count as integer
}

@ReactMethod
fun getMmsCount(promise: Promise) {
    // Returns total MMS count as integer
}
```

### 2.2 CallLogBridgeModule

```kotlin
@ReactMethod
fun readCallLogs(sinceTimestamp: Double, promise: Promise) {
    // Queries CallLog.Calls.CONTENT_URI
    // Returns JSON array of CallLogEntry objects
    // Permissions: READ_CALL_LOG
}

@ReactMethod
fun getCallLogCount(promise: Promise) {
    // Returns total call log count as integer
}
```

### 2.3 RestoreBridgeModule

```kotlin
@ReactMethod
fun writeSms(messagesJson: String, promise: Promise) {
    // Inserts messages into Telephony.Sms.Inbox/Sent
    // Requires app to be default SMS handler
    // Returns count of inserted messages
}

@ReactMethod
fun writeCallLogs(entriesJson: String, promise: Promise) {
    // Inserts entries via ContentResolver
    // Returns count of inserted entries
}

@ReactMethod
fun isDefaultSmsApp(promise: Promise) {
    // Returns boolean indicating if app is default SMS handler
}

@ReactMethod
fun requestDefaultSmsApp(promise: Promise) {
    // Opens system settings to set as default SMS app
}
```

### 2.4 PermissionBridgeModule

```kotlin
@ReactMethod
fun hasSmsPermission(promise: Promise) {
    // Returns boolean
}

@ReactMethod
fun requestSmsPermission(promise: Promise) {
    // Requests READ_SMS permission
    // Returns boolean (granted/not granted)
}

@ReactMethod
fun hasCallLogPermission(promise: Promise) {
    // Returns boolean
}

@ReactMethod
fun requestCallLogPermission(promise: Promise) {
    // Requests READ_CALL_LOG permission
    // Returns boolean (granted/not granted)
}

@ReactMethod
fun hasWriteSmsPermission(promise: Promise) {
    // Returns boolean
}

@ReactMethod
fun requestWriteSmsPermission(promise: Promise) {
    // Requests WRITE_SMS permission
    // Returns boolean (granted/not granted)
}

@ReactMethod
fun getDeviceInfo(promise: Promise) {
    // Returns JSON with manufacturer, model, sdk version
}
```

---

## 3. Data Models (TypeScript)

```typescript
// === Message Types ===

interface SmsMessage {
  id: number;
  address: string;        // Phone number
  body: string;           // Message content
  date: number;           // Timestamp in milliseconds
  dateSent: number;       // When message was sent
  type: number;           // 1=inbox, 2=sent, 3=draft, 4=outbox
  read: number;           // 0=unread, 1=read
  threadId: number;       // Conversation thread ID
}

interface MmsMessage {
  id: number;
  subject: string;
  body: string;
  date: number;
  type: number;
  read: number;
  threadId: number;
}

interface CallLogEntry {
  id: number;
  number: string | null;
  name: string | null;    // Contact name if available
  type: number;           // 1=incoming, 2=outgoing, 3=missed
  duration: number;       // Duration in seconds
  date: number;           // Timestamp in milliseconds
}

// === Backup Types ===

interface BackupPayload {
  version: string;                    // "2.0.0"
  backupDate: number;                 // Timestamp
  deviceId: string;                   // Unique device identifier
  deviceInfo: {
    manufacturer: string;
    model: string;
    osVersion: string;
    appVersion: string;
  };
  statistics: {
    totalSms: number;
    totalMms: number;
    totalCallLogs: number;
  };
  encryption: {
    algorithm: string;                // "AES-256-GCM"
    salt: string;                     // Base64 encoded
    iv: string;                       // Base64 encoded
    keyVersion: number;               // For key rotation
  } | null;
  checksum: string;                   // SHA-256 of plaintext data
  messages: {
    sms: SmsMessage[];
    mms: MmsMessage[];
    callLogs: CallLogEntry[];
  };
}

interface BackupMetadata {
  id: string;                         // UUID
  date: number;                       // Creation timestamp
  totalSms: number;
  totalMms: number;
  totalCallLogs: number;
  sizeBytes: number;
  isEncrypted: boolean;
  isComplete: boolean;
  cloudProviders: CloudProvider[];
  checksum: string;
  errorMessage?: string;
}

interface BackupProgress {
  step: BackupStep;
  progress: number;                   // 0-1
  message: string;
  currentCount?: number;
  totalCount?: number;
  bytesProcessed?: number;
  totalBytes?: number;
}

type BackupStep = 
  | 'initializing'
  | 'reading_sms'
  | 'reading_mms'
  | 'reading_calllogs'
  | 'serializing'
  | 'encrypting'
  | 'saving_local'
  | 'uploading'
  | 'complete'
  | 'error';

// === Cloud Types ===

type CloudProvider = 'google_drive' | 'onedrive' | 'dropbox';

interface CloudAccount {
  provider: CloudProvider;
  isConnected: boolean;
  email?: string;
  storageUsed?: number;
  storageTotal?: number;
  lastSyncDate?: number;
  accessToken?: string;               // Never stored in plaintext
}

interface CloudFile {
  id: string;
  name: string;
  size: number;
  lastModified: number;
  mimeType: string;
  downloadUrl?: string;
}

interface CloudUploadResult {
  success: boolean;
  fileId?: string;
  fileName?: string;
  error?: string;
}

// === Settings Types ===

interface AppSettings {
  // Backup Settings
  backupSms: boolean;
  backupMms: boolean;
  backupCallLogs: boolean;
  encryptBackups: boolean;
  incrementalMode: boolean;
  
  // Schedule Settings
  scheduledBackup: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  scheduledHour: number;
  scheduledMinute: number;
  
  // Network Settings
  wifiOnly: boolean;
  chargingOnly: boolean;
  
  // Storage Settings
  autoDeleteOldBackups: boolean;
  keepBackupsCount: number;
  
  // Cloud Settings
  selectedClouds: CloudProvider[];
  
  // App Settings
  onboardingComplete: boolean;
  theme: 'system' | 'light' | 'dark';
  language: string;
  
  // Security Settings
  biometricLock: boolean;
  hideNotificationContent: boolean;
}

// === Device Info ===

interface DeviceInfo {
  manufacturer: string;
  model: string;
  osVersion: string;
  appVersion: string;
  sdkVersion: number;
  uniqueId: string;                    // Generated on first launch
}
```

---

## 4. Permissions Required

| Permission | Android | API Level | Purpose | Critical |
|-----------|---------|-----------|---------|----------|
| READ_SMS | ✅ | 1+ | Read SMS messages | Yes |
| READ_MMS | ✅ | 1+ | Read MMS messages | Yes |
| READ_CALL_LOG | ✅ | 1+ | Read call history | Yes |
| WRITE_SMS | ✅ | 1+ | Restore SMS messages | Yes |
| INTERNET | ✅ | 1+ | Cloud upload/download | Yes |
| POST_NOTIFICATIONS | ✅ | 33+ | Backup notifications | No |
| RECEIVE_BOOT_COMPLETED | ✅ | 1+ | Scheduled backups | No |
| WAKE_LOCK | ✅ | 1+ | Keep device awake during backup | No |
| ACCESS_NETWORK_STATE | ✅ | 1+ | Check network connectivity | No |

---

## 5. Backup File Format (v2.0)

```json
{
  "version": "2.0.0",
  "backupDate": 1752000000000,
  "deviceId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "deviceInfo": {
    "manufacturer": "Google",
    "model": "Pixel 9",
    "osVersion": "15",
    "appVersion": "2.0.0"
  },
  "statistics": {
    "totalSms": 15234,
    "totalMms": 456,
    "totalCallLogs": 3451
  },
  "encryption": {
    "algorithm": "AES-256-GCM",
    "salt": "base64_encoded_salt_32_bytes",
    "iv": "base64_encoded_iv_12_bytes",
    "keyVersion": 1
  },
  "checksum": "sha256_of_plaintext_data",
  "messages": {
    "sms": [],
    "mms": [],
    "callLogs": []
  }
}
```

---

## 6. Cloud Integration Specifications

### 6.1 Google Drive

| Aspect | Specification |
|--------|---------------|
| API | Google Drive API v3 |
| Auth | OAuth 2.0 with PKCE |
| Scopes | `drive.file` |
| Folder | `/SMS Vault Backups/` |
| Upload | Resumable upload for large files |
| Download | Direct download with progress |

### 6.2 OneDrive

| Aspect | Specification |
|--------|---------------|
| API | Microsoft Graph API |
| Auth | OAuth 2.0 with PKCE |
| Scopes | `files.readwrite` |
| Folder | `/SMS Vault Backups/` |
| Upload | Upload with conflict handling |
| Download | Direct download |

### 6.3 Dropbox

| Aspect | Specification |
|--------|---------------|
| API | Dropbox API v2 |
| Auth | OAuth 2.0 with PKCE |
| Scopes | `files.content.write`, `files.content.read` |
| Folder | `/SMS Vault Backups/` |
| Upload | Upload with overwrite |
| Download | Direct download |

---

## 7. Encryption Implementation

### 7.1 Key Derivation

```typescript
// PBKDF2 parameters
const PBKDF2_ITERATIONS = 100000;
const SALT_LENGTH = 16;      // bytes
const IV_LENGTH = 12;        // bytes (for GCM)
const KEY_LENGTH = 32;       // bytes (256 bits)

// Key derivation function
async function deriveKey(
  password: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}
```

### 7.2 Encryption/Decryption

```typescript
async function encrypt(
  data: Uint8Array,
  key: CryptoKey
): Promise<{ ciphertext: Uint8Array; iv: Uint8Array }> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );
  return {
    ciphertext: new Uint8Array(ciphertext),
    iv
  };
}

async function decrypt(
  ciphertext: Uint8Array,
  key: CryptoKey,
  iv: Uint8Array
): Promise<Uint8Array> {
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  );
  return new Uint8Array(plaintext);
}
```

---

## 8. Error Handling

### 8.1 Error Types

```typescript
enum ErrorType {
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  STORAGE_ERROR = 'STORAGE_ERROR',
  ENCRYPTION_ERROR = 'ENCRYPTION_ERROR',
  CLOUD_AUTH_ERROR = 'CLOUD_AUTH_ERROR',
  CLOUD_UPLOAD_ERROR = 'CLOUD_UPLOAD_ERROR',
  CLOUD_DOWNLOAD_ERROR = 'CLOUD_DOWNLOAD_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  DEVICE_NOT_SUPPORTED = 'DEVICE_NOT_SUPPORTED',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

interface AppError {
  type: ErrorType;
  message: string;
  details?: any;
  recoverable: boolean;
  suggestedAction?: string;
}
```

### 8.2 Recovery Strategies

| Error Type | Recovery Strategy |
|-----------|-------------------|
| PERMISSION_DENIED | Prompt user with explanation |
| STORAGE_ERROR | Retry with exponential backoff |
| ENCRYPTION_ERROR | Log and report, suggest re-encrypt |
| CLOUD_AUTH_ERROR | Re-authenticate with provider |
| CLOUD_UPLOAD_ERROR | Retry with exponential backoff |
| NETWORK_ERROR | Queue for later, notify user |
| UNKNOWN_ERROR | Log full stack trace, report |

---

## 9. Testing Requirements

### 9.1 Unit Tests
- Encryption/decryption functions
- Data serialization/deserialization
- State management reducers
- Utility functions

### 9.2 Integration Tests
- Native bridge calls
- Cloud API interactions
- Backup/restore workflow
- Permission handling

### 9.3 E2E Tests
- Complete backup flow
- Complete restore flow
- Onboarding flow
- Error scenarios

---

## 10. Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| App Launch | <2s | Cold start to dashboard |
| Backup 1K SMS | <5s | Start to completion |
| Backup 10K SMS | <30s | Start to completion |
| Restore 1K SMS | <5s | Start to completion |
| Cloud Upload 10MB | <10s | On WiFi |
| Memory Usage | <100MB | During backup |
| Battery Impact | <5% | Per backup operation |

---

*Document Version: 2.0.0*
*Last Updated: July 2026*
*Status: Ready for Development*
