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

## 🔑 Master Replacement Checklist (What to Replace & Where to Get It)

When setting up this project on a new workstation or for a new Google Cloud account, you must replace the template placeholder values with your actual credentials. Use this table as your guide:

| # | Item / Credential | Files in Project to Update | Where to Get It (Source) | Purpose |
|---|---|---|---|---|
| **1** | **Debug Keystore & SHA-1 Fingerprint** | `debug.keystore` (project root) | Your local machine (`~/.android/debug.keystore`) or generated via `keytool` | Authenticates your debug build with Google Play Services |
| **2** | **Android OAuth 2.0 Client** | Registered in Google Cloud Console | [Google Cloud Console > Credentials](https://console.cloud.google.com) (Type: Android, Package: `com.smsvault`, SHA-1 from Item 1) | Authorizes native Google Account Picker & Drive permission dialog |
| **3** | **Google Drive API Scope** | Registered in Google Cloud Console | [Google Cloud Console > OAuth Consent Screen](https://console.cloud.google.com) (Add `.../auth/drive.file`) | Grants permission to create & manage `sms_vault_backup` files in Drive |
| **4** | **OAuth Test Users** | Registered in Google Cloud Console | [Google Cloud Console > OAuth Consent Screen > Test Users](https://console.cloud.google.com) | Allows your Gmail account to sign in while the app is in testing status |
| **5** | **Web Application OAuth Client ID** | 1. `.env`<br>2. `app/src/main/assets/cloud_secrets.properties`<br>3. `app/google-services.json` | [Google Cloud Console > Credentials](https://console.cloud.google.com) (Create Credentials > OAuth Client ID > Web application) | Used for Google Identity token exchanges and Firebase auth |
| **6** | **Firebase Config (`google-services.json`)** | `app/google-services.json` | [Firebase Console > Project Settings > Your Apps](https://console.firebase.google.com) | Configures Firebase Auth, Firestore sync, and Google Services plugin |
| **7** | **Optional Cloud API Keys** | `.env` | [Dropbox Developers](https://www.dropbox.com/developers/apps) / [Azure Portal](https://portal.azure.com) | Optional secondary providers (Dropbox, Microsoft OneDrive) |

---

## 🛠️ Step-by-Step Setup Guide

### 📋 Prerequisites
* **Android Studio**: Ladybug / Koala Feature Drop or newer
* **JDK**: Version 17 or 21
* **Android SDK**: API Level 36 (Android 15+ compatible, minimum SDK 26)
* **Gradle Wrapper**: Gradle 9.6.1 (included in repository)

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/Chinnababu03/sms-vault.git
cd sms-vault
```

---

### Step 2: Keystore & SHA-1 Fingerprint Setup

1. **Copy your debug keystore** to the root of the project:
   * **Windows (PowerShell)**:
     ```powershell
     Copy-Item "$env:USERPROFILE\.android\debug.keystore" ".\debug.keystore"
     ```
   * **macOS / Linux**:
     ```bash
     cp ~/.android/debug.keystore ./debug.keystore
     ```

2. **Extract your SHA-1 Fingerprint**:
   ```bash
   keytool -list -v -keystore ./debug.keystore -alias androiddebugkey -storepass android
   ```
   Copy the `SHA1:` value from the output (e.g. `12:34:56:78:90:AB:CD:EF:...`).

---

### Step 3: Google Cloud Console Configuration

1. Open **[Google Cloud Console](https://console.cloud.google.com)** and create or select your project (e.g. `sms-vault`).
2. **Enable Google Drive API**:
   * Go to **APIs & Services > Library**.
   * Search for **Google Drive API** and click **Enable**.
3. **Configure OAuth Consent Screen**:
   * Go to **APIs & Services > OAuth consent screen**.
   * Choose **External** user type and click **Create**.
   * Fill in App name (`SMS Vault`) and your support email.
   * On the **Scopes** page, click **Add or Remove Scopes** and add:
     * `https://www.googleapis.com/auth/drive.file` *(View and manage Google Drive files created by this app)*.
   * On the **Test Users** page, click **Add Users** and add your Google account email.
4. **Create Android OAuth Client ID**:
   * Go to **APIs & Services > Credentials > Create Credentials > OAuth client ID**.
   * Application type: **Android**.
   * Package name: `com.smsvault`.
   * SHA-1 certificate fingerprint: Paste the SHA-1 extracted in Step 2.
5. **Create Web Application OAuth Client ID**:
   * Click **Create Credentials > OAuth client ID**.
   * Application type: **Web application**.
   * Name: `SMS Vault Web Client`.
   * Copy the generated **Client ID** (e.g. `123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com`).

---

### Step 4: Configure Project Secret & Environment Files

1. **Create or update `.env`** in the project root:
   ```properties
   # Replace with your Web Application Client ID from Step 3.5
   GOOGLE_WEB_CLIENT_ID=123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com

   # Optional secondary providers
   DROPBOX_APP_KEY=YOUR_DROPBOX_APP_KEY
   ONEDRIVE_CLIENT_ID=YOUR_ONEDRIVE_CLIENT_ID
   ```

2. **Update `app/src/main/assets/cloud_secrets.properties`**:
   ```properties
   # Replace with the same Web Application Client ID
   GOOGLE_WEB_CLIENT_ID=123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com
   ```

3. **Update `app/google-services.json`**:
   * Ensure `certificate_hash` matches your SHA-1 in lowercase without colons (e.g., `1234567890abcdef...`).
   * Ensure the `client_type: 3` OAuth client has your Web Client ID from Step 3.5.

---

### Step 5: Build & Install

#### Command Line:
```powershell
# Compile the debug APK
.\gradlew.bat :app:assembleDebug

# Install onto your connected Android device or emulator
adb install -r app\build\outputs\apk\debug\app-debug.apk
```

#### Android Studio:
1. Open the `sms-vault` project in Android Studio.
2. Allow Gradle Sync to complete.
3. Select your device and click **Run** (`Shift + F10`).

---

## 📱 How to Verify & Use the App

1. **Onboarding & Permission Priming**:
   * Follow the 3-slide onboarding to grant `READ_SMS`, `READ_CALL_LOG`, and notification permissions.
2. **Connect Google Drive**:
   * Navigate to **Settings** (Gear icon) ➔ **Cloud Storage Integrations**.
   * Toggle **Google Drive** ON.
   * Select your Google account from the native system dialog and approve Drive file permissions.
   * Status will display **"Connected & Active Target"**.
3. **Backup & Upload**:
   * Return to the **Dashboard** and tap **Backup Now**.
   * The live operation view displays extraction, transformation, encryption, and upload stages.
   * Extracted files will be saved in your Google Drive under the **`sms_vault_backup`** folder.
4. **Restore**:
   * Navigate to **Restore** from Dashboard or Vault.
   * Select your backup file (`.xml` or `.svlt`).
   * Approve the temporary system prompt to set SMS Vault as default SMS app, let restoration complete, and switch back.

---

## 🔒 Security & Privacy Specification

| Component | Standard / Algorithm | Implementation Detail |
|---|---|---|
| **Payload Cipher** | `AES/GCM/NoPadding` | 256-bit symmetric encryption with authenticated GCM tag |
| **Key Derivation** | `PBKDF2WithHmacSHA256` | 100,000 iterations with 16-byte random salt |
| **Initialization Vector** | 12-byte CSPRNG | `SecureRandom` generated uniquely per backup payload |
| **Token Storage** | `EncryptedSharedPreferences` | Hardware-backed MasterKey (`AES256_GCM` + `AES256_SIV`) |
| **Drive Isolation** | `drive.file` Scope | Restricts app access strictly to files it created in `sms_vault_backup/` |

---

## 📄 License

This project is licensed under the **Apache License 2.0**.
