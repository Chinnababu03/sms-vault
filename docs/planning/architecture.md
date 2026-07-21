# Architecture — SMS Vault (React Native)

---

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        PRESENTATION LAYER                           │
│                                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌───────────┐ │
│  │  Onboarding │  │  Dashboard  │  │   Backup    │  │  Restore  │ │
│  │   Screen    │  │   Screen    │  │   Screen    │  │  Screen   │ │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └─────┬─────┘ │
│         │                │                │                │         │
│  ┌──────┴──────┐  ┌──────┴──────┐  ┌──────┴──────┐  ┌─────┴─────┐ │
│  │   Cloud     │  │   Settings  │  │             │  │           │ │
│  │   Manager   │  │   Screen    │  │             │  │           │ │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └─────┬─────┘ │
└─────────┼────────────────┼────────────────┼────────────────┼─────────┘
          │                │                │                │
          └────────────────┼────────────────┼────────────────┘
                           │                │
┌──────────────────────────┴────────────────┴──────────────────────────┐
│                          STATE LAYER                                  │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                     AppContext (useReducer)                      │ │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐  │ │
│  │  │  state  │ │dispatch │ │ backups │ │ settings│ │ clouds  │  │ │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘  │ │
│  └─────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
          │                │                │                │
          └────────────────┼────────────────┼────────────────┘
                           │                │
┌──────────────────────────┴────────────────┴──────────────────────────┐
│                         SERVICE LAYER                                 │
│                                                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌───────────┐  │
│  │   Backup    │  │  Encryption │  │   Storage   │  │   Cloud   │  │
│  │   Service   │  │   Service   │  │   Service   │  │  Adapter  │  │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └─────┬─────┘  │
└─────────┼────────────────┼────────────────┼────────────────┼─────────┘
          │                │                │                │
          └────────────────┼────────────────┼────────────────┘
                           │                │
┌──────────────────────────┴────────────────┴──────────────────────────┐
│                        NATIVE BRIDGE LAYER                            │
│                                                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌───────────┐  │
│  │   SmsBridge │  │  CallLog    │  │  Restore    │  │ Permission│  │
│  │   Module    │  │  Bridge     │  │  Bridge     │  │  Bridge   │  │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └─────┬─────┘  │
└─────────┼────────────────┼────────────────┼────────────────┼─────────┘
          │                │                │                │
          └────────────────┼────────────────┼────────────────┘
                           │                │
┌──────────────────────────┴────────────────┴──────────────────────────┐
│                       ANDROID NATIVE LAYER                            │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                    ContentResolver                               │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │ │
│  │  │ SMS Provider│  │ MMS Provider│  │CallLog      │            │ │
│  │  │             │  │             │  │Provider     │            │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘            │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                    Android Keystore                              │ │
│  │              (Encryption Key Storage)                            │ │
│  └─────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 2. Data Flow — Backup Operation

```
┌─────────────────────────────────────────────────────────────────────┐
│                        BACKUP FLOW                                   │
└─────────────────────────────────────────────────────────────────────┘

User taps "Back Up Now"
         │
         ▼
┌─────────────────┐
│ DashboardScreen │
│   .startBackup()│
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────────────────────────────────┐
│   AppContext    │────▶│ 1. Check permissions                        │
│  .startBackup() │     │ 2. Initialize backup state                  │
└────────┬────────┘     │ 3. Dispatch progress updates                │
         │              └─────────────────────────────────────────────┘
         ▼
┌─────────────────┐
│  BackupService  │
│ .runBackup()    │
└────────┬────────┘
         │
         ├──────────────────────────────────────────────────────────┐
         │                                                          │
         ▼                                                          ▼
┌─────────────────┐                                        ┌─────────────────┐
│ SmsBridgeModule │                                        │CallLogBridge    │
│   .readSms()    │                                        │  .readCallLogs()│
└────────┬────────┘                                        └────────┬────────┘
         │                                                          │
         ▼                                                          ▼
┌─────────────────┐                                        ┌─────────────────┐
│  SmsMessage[]   │                                        │CallLogEntry[]   │
└────────┬────────┘                                        └────────┬────────┘
         │                                                          │
         └──────────────────────┬───────────────────────────────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │    Serialize to JSON   │
                    │    Calculate Checksum  │
                    └───────────┬───────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │  Encrypt (AES-256-GCM) │
                    │  • Generate salt       │
                    │  • Derive key (PBKDF2) │
                    │  • Encrypt data        │
                    └───────────┬───────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │  Save to Local Storage │
                    │  (RNFS Document Dir)   │
                    └───────────┬───────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │  Upload to Cloud(s)    │
                    │  • Google Drive        │
                    │  • OneDrive            │
                    │  • Dropbox             │
                    └───────────┬───────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │  Save Backup Metadata  │
                    │  (AsyncStorage)        │
                    └───────────┬───────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │   Return Success       │
                    │   Update UI            │
                    └───────────────────────┘
```

