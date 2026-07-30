# SMS Vault — Build Plan (Execution Sequence)

This is the build order for a development team or an AI coding agent. Each phase has
a scope, a Definition of Done (DoD), and a testing checkpoint — a phase is not
"complete" until its DoD is checkable, not just coded.

## Phase 0 — Repository & CI

- Initialize the multi-module Gradle project matching `02-ARCHITECTURE.md` §3.
- Set up CI: build + unit tests on every push; instrumented tests nightly.
- Configure lint/detekt/ktlint.
- **DoD:** empty `:app` builds and installs on an emulator; CI is green on an empty
  commit.

## Phase 1 — Project Skeleton & Config

- Configure `build.gradle.kts` for Compose, Hilt, Firebase, Play Services Auth,
  Credential Manager, Drive API, Room, WorkManager, Coroutines, kotlinx.serialization.
- Wire Hilt application class and base `@HiltAndroidApp`.
- **DoD:** app launches to a blank Compose surface with Hilt DI resolving a trivial
  injected dependency.
- **Testing checkpoint:** CI build stays green with the new dependencies.

## Phase 2 — Navigation & Mock UI

- Implement `NavHost` + `NavigationSuiteScaffold` covering all destinations in
  `03-UI-UX-DESIGN-SYSTEM.md` §4.
- Build every Compose screen with hardcoded UI state (no ViewModels/business logic
  yet) — this is deliberately UI-only so design review can happen before logic is
  written.
- Apply the design tokens from `03-UI-UX-DESIGN-SYSTEM.md` §2 as a `SmsVaultTheme`.
- **DoD:** every screen in the design doc is navigable from a mock Dashboard; visual
  QA against the token spec passes.
- **Testing checkpoint:** screenshot tests baseline captured for every screen.

## Phase 3 — Database & Cloud Auth Setup

- Implement Room DB (`04-DATA-MODEL-API.md` §1) with migrations from day one (even
  though there's no prior version yet — establishes the pattern).
- Implement DataStore preferences (§2).
- Implement Credential Manager sign-in flow + Firebase Auth session bridging
  (`02-ARCHITECTURE.md` §7).
- Implement Firestore schema (§3) and a repository that syncs `BackupRecordEntity`
  rows to `users/{uid}/backups/{backupId}` on write.
- **DoD:** a user can sign in, and a manually-inserted Room row appears in Firestore
  within one sync cycle. "Continue without an account" path also verified to skip
  all of the above cleanly.
- **Testing checkpoint:** repository unit tests (in-memory Room) + a Firestore
  emulator-backed integration test.

## Phase 4 — Telephony Extraction & Permissions

- Implement the four manifest components from `04-DATA-MODEL-API.md` §8.
- Implement the `RoleManager` request flow gated behind the Permission Priming
  screen (`03-UI-UX-DESIGN-SYSTEM.md` §4.2).
- Implement `:core:telephony` paginated `ContentResolver` reads for SMS, MMS, call
  log (§4).
- Implement the relinquishment prompt as a non-skippable step immediately after any
  pipeline run (`02-ARCHITECTURE.md` §5, `06-PERMISSIONS-COMPLIANCE.md` §7).
- **DoD:** on a test device/emulator with seeded SMS/call log content, the app
  becomes the default handler, reads all seeded data with correct counts, and
  relinquishes the role automatically at the end of the run.
- **Testing checkpoint:** instrumented test against a seeded `ContentResolver`
  asserting exact row-count parity.

## Phase 5 — Transformation & Local/Drive Backup

- Implement XML/JSON serialization (`04-DATA-MODEL-API.md` §5) with the versioned
  header.
- Implement `:core:crypto` (AES-256-GCM, Keystore key generation, optional
  passphrase wrapping) — `04-DATA-MODEL-API.md` §6.
- Implement `CloudStorageProvider` interface + `GoogleDriveProvider`
  (`appDataFolder`, `drive.appdata` scope via AuthorizationClient) —
  `02-ARCHITECTURE.md` §6/§7.
- Implement local-only provider (Scoped Storage).
- **DoD:** a full backup → wipe local app data → restore round-trip on Local storage
  and on Google Drive both produce exact item-count and checksum parity.
- **Testing checkpoint:** the `CloudStorageProvider` contract test suite
  (`02-ARCHITECTURE.md` §11) passes for both `LocalStorageProvider` and
  `GoogleDriveProvider`.

## Phase 6 — Background Automation

- Implement the `BackupCoordinatorWorker` chain (`02-ARCHITECTURE.md` §8).
- Implement `ScheduleEntity`-driven `PeriodicWorkRequest` enqueueing from the
  Automation section of Settings.
- Implement progress publishing (`setProgress`) consumed by the Active Operation
  screen.
- **DoD:** a scheduled backup fires under its declared constraints (verified via
  `adb shell dumpsys jobscheduler` or WorkManager's test driver), and killing the
  app mid-run does not lose progress on relaunch.
- **Testing checkpoint:** WorkManager `TestDriver`-based tests simulating constraint
  satisfaction and process death mid-chain.

## Phase 7 — Multi-Provider, Transfer & Polish

- Implement `DropboxProvider` and `OneDriveProvider` against the same contract test
  suite (V1.1 scope from `01-PRD.md` §5).
- Implement Device-to-Device Transfer (Nearby Connections + QR pairing,
  `03-UI-UX-DESIGN-SYSTEM.md` §4.7).
- Implement biometric lock gating (`02-ARCHITECTURE.md` §9).
- Wire final ViewModels to every screen, remove all Phase 2 mock state.
- Add Lottie/Compose transition polish, dark theme and dynamic color paths.
- **DoD:** every screen in `03-UI-UX-DESIGN-SYSTEM.md` §4 is driven by real state;
  transfer works end-to-end between two devices on the same network.
- **Testing checkpoint:** full end-to-end test matrix (backup → restore, across all
  four providers) green on the API-level matrix defined in
  `02-ARCHITECTURE.md` §11.

## Phase 8 — Release Hardening

- Complete `06-PERMISSIONS-COMPLIANCE.md` checklist (Play Console sensitive
  permissions declaration, Data Safety form, published privacy policy).
- Run a battery-optimization/OEM background-restriction pass (Doze, manufacturer
  app-killers) and add in-app guidance where a schedule silently fails to fire.
- Crash-free rate and backup/restore success-rate monitoring dashboards live
  (`01-PRD.md` §3 metrics).
- **DoD:** GA exit criteria from `01-PRD.md` §7 are met for two consecutive weeks in
  the Beta track before promoting to production.
