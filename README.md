# 🛡️ SMS Vault — Privacy-First SMS & Call Log Vault

<div align="center">

![Android](https://img.shields.io/badge/Platform-Android%2014%2F15%20(API%2026%2B)-3DDC84?style=for-the-badge&logo=android&logoColor=white)
![Kotlin](https://img.shields.io/badge/Kotlin-2.2.10-7F52FF?style=for-the-badge&logo=kotlin&logoColor=white)
![Jetpack Compose](https://img.shields.io/badge/UI-Jetpack%20Compose%20%26%20Material%203-4285F4?style=for-the-badge&logo=jetpackcompose&logoColor=white)
![Security](https://img.shields.io/badge/Crypto-AES--256--GCM-critical?style=for-the-badge&logo=shield)
![Cloud](https://img.shields.io/badge/Cloud-Google%20Drive%20v3-F4B400?style=for-the-badge&logo=googledrive&logoColor=white)

**A secure, local-first, zero-knowledge Android backup & vault application for SMS messages and Call Logs with direct Google Drive integration, hardware-backed AES-256-GCM encryption, and standard XML restoration.**

</div>

---

## 🌟 Key Features

* 🔐 **Zero-Knowledge Encryption**: Full payload encryption using **AES-256-GCM** with 12-byte random IVs and PBKDF2 (100,000 rounds) key derivation. Tokens are protected in Android Keystore-backed `EncryptedSharedPreferences`.
* 📄 **Dual-Format Backups**:
  * **Encrypted `.svlt`**: Binary envelope containing encrypted JSON payload + SHA-256 integrity checksum.
  * **Standard `.xml`**: 100% compatible with the industry-standard *SMS Backup & Restore* XML format.
* ☁️ **Seamless Google Drive Integration**: Uses modern `Identity.getAuthorizationClient()` with `drive.file` scope to automatically create and stream files directly to the visible `sms_vault_backup` folder in your Google Drive.
* ⚙️ **4-Stage WorkManager Pipeline**: Background execution chained across 4 resilient workers:
  $$\text{ExtractWorker} \longrightarrow \text{TransformWorker} \longrightarrow \text{EncryptWorker} \longrightarrow \text{UploadWorker}$$
* 🔄 **Smart Telephony Restorer**: Full batch restoration pipeline using Android's `RoleManager.ROLE_SMS` lifecycle with automatic prompt to switch back to your default SMS app after completion.
* 🛡️ **Session-Aware Duplicate Prevention**: Smart duplicate warning resets on account switch, ensuring you are never blocked when switching users.
* 🎨 **Obsidian Glassmorphic UI**: Premium dark aesthetic with 6 curated design styles, breathing halo glow effects, and spring physics micro-animations.

---

## 🏗️ Architecture Overview

The app follows strict **Clean Architecture & Modular Design**:

```
sms-vault/
├── app/                        # Main Application, NavHost, AppContainer, Assets
├── core/
│   ├── domain/                 # Models (BackupRecord, BackupSpec, AuthUser), Repository interfaces
│   ├── data/                   # Room DB (smsvault.db), DAOs, Entities, DataStore Preferences
│   ├── telephony/              # ContentResolver SMS/Call queries, Batch Restorer, RoleManager
│   ├── crypto/                 # AES-256-GCM, PBKDF2 Key Derivation, CryptoEngine
│   ├── cloud-storage/          # CloudStorageProvider, GoogleDriveProvider, LocalStorageProvider
│   ├── workmanager/            # 4-stage chained workers: Extract, Transform, Encrypt, Upload
│   └── ui/                     # Design tokens, GlassCard, VaultButton, VaultLogo, Themes
└── feature/
    ├── onboarding/             # Email/Google Auth & 3-Slide Permission Priming
    ├── dashboard/              # Telephony stats, Live Backup trigger, Schedule config
    ├── backup/                 # Live progress observer & ActiveOperationScreen
    ├── restore/                # Multi-stage restore workflow & Default SMS role prompt
    ├── vault/                  # Filterable backup catalog & inspection
    ├── transfer/               # Nearby Share / P2P direct transfer
    └── settings/               # Dark theme, Encryption toggle, Cloud storage management
```

---

## 🛠️ Step-by-Step Manual Setup & Installation

If you are cloning this repository for the first time or setting it up on a new workstation, follow these steps to configure Google Cloud Console, OAuth credentials, and environment files.

### 📋 Prerequisites
* **Android Studio**: Ladybug / Koala Feature Drop or newer
* **JDK**: Version 17 or 21
* **Android SDK**: API Level 36 (Android 15+ compatible, minimum SDK 26)
* **Gradle Wrapper**: Gradle 9.6.1 (included)

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/Chinnababu03/sms-vault.git
cd sms-vault
```

---

### Step 2: Keystore & SHA-1 Fingerprint Configuration

The app's debug build is signed with `debug.keystore`.

1. If you don't have `debug.keystore` in the root folder, copy it from your system default:
   * **Windows**: `copy $env:USERPROFILE\.android\debug.keystore .\debug.keystore`
   * **macOS/Linux**: `cp ~/.android/debug.keystore ./debug.keystore`

2. Extract the **SHA-1 Fingerprint** of your keystore:
   ```bash
   keytool -list -v -keystore ./debug.keystore -alias androiddebugkey -storepass android
   ```
   *Note the SHA-1 output (e.g. `AA:BB:CC:11:22:33:44:55:66:77:88:99:00:11:22:33:44:55:66:77`).*

---

### Step 3: Google Cloud Console Setup (Critical for Drive OAuth)

1. Open **[Google Cloud Console](https://console.cloud.google.com)**.
2. Select or create a project (e.g. `sms-vault`).
3. **Enable APIs**:
   * Go to **APIs & Services > Library**.
   * Search for **Google Drive API** and click **Enable**.
4. **Configure OAuth Consent Screen**:
   * Go to **APIs & Services > OAuth consent screen**.
   * User Type: **External**.
   * App name: `SMS Vault`, User support email: `your-email@example.com`.
   * **Scopes**: Click **Add or Remove Scopes** and add:
     * `.../auth/drive.file` *(View and manage Google Drive files created by this app)*.
   * **Test Users**: Add the Gmail accounts you will use for testing.
5. **Create Android OAuth 2.0 Client ID**:
   * Go to **APIs & Services > Credentials > Create Credentials > OAuth client ID**.
   * Application type: **Android**.
   * Package name: `com.smsvault`.
   * SHA-1 certificate fingerprint: Paste the SHA-1 from Step 2 (`AA:BB:CC:11:22:33:44:55:66:77:88:99:00:11:22:33:44:55:66:77`).
6. **Create Web Application OAuth Client ID**:
   * Click **Create Credentials > OAuth client ID**.
   * Application type: **Web application**.
   * Name: `SMS Vault Web Client`.
   * Copy the generated **Client ID** (e.g. `123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com`).

---

### Step 4: Environment & Secrets Setup

1. **Create/Update `.env` file** in the project root:
   ```properties
   # Firebase / Google Web Client ID for Google Sign-In & Drive OAuth
   GOOGLE_WEB_CLIENT_ID=YOUR_WEB_CLIENT_ID.apps.googleusercontent.com

   # Optional Cloud Keys
   DROPBOX_APP_KEY=YOUR_DROPBOX_APP_KEY
   ONEDRIVE_CLIENT_ID=YOUR_ONEDRIVE_CLIENT_ID
   ```

2. **Verify `app/src/main/assets/cloud_secrets.properties`**:
   ```properties
   GOOGLE_WEB_CLIENT_ID=YOUR_WEB_CLIENT_ID.apps.googleusercontent.com
   ```

3. **Verify `app/google-services.json`**:
   * Ensure `certificate_hash` inside `oauth_client` matches your lowercase SHA-1 (no colons):
   ```json
   "android_info": {
     "package_name": "com.smsvault",
     "certificate_hash": "aabbcc1122334455667788990011223344556677"
   }
   ```

---

### Step 5: Build & Install

#### Via Gradle Command Line:
```powershell
# Build Debug APK
.\gradlew.bat :app:assembleDebug

# Install on connected device/emulator
adb install -r app\build\outputs\apk\debug\app-debug.apk
```

#### Via Android Studio:
1. Open the `sms-vault` project in Android Studio.
2. Allow Gradle Sync to complete.
3. Select your connected physical device or emulator.
4. Click **Run** (`Shift + F10`).

---

## 📱 How to Use the App

1. **First Launch & Permissions**:
   * The app will guide you through the 3-slide onboarding to grant `READ_SMS`, `READ_CALL_LOG`, and notification permissions.
2. **Connect Google Drive**:
   * Navigate to **Settings** (Gear icon) ➔ **Cloud Storage Integrations**.
   * Toggle **Google Drive** ON.
   * Google's native system dialog will prompt you to select your account and grant Drive access.
   * Status will update to **"Connected & Active Target"**.
3. **Trigger Backups**:
   * On the **Dashboard**, tap **Backup Now**.
   * The live progress screen will show extraction, formatting, encryption, local write, and cloud upload in real-time.
   * Files will appear in your Google Drive under the **`sms_vault_backup`** folder.
4. **Restore Messages**:
   * Navigate to **Restore** from the Dashboard or Vault Explorer.
   * Select an unencrypted `.xml` or encrypted `.svlt` file.
   * Follow the system prompt to temporarily set SMS Vault as your default SMS app during restoration, then revert back seamlessly.

---

## 🔒 Security & Privacy Specification

| Component | Standard / Algorithm | Implementation Detail |
|---|---|---|
| **Payload Cipher** | `AES/GCM/NoPadding` | 256-bit symmetric encryption with authenticated tag |
| **Key Derivation** | `PBKDF2WithHmacSHA256` | 100,000 iterations with 16-byte random salt |
| **Initialization Vector** | 12-byte CSPRNG | `SecureRandom` generated uniquely per backup |
| **Token Storage** | `EncryptedSharedPreferences` | Hardware-backed MasterKey (`AES256_GCM` + `AES256_SIV`) |
| **Drive Isolation** | `drive.file` Scope | Restricts app access strictly to files it created in `sms_vault_backup/` |

---

## 📄 License

This project is licensed under the **Apache License 2.0**.