---

## 3. Data Flow — Restore Operation

```
┌─────────────────────────────────────────────────────────────────────┐
│                        RESTORE FLOW                                  │
└─────────────────────────────────────────────────────────────────────┘

User selects backup and taps "Restore"
         │
         ▼
┌─────────────────┐
│  RestoreScreen  │
│ .startRestore() │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   AppContext    │
│ .startRestore() │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  BackupService  │
│ .restoreBackup()│
└────────┬────────┘
         │
         ├──────────────────────────────────────────────────────────┐
         │                                                          │
         ▼                                                          ▼
┌─────────────────┐                                        ┌─────────────────┐
│  Load Encrypted │                                        │  Get from Cloud │
│  Local File     │                                        │  if not local   │
└────────┬────────┘                                        └────────┬────────┘
         │                                                          │
         └──────────────────────┬───────────────────────────────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │  Decrypt (AES-256-GCM) │
                    │  • Get salt from file  │
                    │  • Derive key          │
                    │  • Decrypt data        │
                    └───────────┬───────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │  Verify Checksum       │
                    │  (SHA-256)             │
                    └───────────┬───────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │  Deserialize JSON      │
                    │  to typed objects      │
                    └───────────┬───────────┘
                                │
                                ├──────────────────────────────────┐
                                │                                  │
                                ▼                                  ▼
                    ┌───────────────────────┐        ┌───────────────────────┐
                    │  RestoreBridge        │        │  RestoreBridge        │
                    │    .writeSms()        │        │  .writeCallLogs()     │
                    └───────────┬───────────┘        └───────────┬───────────┘
                                │                                  │
                                ▼                                  ▼
                    ┌───────────────────────┐        ┌───────────────────────┐
                    │  SMS Restored         │        │  Call Logs Restored   │
                    │  Count returned       │        │  Count returned       │
                    └───────────┬───────────┘        └───────────┬───────────┘
                                │                                  │
                                └──────────────────────┬───────────┘
                                                       │
                                                       ▼
                                           ┌───────────────────────┐
                                           │   Return Success      │
                                           │   Show completion     │
                                           └───────────────────────┘
```

---

## 4. File Structure

```
sms-vault/
├── android/                          # Android native code
│   └── app/
│       └── src/
│           └── main/
│               ├── AndroidManifest.xml
│               └── java/com/smsvault/
│                   ├── MainActivity.kt
│                   ├── MainApplication.kt
│                   ├── SmsVaultPackage.kt
│                   ├── SmsBridgeModule.kt
│                   ├── CallLogBridgeModule.kt
│                   ├── RestoreBridgeModule.kt
│                   └── PermissionBridgeModule.kt
│
├── src/                              # TypeScript source
│   ├── screens/                      # UI Screens
│   │   ├── OnboardingScreen.tsx      # First-time setup
│   │   ├── DashboardScreen.tsx       # Main dashboard
│   │   ├── BackupScreen.tsx          # Backup creation
│   │   ├── RestoreScreen.tsx         # Backup restoration
│   │   ├── CloudManagerScreen.tsx    # Cloud account management
│   │   └── SettingsScreen.tsx        # App settings
│   │
│   ├── components/                   # Reusable UI components
│   │   ├── BackupCard.tsx           # Backup item display
│   │   ├── CloudCard.tsx            # Cloud provider card
│   │   ├── ProgressOverlay.tsx      # Backup progress
│   │   ├── PermissionCard.tsx       # Permission request
│   │   └── SettingRow.tsx           # Settings toggle
│   │
│   ├── services/                     # Business logic
│   │   ├── AppContext.tsx            # Global state (Context + Reducer)
│   │   ├── backupService.ts         # Backup orchestration
│   │   ├── encryptionService.ts     # AES-256-GCM encryption
│   │   ├── storageService.ts        # AsyncStorage wrapper
│   │   ├── nativeBridge.ts          # Native module interface
│   │   └── cloud/                   # Cloud adapters
│   │       ├── types.ts             # Cloud interface types
│   │       ├── googleDrive.ts       # Google Drive adapter
│   │       ├── oneDrive.ts          # OneDrive adapter
│   │       └── dropbox.ts           # Dropbox adapter
│   │
│   ├── navigation/                   # React Navigation
│   │   └── AppNavigator.tsx         # Stack + Tab navigation
│   │
│   ├── types/                        # TypeScript types
│   │   └── index.ts                 # All type definitions
│   │
│   ├── utils/                        # Utilities
│   │   ├── theme.ts                 # Design system (colors, spacing, typography)
│   │   ├── helpers.ts               # Helper functions
│   │   └── constants.ts             # App constants
│   │
│   └── hooks/                        # Custom React hooks
│       ├── useBackup.ts             # Backup logic hook
│       └── usePermissions.ts        # Permission handling hook
│
├── docs/                             # Documentation
│   └── planning/
│       ├── PRD.md                   # Product Requirements
│       ├── TRD.md                   # Technical Requirements
│       ├── architecture.md          # This file
│       └── implementation-plan.md   # Development phases
│
├── App.tsx                           # Root component
├── index.js                          # Entry point
├── package.json                      # Dependencies
├── tsconfig.json                     # TypeScript config
├── babel.config.js                   # Babel config
├── metro.config.js                   # Metro bundler config
└── app.json                          # App metadata
```

