# SMS Vault — Data Model, Schemas & API Reference

## 1. Room Schema (local metadata)

```kotlin
@Entity(tableName = "backup_records")
data class BackupRecordEntity(
    @PrimaryKey val id: String,             // UUID
    val provider: String,                    // LOCAL | GOOGLE_DRIVE | DROPBOX | ONE_DRIVE
    val remoteFileId: String?,               // null for LOCAL
    val localPath: String?,                  // null once uploaded and pruned locally, if applicable
    val fileName: String,                    // e.g. "sms-20260715-153809.xml"
    val contentType: String,                 // SMS | CALL_LOG | COMBINED
    val itemCount: Int,
    val sizeBytes: Long,
    val encrypted: Boolean,
    val createdAtEpochMs: Long,
    val checksumSha256: String,
)

@Entity(tableName = "schedules")
data class ScheduleEntity(
    @PrimaryKey val id: String,
    val cadence: String,                     // DAILY | WEEKLY | MONTHLY
    val requiresCharging: Boolean,
    val requiresUnmeteredNetwork: Boolean,
    val includeMessages: Boolean,
    val includeCallLogs: Boolean,
    val targetProviders: String,             // comma-separated ProviderId list
    val isEnabled: Boolean,
)

@Entity(tableName = "provider_accounts")
data class ProviderAccountEntity(
    @PrimaryKey val provider: String,        // GOOGLE_DRIVE | DROPBOX | ONE_DRIVE
    val accountLabel: String,                // display email/username, not a token
    val isAuthorized: Boolean,
    val linkedAtEpochMs: Long,
)
```

Tokens are never stored in Room — see §6/`02-ARCHITECTURE.md` §7 for where credentials
actually live (`EncryptedSharedPreferences`).

## 2. DataStore Preference Keys

| Key | Type | Purpose |
|---|---|---|
| `pref_theme_mode` | String | `LIGHT` \| `DARK` \| `SYSTEM` |
| `pref_dynamic_color_enabled` | Boolean | Material You opt-in |
| `pref_keep_screen_on` | Boolean | Mirrors legacy "Allow screen to turn off" (inverted) |
| `pref_biometric_lock_enabled` | Boolean | Gate restore/export/delete |
| `pref_passphrase_set` | Boolean | Whether an optional passphrase layer is active (never stores the passphrase itself) |
| `pref_analytics_enabled` | Boolean | Anonymous analytics opt-in, off by default |
| `pref_last_successful_backup_epoch_ms` | Long | Drives Dashboard "last backup" text and the widget |

## 3. Firestore Schema (metadata sync only — never message content)

```
users/{uid}
  displayName: string
  createdAt: timestamp

users/{uid}/backups/{backupId}
  provider: "GOOGLE_DRIVE" | "DROPBOX" | "ONE_DRIVE" | "LOCAL"
  remoteFileId: string | null
  fileName: string
  contentType: "SMS" | "CALL_LOG" | "COMBINED"
  itemCount: number
  sizeBytes: number
  encrypted: boolean
  createdAt: timestamp
  checksumSha256: string
  sourceDeviceLabel: string        // e.g. "Pixel 9 Pro" — for multi-device visibility only

users/{uid}/devices/{deviceId}
  label: string
  lastActiveAt: timestamp
  appVersion: string
```

Firestore holds exactly the same fields as `BackupRecordEntity` plus a device label —
it is a cross-device mirror of the index, not a data store for message content. The
encrypted payload itself lives only with the cloud storage provider the user chose
(§7) or on-device.

## 4. Telephony ContentResolver Reference

| Source | URI | Key columns read |
|---|---|---|
| SMS | `Telephony.Sms.CONTENT_URI` | `ADDRESS`, `BODY`, `DATE`, `DATE_SENT`, `TYPE` (inbox/sent/draft), `READ`, `THREAD_ID`, `SUBSCRIPTION_ID` (dual-SIM) |
| MMS | `Telephony.Mms.CONTENT_URI` + `Telephony.Mms.Part.CONTENT_URI` for attachments | `DATE`, `MSG_BOX`, `THREAD_ID`, part `CONTENT_TYPE`/`DATA` for attachment payloads |
| Call log | `CallLog.Calls.CONTENT_URI` | `NUMBER`, `TYPE` (incoming/outgoing/missed), `DATE`, `DURATION`, `CACHED_NAME` |

Reads run in `:core:telephony`, paginated (cursor windowing, not one giant query) so
large histories don't spike memory; each page is streamed straight into the
Transform stage rather than materialized fully in memory first.

## 5. Backup File Format

Two payload formats are supported:

