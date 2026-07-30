<div align="center">

<br/>

# 🔐 SMS Vault

### Encrypted Backup, Restore & P2P Transfer for SMS and Call Logs

[![Android](https://img.shields.io/badge/Platform-Android-3DDC84?style=for-the-badge&logo=android&logoColor=white)](https://www.android.com)
[![Kotlin](https://img.shields.io/badge/Kotlin-2.2-7F52FF?style=for-the-badge&logo=kotlin&logoColor=white)](https://kotlinlang.org)
[![Jetpack Compose](https://img.shields.io/badge/Jetpack_Compose-Material_3-4285F4?style=for-the-badge&logo=jetpackcompose&logoColor=white)](https://developer.android.com/jetpack/compose)
[![Min SDK](https://img.shields.io/badge/Min_SDK-26_(Android_8)-orange?style=for-the-badge)](https://developer.android.com/tools/releases/platforms)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

<br/>

**SMS Vault** is a privacy-first Android app that backs up, encrypts, restores, and transfers your SMS messages and call logs — with AES-256-GCM encryption on by default, no ads, and no message content ever touching a server you don't own.

<br/>

</div>

---

## 📋 Table of Contents

- [Features](#-features)
- [Screenshots](#-screenshots)
- [Architecture](#-architecture)
- [Module Structure](#-module-structure)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Local Setup](#-local-setup)
- [API Keys & Secrets](#-api-keys--secrets)
- [Firebase Setup](#-firebase-setup)
- [Build & Run](#-build--run)
- [How It Works](#-how-it-works)
- [Security Model](#-security-model)
- [Permissions Explained](#-permissions-explained)
- [Contributing](#-contributing)

---

## ✨ Features

### 🔒 Backup (Encrypt & Store)
- **One-tap backup** of all SMS, MMS, and call log history from your device
- **AES-256-GCM encryption** using a hardware-backed Android Keystore key — on by default
- **Optional passphrase mode** (PBKDF2 with 210,000 iterations) for cross-device restores without relying on Keystore material
- **Cloud sync** to Google Drive (`appDataFolder` — invisible in standard Drive UI) or local device storage
- **Determinate progress** with live stage updates: `Extracting → Transforming → Encrypting → Uploading`
- **Duplicate-backup guard** — warns if a backup was taken in the last 5 minutes

### 🔄 Restore
- **Full restore** from any saved backup — merges by deduplication, no message overwriting
- Backup integrity validated via **SHA-256 checksum** and GCM authentication tag before decryption
- Corrupted or tampered files detected and surfaced with a clear error, not a raw crypto exception

### 📅 Scheduled Auto-Backup
- Set **Daily / Weekly / Monthly** automatic backups via WorkManager `PeriodicWorkRequest`
- Configurable constraints: **require charging**, **require Wi-Fi (unmetered network)**
- Uses `ExistingPeriodicWorkPolicy.UPDATE` — changing a schedule replaces the old job without duplicates
- Progress survives app death and is resumed on relaunch

### 📡 P2P Device Transfer
- Scan for nearby SMS Vault devices over **Wi-Fi Direct / local socket**
- Transfer encrypted vault directly device-to-device — no cloud round-trip, no internet required
- QR-code based pairing UI for easy device discovery

### 🗂️ Vault Explorer
- Browse all saved backups across Local and Google Drive
- See backup date, item count, file size, and encryption status for each archive
- Delete individual backups from cloud or local storage

### ⚙️ Settings & Security
- Toggle **AES-256-GCM encryption** per backup (on by default)
- Switch between **Cyber-Purple Dark** and **Emerald Green Light** themes
- Configure automation constraints (charging-only, Wi-Fi-only)
- Manage **cloud storage integrations** (Google Drive, with Dropbox and OneDrive on the roadmap)
- Sign in / Sign out via **Google Sign-In (Credential Manager)** or email/password (Firebase Auth)

### 🔑 Authentication
- **Google Sign-In** via `androidx.credentials` (Credential Manager API — replaces legacy Google Sign-In client)
- **Email + Password** sign-up / sign-in backed by Firebase Authentication
- **Guest mode** — continue without an account (local-only backups)
- Firebase Auth session syncs backup *metadata only* (not message content) to Firestore for cross-device visibility

---

## 📐 Architecture

SMS Vault follows **Clean Architecture** with strict unidirectional data flow:

```
┌─────────────────────────────────────────────────────────┐
│                    :app  (Hilt DI root)                  │
├──────────────────────────────────────────────────────────┤
│  :feature:*  (Compose screens + ViewModels)              │
│    → depends on :core:domain + :core:ui only             │
├──────────────────────────────────────────────────────────┤
│  :core:domain  (UseCases, Repository interfaces, Models) │
│    → zero Android SDK deps — pure JVM unit-testable      │
├──────────────────────────────────────────────────────────┤
│  :core:data         :core:telephony   :core:cloud-storage │
│  :core:crypto       :core:workmanager :core:ui            │
│    → implement domain interfaces, no feature deps         │
└──────────────────────────────────────────────────────────┘
```

**Data flow:**
```
Compose Screen ──▶ ViewModel ──▶ UseCase ──▶ Repository (interface)
                                                    │
     StateFlow ◀──────────────────────────  RepositoryImpl
                                            (Room / DataStore /
                                             CloudStorageProvider /
                                             TelephonyReader)
```

---

## 📦 Module Structure

```
sms-vault/
├── app/                         # Application entry point, Hilt DI, NavHost
│
├── feature/
│   ├── onboarding/              # Auth screen (Sign In / Sign Up / Google)
│   ├── dashboard/               # Home: stats, quick actions, schedule banner
│   ├── backup/                  # Backup flow with live WorkManager progress
│   ├── restore/                 # Restore flow with backup selector
│   ├── vault/                   # Vault Explorer — browse & delete backups
│   ├── transfer/                # P2P device-to-device transfer
│   └── settings/                # Theme, encryption, cloud integrations, schedule
│
├── core/
│   ├── domain/                  # Models, repository interfaces, use cases (no Android deps)
│   ├── data/                    # Room DB, DataStore, Firestore sync, repository impls
│   ├── telephony/               # ContentResolver queries for SMS/MMS/CallLog
│   ├── crypto/                  # AES-256-GCM CryptoEngine, AndroidKeyStore key management
│   ├── cloud-storage/           # CloudStorageProvider interface + GoogleDrive/Local impls
│   ├── workmanager/             # BackupCoordinator + ExtractWorker, TransformWorker,
│   │                            #   EncryptWorker, UploadWorker (chained pipeline)
│   └── ui/                      # Design system: GlassCard, VaultButton, StatusSeal,
│                                #   VaultLogo, VaultTextField, SmsVaultTheme
│
├── gradle/
│   └── libs.versions.toml       # Version catalog for all dependencies
├── build.gradle.kts             # Root build config
└── settings.gradle.kts          # Module declarations
```

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Language** | Kotlin 2.2 |
| **UI** | Jetpack Compose + Material 3 |
| **Navigation** | Navigation-Compose |
| **DI** | Hilt 2.55 |
| **Async** | Kotlin Coroutines + Flow |
| **Local DB** | Room 2.7 |
| **Preferences** | Jetpack DataStore |
| **Background Work** | WorkManager 2.10 |
| **Authentication** | Credential Manager (`androidx.credentials`) + Firebase Auth |
| **Cloud Sync (metadata)** | Firebase Firestore |
| **Cloud Storage** | Google Drive API v3 (`drive.appdata` scope) |
| **Encryption** | AES-256-GCM via Android Keystore + PBKDF2 passphrase mode |
| **Serialization** | kotlinx.serialization |
| **Secure Token Storage** | EncryptedSharedPreferences |
| **Build** | AGP 9.1.1, Gradle with Version Catalogs |
| **Testing** | JUnit 4/5, Turbine (Flow), MockK, Robolectric, Roborazzi |

---

## 📋 Prerequisites

| Tool | Version | Notes |
|---|---|---|
| **Android Studio** | Hedgehog (2023.1.1)+ | [Download](https://developer.android.com/studio) |
| **JDK** | 11+ | Bundled with Android Studio |
| **Android SDK** | API 26–36 | Install via SDK Manager |
| **Git** | Any | For cloning |
| **Google Account** | — | Required for Firebase + Google Drive integration |
| **Firebase Project** | — | See [Firebase Setup](#-firebase-setup) |

---

## 🚀 Local Setup

### 1. Clone the Repository

```bash
git clone git@github.com:Chinnababu03/sms-vault.git
cd sms-vault
git checkout phase1   # all source code lives here
```

### 2. Open in Android Studio

1. Launch **Android Studio**
2. Select **File → Open** and navigate to the `sms-vault/` folder
3. Wait for Gradle sync to complete (first sync downloads dependencies — may take a few minutes)

### 3. Configure API Keys

Copy `.env.example` to `.env` in the **project root** (not `app/`):

```bash
cp .env.example .env
```

Then fill in your values in `.env`:

```env
# Google Web Client ID (from Firebase Console → Authentication → Sign-in method → Google)
GOOGLE_WEB_CLIENT_ID=your-web-client-id.apps.googleusercontent.com

# Dropbox API App Key (V1.1 feature — leave placeholder for now)
DROPBOX_APP_KEY=YOUR_DROPBOX_APP_KEY

# OneDrive Client ID (V1.1 feature — leave placeholder for now)
ONEDRIVE_CLIENT_ID=YOUR_ONEDRIVE_CLIENT_ID
```

> **How it works:** The project uses the [Secrets Gradle Plugin](https://github.com/google/secrets-gradle-plugin) which reads `.env` and injects values as `BuildConfig` fields and manifest placeholders at compile time. **Never commit `.env` to version control.**

### 4. Add `google-services.json`

Place your Firebase `google-services.json` inside `app/`:

```
sms-vault/
└── app/
    └── google-services.json   ← here
```

See [Firebase Setup](#-firebase-setup) for how to generate this file.

### 5. Build & Run

```bash
# Debug build
./gradlew assembleDebug

# Or run directly on a connected device / emulator
./gradlew installDebug
```

Or use the **Run** button in Android Studio.

---

## 🔑 API Keys & Secrets

| Secret | Where to get it | Required for |
|---|---|---|
| `GOOGLE_WEB_CLIENT_ID` | Firebase Console → Authentication → Google sign-in → Web client ID | Google Sign-In + Google Drive auth |
| `google-services.json` | Firebase Console → Project Settings → Your Android app | Firebase Auth + Firestore |
| `DROPBOX_APP_KEY` | [Dropbox Developer Console](https://www.dropbox.com/developers) | Dropbox backup (V1.1) |
| `ONEDRIVE_CLIENT_ID` | [Azure Portal → App Registrations](https://portal.azure.com) | OneDrive backup (V1.1) |

---

## 🔥 Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com) and create a new project (or use an existing one).

2. **Add an Android app:**
   - Package name: `com.smsvault`
   - Download `google-services.json` and place it in `app/`

3. **Enable Authentication:**
   - Go to **Authentication → Sign-in method**
   - Enable **Google** (note the Web client ID — this is your `GOOGLE_WEB_CLIENT_ID`)
   - Enable **Email/Password**

4. **Enable Firestore:**
   - Go to **Firestore Database → Create database**
   - Start in **test mode** for development, then apply production rules before release

5. **Enable App Check (optional but recommended):**
   - Go to **App Check** and register your app with reCAPTCHA
   - The app already includes `firebase-appcheck-recaptcha` in its dependencies

6. **Firestore Security Rules (production):**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

> **Note:** Firestore stores **backup metadata only** (file name, size, item count, timestamp). Message bodies and call content are **never** uploaded to Firestore. Encrypted payloads go directly to the cloud storage provider the user authorizes (e.g., Google Drive `appDataFolder`).

---

## 🏗 Build & Run

### Debug Build (recommended for development)

```bash
./gradlew assembleDebug
./gradlew installDebug
```

### Release Build

Set the following environment variables (or create a `my-upload-key.jks` in the project root):

```bash
export KEYSTORE_PATH=/path/to/your/keystore.jks
export STORE_PASSWORD=your_store_password
export KEY_PASSWORD=your_key_password

./gradlew assembleRelease
```

### Run Unit Tests

```bash
./gradlew test
```

### Run Instrumented Tests (requires connected device or emulator)

```bash
./gradlew connectedAndroidTest
```

### Screenshot Tests (Roborazzi)

```bash
./gradlew verifyRoborazziDebug     # verify against saved baselines
./gradlew recordRoborazziDebug     # update baseline screenshots
```

---

## ⚙️ How It Works

### Backup Pipeline

When you tap **Back Up Now**, SMS Vault enqueues a chained WorkManager pipeline:

```
ExtractWorker
    Reads SMS, MMS, Call Log from ContentResolver (paginated)
    └▶ TransformWorker
          Serializes to XML/JSON with versioned header + SHA-256 checksum
          └▶ EncryptWorker
                AES-256-GCM encrypt using AndroidKeyStore key (SVLT frame format)
                └▶ UploadWorker
                      Upload encrypted .enc file to Google Drive appDataFolder or local storage
```

Each stage publishes real-time progress via `WorkInfo` which the active backup screen observes through a `StateFlow`.

**SVLT Encrypted File Format:**
```
[ 4 bytes  ] Magic: "SVLT"
[ 1 byte   ] Format version (1 = Keystore, 2 = Passphrase)
[ 12 bytes ] GCM nonce/IV
[ N bytes  ] AES-256-GCM ciphertext (header JSON + backup body)
[ 16 bytes ] GCM authentication tag
```

### SMS Role Lifecycle

To read **and write** SMS (required for restore), the app temporarily becomes the default SMS handler:

1. **Priming screen** explains the role request clearly before the OS dialog fires
2. **RoleManager** requests `ROLE_SMS` — only if the user explicitly accepts
3. **Extract/Restore window** — ContentResolver reads (backup) or inserts (restore) run while role is held
4. **Immediate relinquishment** — the moment the pipeline finishes (success, failure, or cancel), the app prompts the user to restore their previous SMS app. This is non-negotiable per Google Play policy.

### Data Flow (Dashboard)

```
TelephonyReader.getSmsCount()  ──▶ DashboardViewModel ──▶ DashboardUiState
BackupRepository.observeAll()  ──▶       (StateFlow)  ──▶ DashboardScreen
ScheduleRepository.observe()   ──▶
AuthRepository.observeAuth()   ──▶
```

---

## 🛡️ Security Model

| Concern | Implementation |
|---|---|
| **Payload encryption** | AES-256-GCM, key generated in Android Keystore (hardware-backed on supported devices) |
| **Passphrase mode** | PBKDF2WithHmacSHA256, 210,000 iterations, 16-byte random salt — cross-device portable |
| **Token storage** | OAuth tokens stored in `EncryptedSharedPreferences` (Keystore-backed master key), never in plain DataStore or Room |
| **GCM integrity** | Tampering or truncation fails the 128-bit GCM authentication tag check with a clear user message |
| **Message content** | Never transmitted to any SMS Vault server. Goes only to the cloud storage the user explicitly authorizes |
| **Firestore data** | Metadata only (filename, count, size, checksum, timestamp) — no message bodies or phone numbers |
| **Logs** | Counts and durations only — message bodies and phone numbers are never written to logs |

---

## 🔒 Permissions Explained

SMS Vault declares the following permissions. All are justified by core backup/restore functionality:

| Permission | Why it's needed |
|---|---|
| `READ_SMS` / `RECEIVE_SMS` | Read SMS messages for backup |
| `READ_CALL_LOG` | Read call history for backup |
| `SEND_SMS` / `RECEIVE_MMS` | Required to qualify as a default SMS handler (needed for restore write access) |
| `BROADCAST_SMS` / `BROADCAST_WAP_PUSH` | Required manifest components for `ROLE_SMS` eligibility |
| `SEND_RESPOND_VIA_MESSAGE` | Required manifest component for `ROLE_SMS` eligibility |
| `ACCESS_WIFI_STATE` / `CHANGE_WIFI_STATE` | P2P device-to-device transfer via Wi-Fi Direct |
| `ACCESS_FINE_LOCATION` | Required by Android 8+ for Wi-Fi Direct peer discovery |
| `INTERNET` | Cloud sync to Google Drive / Firebase |
| `FOREGROUND_SERVICE` | Long-running backup/restore operations |
| `RECEIVE_BOOT_COMPLETED` | Re-schedule periodic backups after device reboot |

> Per Google Play policy, `READ_SMS` and `READ_CALL_LOG` are restricted to apps that are actively registered as the default SMS handler. SMS Vault holds the role **only while a backup or restore is in progress**, then immediately relinquishes it.

---

## 🗺 Roadmap

| Phase | Scope | Status |
|---|---|---|
| **Phase 1–4** | Project skeleton, navigation, DB, telephony extraction | ✅ Complete |
| **Phase 5** | Transform, encryption, Local + Google Drive backup/restore | ✅ Complete |
| **Phase 6** | WorkManager scheduling, progress publishing | ✅ Complete |
| **Phase 7** | Dropbox & OneDrive providers, P2P Transfer, biometric lock | 🚧 In Progress |
| **Phase 8** | Release hardening, Play Store compliance, privacy policy | 📋 Planned |
| **V2** | Delta backups, Wear OS companion, home screen widget, message search | 💡 Candidate |

---

## 🤝 Contributing

1. Fork the repository
2. Checkout `phase1` — all active development happens here
3. Create a feature branch: `git checkout -b feature/your-feature`
4. Follow the existing module structure — features go in `:feature:*`, shared logic in `:core:*`
5. Write tests for any new use cases or repository methods
6. Open a Pull Request against `phase1`

> **Branch convention:**
> - `main` — documentation only (this branch)
> - `phase1` — active development branch with full codebase

---

## 📄 License

```
MIT License

Copyright (c) 2026 Chinnababu03

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

---

<div align="center">

Built with ❤️ using Kotlin + Jetpack Compose · Privacy by default · No ads · No server-side message storage

</div>
