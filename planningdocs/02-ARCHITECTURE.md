# SMS Vault — Technical Architecture

## 1. Principles

- **Unidirectional data flow.** UI → intent/event → ViewModel → UseCase → Repository →
  data source, and state flows back the same path in reverse via `StateFlow`.
- **Offline-first.** Every screen renders from local state (Room/DataStore) first;
  network/cloud calls update that local state, they are never the direct source of
  truth for UI.
- **Provider-agnostic core.** Nothing above the data layer knows whether a backup
  lives on disk, in Drive, Dropbox, or OneDrive — see §6.
- **Fail loud, recover gracefully.** Every pipeline step returns a typed `Result`;
  partial failure produces a partial-success summary (see `03-UI-UX-DESIGN-SYSTEM.md`
  §4, Operation Summary), never a silent drop of data.

## 2. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Language | Kotlin | Standard for modern Android; coroutines/Flow support |
| UI | Jetpack Compose, Compose BOM (latest stable), Material 3 Expressive | Current Android design direction (2026): expanded shape library with shape morphing, expressive motion/typography, `LoadingIndicator`/`ContainedLoadingIndicator` for engaging determinate/indeterminate progress |
| Navigation | Navigation-Compose + `NavigationSuiteScaffold` | Adaptive nav (bottom bar on phone, rail/drawer on tablet & foldable) from one codebase |
| DI | Hilt | Compile-time-checked, standard for multi-module Compose apps |
| Async | Kotlin Coroutines + Flow | All repository and use-case APIs are suspend/Flow based |
| Local metadata | Room | Backup records, schedule state, provider account links |
| Local prefs | Jetpack DataStore (Preferences) | Settings, feature flags, last-sync markers |
| Local payload storage | Scoped Storage (app-specific dir) | Raw XML/JSON backup payloads pre-upload |
| Background work | WorkManager | Chained, constrained (`requiresCharging`, `requiresUnmeteredNetwork`), survives process death |
| Auth (sign-in) | Credential Manager (`androidx.credentials`) | Current recommended API; unifies passkeys/passwords/Sign in with Google in one bottom sheet, replacing the legacy Google Sign-In client |
| Auth (Drive data access) | AuthorizationClient (Google Identity Services) | Credential Manager handles *who is signed in*; a separate authorization step requests the Drive scope grant — Google's current guidance keeps these two concerns split |
| Identity/metadata sync | Firebase Authentication + Cloud Firestore | Cross-device backup metadata (not message content) |
| Cloud storage | Google Drive API v3 (`drive.appdata` scope), Dropbox API, Microsoft Graph (OneDrive) | Behind one internal interface, see §6 |
| Encryption | AES-256-GCM via Android Keystore (`javax.crypto` + `AndroidKeyStore` provider) | Hardware-backed key when available |
| Serialization | kotlinx.serialization | JSON backup payloads, Firestore DTOs |

## 3. Module Graph

```
:app
 ├─ :feature:onboarding      (auth + permission priming)
 ├─ :feature:dashboard       (home screen)
 ├─ :feature:vault           (backup browser, delete)
 ├─ :feature:backup          (back up now flow)
 ├─ :feature:restore         (restore flow)
 ├─ :feature:transfer        (device-to-device)
 ├─ :feature:settings
 │
 ├─ :core:ui                 (design system: tokens, shared composables)
 ├─ :core:domain             (use cases, repository interfaces, models — no Android deps)
 ├─ :core:data               (repository impls, Room, DataStore)
 ├─ :core:telephony          (ContentResolver queries, SMS role/manifest components)
 ├─ :core:cloud-storage      (CloudStorageProvider + Drive/Dropbox/OneDrive impls)
 ├─ :core:crypto             (encryption/decryption, key management)
 └─ :core:workmanager        (worker chain definitions)
```

`:core:domain` has zero Android SDK dependencies so it's unit-testable in plain JVM
tests. Every `:feature:*` module depends on `:core:domain` and `:core:ui` only —
never directly on `:core:data` or `:core:cloud-storage` — to keep the dependency
graph acyclic and swappable.

## 4. Layer Responsibilities

```
Presentation           Domain                    Data
─────────────          ──────────────            ─────────────────────
Compose Screen   ──▶   UseCase           ──▶     Repository (interface)
     │                      │                          │
ViewModel        ◀──   Result/Flow        ◀──     RepositoryImpl
(StateFlow)                                              │
                                                    Room / DataStore /
                                                    CloudStorageProvider /
                                                    TelephonyReader
```