---

## 5. State Management Architecture

```typescript
// === Global State Shape ===

interface AppState {
  // Backup Data
  backups: BackupMetadata[];
  
  // Settings
  settings: AppSettings;
  
  // Cloud State
  cloudAccounts: CloudAccount[];
  
  // UI State
  isBackingUp: boolean;
  isRestoring: boolean;
  backupProgress: BackupProgress | null;
  
  // Error State
  error: AppError | null;
}

// === Actions ===

type AppAction =
  | { type: 'SET_SETTINGS'; payload: AppSettings }
  | { type: 'UPDATE_SETTING'; payload: { key: keyof AppSettings; value: any } }
  | { type: 'SET_BACKUPS'; payload: BackupMetadata[] }
  | { type: 'ADD_BACKUP'; payload: BackupMetadata }
  | { type: 'REMOVE_BACKUP'; payload: string }
  | { type: 'SET_CLOUD_ACCOUNTS'; payload: CloudAccount[] }
  | { type: 'ADD_CLOUD_ACCOUNT'; payload: CloudAccount }
  | { type: 'REMOVE_CLOUD_ACCOUNT'; payload: CloudProvider }
  | { type: 'SET_BACKING_UP'; payload: boolean }
  | { type: 'SET_RESTORING'; payload: boolean }
  | { type: 'SET_BACKUP_PROGRESS'; payload: BackupProgress | null }
  | { type: 'SET_ERROR'; payload: AppError | null }
  | { type: 'CLEAR_ERROR' };
```

---

## 6. Service Layer Design

### 6.1 BackupService

```typescript
class BackupService {
  async runBackup(
    settings: AppSettings,
    onProgress: (step: BackupStep, progress: number, message: string) => void
  ): Promise<BackupMetadata>;
  
  async restoreBackup(
    backupId: string,
    onProgress: (step: string, progress: number, message: string) => void
  ): Promise<{ smsRestored: number; callLogsRestored: number }>;
  
  async deleteBackup(backupId: string): Promise<void>;
  
  async getBackupFile(backupId: string): Promise<BackupPayload>;
}
```

### 6.2 EncryptionService

```typescript
class EncryptionService {
  async generateKey(password: string, salt: Uint8Array): Promise<CryptoKey>;
  
  async encrypt(data: Uint8Array, key: CryptoKey): Promise<{
    ciphertext: Uint8Array;
    iv: Uint8Array;
  }>;
  
  async decrypt(
    ciphertext: Uint8Array,
    key: CryptoKey,
    iv: Uint8Array
  ): Promise<Uint8Array>;
  
  async calculateChecksum(data: Uint8Array): Promise<string>;
  
  generateSalt(): Uint8Array;
  
  generateIV(): Uint8Array;
}
```

### 6.3 CloudAdapter Interface