- **XML** (default, and used for interoperability): a superset-compatible shape of
  the widely-used SMS-backup XML convention (`<smses count="…"><sms address="…"
  date="…" type="…" body="…" .../></smses>` and the calls equivalent), so backups
  created by other common tools can be **imported** (see `01-PRD.md` §5, V2) without
  a bespoke parser per source app.
- **JSON** (optional, Advanced Options): the same fields, kotlinx.serialization DTOs,
  useful for scripting/export workflows.

Every payload file — regardless of format — is wrapped with a small versioned header
before encryption:

```json
{
  "schemaVersion": 1,
  "generatedBy": "SMS Vault 1.0.0",
  "contentType": "SMS",
  "itemCount": 3000,
  "checksumSha256": "…",
  "createdAtEpochMs": 1752600000000
}
```

The header is checked on restore *before* decrypting the body, so a corrupted or
foreign file fails fast with a clear message rather than a cryptic decryption error.

## 6. Encryption Payload Format

```
[ 4 bytes: magic "SVLT" ]
[ 1 byte:  format version ]
[ 12 bytes: GCM nonce ]
[ N bytes: AES-256-GCM ciphertext (header JSON + backup body) ]
[ 16 bytes: GCM authentication tag ]
```

- Default mode: the AES key is generated in and never leaves the Android Keystore.
- Passphrase mode: the Keystore key wraps a PBKDF2/Argon2-derived key from the
  user's passphrase, so the file is restorable on a different device given the
  passphrase (Keystore-only keys do not survive a factory reset or device change).
- Tampering or truncation fails the GCM tag check, which the Restore flow surfaces
  as "This backup file appears to be corrupted or was modified" rather than a raw
  crypto exception.

## 7. Cloud Provider Folder Layout

| Provider | Root | Notes |
|---|---|---|
| Google Drive | `appDataFolder` special folder (via `drive.appdata` scope) | Invisible in the standard Drive UI; exclusive to this app |
| Dropbox | App-folder access (Dropbox app-scoped root) | Equivalent sandboxing to Drive's appDataFolder |
| OneDrive | Microsoft Graph `approot` special folder | Equivalent sandboxing via Graph API |
| Local | `context.getExternalFilesDir(null)/backups/` | Scoped Storage, removed on uninstall |

File naming within any provider: `{contentType}-{yyyyMMdd}-{HHmmss}.{xml|json}[.enc]`.

## 8. Manifest Requirements (Default SMS Handler)

```xml
<!-- Permissions -->
<uses-permission android:name="android.permission.READ_SMS" />
<uses-permission android:name="android.permission.SEND_SMS" />
<uses-permission android:name="android.permission.RECEIVE_SMS" />
<uses-permission android:name="android.permission.RECEIVE_MMS" />
<uses-permission android:name="android.permission.READ_CALL_LOG" />
<uses-permission android:name="android.permission.BROADCAST_SMS" />
<uses-permission android:name="android.permission.BROADCAST_WAP_PUSH" />

<application>
    <!-- 1. Compose-hosting activity that can receive ACTION_SENDTO -->
    <activity android:name=".ComposeSendActivity" android:exported="true">
        <intent-filter>
            <action android:name="android.intent.action.SENDTO" />
            <category android:name="android.intent.category.DEFAULT" />
            <data android:scheme="smsto" />
        </intent-filter>
    </activity>

    <!-- 2. SMS delivery receiver -->
    <receiver android:name=".SmsDeliverReceiver"
        android:permission="android.permission.BROADCAST_SMS"
        android:exported="true">
        <intent-filter>
            <action android:name="android.provider.Telephony.SMS_DELIVER" />
        </intent-filter>
    </receiver>

    <!-- 3. WAP push (MMS) receiver -->
    <receiver android:name=".WapPushDeliverReceiver"
        android:permission="android.permission.BROADCAST_WAP_PUSH"
        android:exported="true">
        <intent-filter>
            <action android:name="android.provider.Telephony.WAP_PUSH_DELIVER" />
            <data android:mimeType="application/vnd.wap.mms-message" />
        </intent-filter>
    </receiver>

    <!-- 4. Quick-reply service -->
    <service android:name=".RespondViaMessageService"
        android:permission="android.permission.SEND_RESPOND_VIA_MESSAGE"
        android:exported="true">
        <intent-filter>
            <action android:name="android.intent.action.RESPOND_VIA_MESSAGE" />
            <category android:name="android.intent.category.DEFAULT" />
            <data android:scheme="smsto" />
        </intent-filter>
    </service>
</application>
```

All four components are required for `RoleManager` to offer `ROLE_SMS` at all —
missing any one silently disqualifies the app from the role request, so this is a
Phase 4 checklist item in `05-BUILD-PLAN.md`, not an incremental add-later task.