Example shapes (illustrative, not exhaustive):

```kotlin
// core:domain
interface BackupRepository {
    fun observeBackups(location: BackupLocation): Flow<List<BackupRecord>>
    suspend fun createBackup(spec: BackupSpec): Result<BackupRecord>
    suspend fun deleteBackup(id: BackupId, location: BackupLocation): Result<Unit>
}

class CreateBackupUseCase(
    private val repository: BackupRepository,
    private val encryptPayload: EncryptPayloadUseCase,
) {
    suspend operator fun invoke(spec: BackupSpec): Result<BackupRecord> =
        repository.createBackup(spec)
}
```

```kotlin
// feature:backup
class BackUpNowViewModel @Inject constructor(
    private val createBackup: CreateBackupUseCase,
) : ViewModel() {
    private val _state = MutableStateFlow(BackUpNowUiState())
    val state: StateFlow<BackUpNowUiState> = _state.asStateFlow()

    fun onBackUpClicked() = viewModelScope.launch {
        _state.update { it.copy(status = OperationStatus.Running) }
        createBackup(_state.value.toSpec())
            .onSuccess { record -> _state.update { it.copy(status = OperationStatus.Success(record)) } }
            .onFailure { e -> _state.update { it.copy(status = OperationStatus.Failed(e)) } }
    }
}
```

## 5. Telephony Data Pipeline & Default SMS Handler

To read *and write* SMS (required for restore), the app must temporarily hold
`ROLE_SMS`. Android requires four manifest components to qualify as an SMS handler
candidate — omitting any one of them means `RoleManager` will not offer the role:

| Component | Purpose | Required permission |
|---|---|---|
| Activity, intent-filter `ACTION_SENDTO` | Lets the OS route "send a text" intents here while active | — |
| `BroadcastReceiver` — `SMS_DELIVER_ACTION` | Receives incoming SMS while this app is the handler | `BROADCAST_SMS` |
| `BroadcastReceiver` — `WAP_PUSH_DELIVER_ACTION` | Receives MMS while this app is the handler | `BROADCAST_WAP_PUSH` |
| `Service`, intent-filter `RESPOND_VIA_MESSAGE` | Lets the OS ask this app to send a quick-reply on the user's behalf | `SEND_RESPOND_VIA_MESSAGE` |

Flow:

1. **Request** — `roleManager.createRequestRoleIntent(RoleManager.ROLE_SMS)`, launched
   from the Permissions screen only after the priming card has been acknowledged.
2. **Extract/Restore window** — while the role is held, `:core:telephony` runs the
   `ContentResolver` read (backup) or insert (restore) against `Telephony.Sms`,
   `Telephony.Mms`, and `CallLog.Calls` (exact column reference in
   `04-DATA-MODEL-API.md` §4).
3. **Relinquish immediately** — the moment the pipeline reports completion (success
   *or* failure), the app prompts the user to restore their previous default
   messaging app. This isn't just good UX — Play policy requires an app to stop
   using SMS/Call Log data as soon as it is no longer the active default handler, so
   the relinquishment prompt is treated as a mandatory pipeline step, not a
   dismissible nicety.

## 6. Cloud Storage Abstraction

```kotlin
// core:cloud-storage
interface CloudStorageProvider {
    val id: ProviderId // LOCAL, GOOGLE_DRIVE, DROPBOX, ONE_DRIVE
    suspend fun isAuthorized(): Boolean
    suspend fun authorize(activity: Activity): Result<Unit>
    suspend fun upload(file: BackupPayload): Result<RemoteFileHandle>
    suspend fun list(): Result<List<RemoteFileHandle>>
    suspend fun download(handle: RemoteFileHandle): Result<BackupPayload>
    suspend fun delete(handle: RemoteFileHandle): Result<Unit>
}
```

Each provider implementation owns its own folder-isolation strategy so backups never
appear mixed into a user's general-purpose files:

| Provider | Isolation mechanism |
|---|---|
| Google Drive | `drive.appdata` OAuth scope + the `appDataFolder` alias — a hidden folder invisible in the standard Drive UI, exclusive to this app |
| Dropbox | App-folder access type (Dropbox's equivalent sandboxed app folder) |
| OneDrive | Microsoft Graph `approot` special folder |
| Local | App-specific external files directory (Scoped Storage) |

The Vault Browser and Restore screens iterate `List<CloudStorageProvider>` and
render one tab per authorized provider — adding a fifth provider later is a new
implementation of the interface plus a DI binding, not a UI rewrite.

## 7. Authentication Architecture

Two distinct concerns, kept separate per current Android identity guidance:

1. **Authentication ("who is this")** — Credential Manager's unified bottom sheet
   offers passkeys, saved passwords, and Sign in with Google. This backs the
   Firebase Auth session used to sync backup *metadata* (not content) across a
   user's devices.
2. **Authorization ("can we access their Drive")** — a separate `AuthorizationClient`
   request scoped to `drive.appdata`, requested only when the user actually picks
   Google Drive as a backup location — not bundled into sign-in. This keeps the
   permission ask contextual: a user who only ever backs up locally is never asked
   to grant Drive access at all.

Access/refresh tokens for each cloud provider are stored via `EncryptedSharedPreferences`
backed by the Keystore-managed master key (see §9), never in plain DataStore.

## 8. Background Work Architecture

```
BackupCoordinatorWorker
   └─▶ ExtractWorker      (ContentResolver → local staging file)
        └─▶ TransformWorker   (rows → XML/JSON, see 04-DATA-MODEL-API.md §5)
             └─▶ EncryptWorker    (AES-256-GCM, see §9)
                  └─▶ UploadWorker    (CloudStorageProvider.upload, skipped for local-only)
```

- Chained via `WorkContinuation`, each step passes its output through
  `Data`/on-disk handoff (payloads are too large for `Data`'s key-value limit, so
  workers pass a staging-file URI).
- Scheduled runs are enqueued as `PeriodicWorkRequest` with user-configured
  constraints (`requiresCharging`, `requiresUnmeteredNetwork`); manual "Back up now"
  uses `OneTimeWorkRequest` with `ExistingWorkPolicy.KEEP` so a second tap can't
  spawn a duplicate run.
- Progress is published via `setProgress()` and observed by the Active Operation
  screen through `WorkInfo` `Flow`, so the UI reflects real processed-item counts
  even if the screen is backgrounded and resumed mid-run.

## 9. Security & Encryption Architecture

- **Default:** every backup payload is encrypted with AES-256-GCM before it leaves
  `:core:crypto`, using a key generated in and never exported from the Android
  Keystore (hardware-backed on supporting devices).
- **Optional passphrase mode:** users may additionally set a passphrase (Settings →
  Security). In this mode the Keystore key wraps a passphrase-derived key
  (PBKDF2/Argon2), so restoring on a new device requires the passphrase rather than
  relying on Keystore material that doesn't survive a device wipe.
- **Biometric gate:** restore, export, and delete actions can be gated behind
  `BiometricPrompt` (Settings toggle), independent of payload encryption.
- Exact payload header/format is in `04-DATA-MODEL-API.md` §6.

## 10. Observability & Error Handling

- Every repository method returns `Result<T>` (or a sealed `Outcome` for
  partial-success cases like "3,000 of 3,050 messages restored").
- Structured, non-PII logging only — message *bodies* and phone numbers are never
  written to logs; counts, durations, and error codes are.
- Crash reporting captures breadcrumbs up to (not including) payload content.
- The Operation Summary screen is the single source of truth for "what happened,"
  driven directly off the same `Outcome` type used internally — no separate
  human-readable status is hand-maintained.

## 11. Testing Strategy

| Layer | Test type | Tooling |
|---|---|---|
| `:core:domain` | Pure unit tests (use cases, no Android deps) | JUnit5 + Turbine (Flow testing) |
| `:core:data` | Repository tests against an in-memory Room DB | JUnit + Room's in-memory builder |
| `:core:cloud-storage` | Contract tests — one shared test suite run against every `CloudStorageProvider` implementation (incl. a fake for CI) | JUnit |
| `:core:telephony` | Instrumented tests against a seeded `ContentResolver` on emulator | Android Instrumented Tests |
| Compose screens | Semantics-based UI tests, screenshot tests for design-token regressions | Compose UI Test, Paparazzi/Roborazzi |
| End-to-end | Backup → wipe profile → restore → assert count parity, on a rotating matrix of API levels | Instrumented, run in CI nightly |