```typescript
interface CloudAdapter {
  provider: CloudProvider;
  
  authenticate(): Promise<void>;
  
  isAuthenticated(): Promise<boolean>;
  
  getAccountInfo(): Promise<CloudAccount>;
  
  uploadFile(
    filePath: string,
    fileName: string,
    onProgress?: (progress: number) => void
  ): Promise<CloudUploadResult>;
  
  downloadFile(
    fileId: string,
    destPath: string,
    onProgress?: (progress: number) => void
  ): Promise<void>;
  
  listFiles(folder?: string): Promise<CloudFile[]>;
  
  deleteFile(fileId: string): Promise<void>;
  
  disconnect(): Promise<void>;
}
```

---

## 7. Error Handling Strategy

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ERROR HANDLING FLOW                                │
└─────────────────────────────────────────────────────────────────────┘

                    ┌─────────────────────┐
                    │   Error Occurs      │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │  Classify Error     │
                    │  (ErrorType enum)   │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │  Is Recoverable?    │
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              │ Yes                           │ No
              ▼                                ▼
    ┌─────────────────┐              ┌─────────────────┐
    │ Retry Strategy  │              │ Show Error      │
    │ • Exponential   │              │ • User-friendly │
    │   backoff       │              │   message       │
    │ • Max 3 retries │              │ • Suggested     │
    │ • Fallback      │              │   action        │
    └────────┬────────┘              │ • Dismiss/Retry │
             │                       └─────────────────┘
             ▼
    ┌─────────────────┐
    │ Success?        │
    └────────┬────────┘
             │
     ┌───────┼───────┐
     │ Yes           │ No (after retries)
     ▼               ▼
┌─────────┐    ┌─────────────┐
│ Continue│    │ Escalate to │
│ Flow    │    │ User        │
└─────────┘    └─────────────┘
```

---

## 8. Security Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    SECURITY LAYERS                                   │
└─────────────────────────────────────────────────────────────────────┘

Layer 1: Device Security
├── Android Keystore for key storage
├── Biometric authentication (optional)
└── Secure random number generation

Layer 2: Encryption
├── AES-256-GCM for data encryption
├── PBKDF2 for key derivation (100K iterations)
├── Unique salt per backup
├── Random IV per encryption
└── SHA-256 checksums for integrity

Layer 3: Transport Security
├── TLS 1.3 for all network requests
├── Certificate pinning (optional)
└── No sensitive data in logs

Layer 4: Cloud Security
├── Zero-knowledge architecture
├── OAuth 2.0 with PKCE
├── Tokens stored in secure storage
└── Minimal required scopes

Layer 5: Application Security
├── No analytics or tracking
├── No third-party SDKs
├── Open source and auditable
└── Regular security audits
```

---

## 9. Performance Optimization

### 9.1 Backup Optimization
- **Streaming:** Process data in chunks to avoid memory spikes
- **Incremental:** Only backup changed messages since last backup
- **Parallel:** Read SMS and Call Logs concurrently
- **Lazy Loading:** Process large datasets without loading all at once

### 9.2 UI Optimization
- **Memoization:** Use React.memo for list items
- **Virtualized Lists:** FlatList for backup history
- **Animation:** Reanimated for 60fps animations
- **Image Caching:** For cloud provider icons

### 9.3 Storage Optimization
- **Compression:** Optional gzip before encryption
- **Deduplication:** Avoid storing duplicate messages
- **Cleanup:** Auto-delete old local backups

---

## 10. Testing Strategy

### 10.1 Unit Tests
```
├── services/
│   ├── encryptionService.test.ts   (100% coverage target)
│   ├── storageService.test.ts
│   └── backupService.test.ts
├── utils/
│   ├── helpers.test.ts
│   └── theme.test.ts
└── types/
    └── index.test.ts
```

### 10.2 Integration Tests
```
├── screens/
│   ├── DashboardScreen.test.tsx
│   ├── BackupScreen.test.tsx
│   └── RestoreScreen.test.tsx
├── services/
│   ├── AppContext.test.tsx
│   └── nativeBridge.test.ts
└── navigation/
    └── AppNavigator.test.tsx
```

### 10.3 E2E Tests (Detox)
```
├── onboarding.e2e.ts
├── backup.e2e.ts
├── restore.e2e.ts
└── settings.e2e.ts
```

---

*Document Version: 2.0.0*
*Last Updated: July 2026*
*Status: Ready for Development*
