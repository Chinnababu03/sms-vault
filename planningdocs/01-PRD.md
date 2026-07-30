# SMS Vault — Product Requirements Document

## 1. Vision & Problem Statement

Text messages and call history are one of the last personal archives that live
entirely on a single device with no first-party backup. If a phone is lost, damaged,
factory-reset, or simply upgraded, that history disappears unless a third-party tool
intervened first. The apps that currently fill this gap are functional but dated:
cluttered navigation, no encryption by default, and interfaces that haven't changed
meaningfully in years.

**SMS Vault's vision:** make protecting and moving your message history feel as
modern, trustworthy, and effortless as backing up photos already does — with privacy
(local encryption, no ad-funded data use) as a default, not an upsell.

## 2. Target Personas

| Persona | Situation | Primary need |
|---|---|---|
| **The Upgrader** | Buying a new phone, possibly a different brand/carrier | A transfer path that "just works" without a cable or matching OS |
| **The Archivist** | Wants to keep years of conversations (family, a late relative, a closed business thread) safe long-term | Durable, verifiable backups they can restore years later, exportable to PDF/text |
| **The Careful Owner** | Privacy-conscious; uses SMS for 2FA codes and sensitive conversations | Encryption at rest, minimal permission footprint, no data ever touching ads |
| **The IT-Adjacent Helper** | Sets this up for a parent or less technical family member | Simple onboarding, clear status ("Protected"/"Unprotected"), automatic scheduled backups they don't have to think about |

## 3. Goals & Success Metrics

| Goal | Metric | Target (post-GA, 90 days) |
|---|---|---|
| Backups actually complete | Backup job success rate | ≥ 99% |
| Restores are trustworthy | Restore success rate (message/call count match) | ≥ 99.5% |
| Onboarding doesn't lose people at the permission step | Permission-priming → granted conversion | ≥ 80% |
| App is stable | Crash-free session rate | ≥ 99.5% |
| Encryption adoption reflects "secure by default" | % of backups encrypted | ≥ 90% (opt-out, not opt-in) |
| Scheduled automation is trusted | % of active users with a recurring schedule enabled | ≥ 40% |

## 4. Non-Goals (v1)

- Not a full messaging replacement (SMS Vault becomes the default SMS handler only
  transiently, for the extraction/restore write window — see `02-ARCHITECTURE.md` §5).
- Not building a custom cloud backend for message storage — v1 uses established
  providers (Google Drive, Dropbox, OneDrive) plus Firebase for auth/metadata only.
  Message/call payloads never pass through a server SMS Vault operates.
- Not supporting iOS/desktop in v1 (Android-only; cross-device restore is
  Android-to-Android).
- Not doing OCR/analytics/search-by-content on message text in v1 (see V2 table below).

## 5. Feature Set

### MVP (V1.0)

| Feature | Notes |
|---|---|
| Manual backup (SMS + MMS + call log) to local storage or one connected cloud provider | Selections mirror the "Backup selections" pattern users already expect (per-type toggle, custom filename) |
| Restore from local or cloud backup | Full restore; conflict handling = merge, skip duplicates |
| Google Drive provider (`appDataFolder`) | See `02-ARCHITECTURE.md` §6 |
| Scheduled backup (daily/weekly/monthly) | WorkManager, `requiresCharging` / `requiresUnmeteredNetwork` constraints, user-configurable |
| Default-on local AES-256 encryption | Passphrase optional; device Keystore key otherwise |
| Onboarding with permission priming | Explains *why* before the OS dialog fires |
| Backup browser (list, size, item count, timestamp) | Per provider tab |
| Delete backups | Local + cloud |
| Operation progress screen | Determinate progress, cancel-safe |

### V1.1 (fast-follow)

| Feature | Notes |
|---|---|
| Dropbox and OneDrive providers | Same `CloudStorageProvider` interface, see `02-ARCHITECTURE.md` §6 |
| Device-to-device transfer | Local network (Wi-Fi Direct / Nearby Connections), no cloud round-trip |
| Print from backup | Render conversation to a shareable/printable document |
| Export from backup | Export a single conversation or full archive to PDF or plain text |
| Biometric app lock | Gate restore/export/delete behind biometric or device credential |

### V2 (candidate)

| Feature | Notes |
|---|---|
| Backup diff / comparison view | "What changed between these two backups" |
| Incremental (delta) backups | Reduce backup size/time for large histories |
| Wear OS companion status glance | "Last backup: 2 hours ago" |
| Home screen widget | Backup status + one-tap "Back up now" |
| Import from legacy backup formats | Read the common XML backup schema used by existing tools, for migration (see `04-DATA-MODEL-API.md` §5) |
| Multi-account / family view | Manage backups for more than one number on shared hardware |

## 6. Differentiation vs. Legacy Backup Tools

| Dimension | Typical existing tool | SMS Vault |
|---|---|---|
| UI toolkit | Java/XML Views, dated Material components | Kotlin + Jetpack Compose, Material 3 Expressive |
| Navigation | Slide-out drawer with a long flat list of destinations | Two-level nav: a home dashboard with a 2×2 action grid, drawer reserved for secondary tools |
| Encryption | Off by default, or a paid add-on | On by default, key managed via Android Keystore |
| Cloud providers | Each destination is a mostly separate code path | Single `CloudStorageProvider` abstraction — new providers are a config addition, not a rewrite |
| Scheduling | `AlarmManager`/legacy jobs | `WorkManager` with declared constraints, resumable across process death |
| Monetization | Ad-supported with a "remove ads" IAP | No ads; message content never leaves the device except to the user's chosen storage provider |
| Progress feedback | Indeterminate spinner | Determinate progress tied to real processed-item counts, cancel-safe |

## 7. Release Plan

| Milestone | Scope | Exit criteria |
|---|---|---|
| **Alpha (internal)** | Phases 1–4 of `05-BUILD-PLAN.md`: skeleton, navigation, DB, telephony extraction | Can extract and display real SMS/MMS/call data from a test device |
| **Beta (closed)** | Phases 5–6: Drive backup/restore round-trip, scheduling | A tester can back up, wipe a test profile, and fully restore |
| **GA** | Phase 7 + `06-PERMISSIONS-COMPLIANCE.md` sign-off | Play Console sensitive-permissions declaration approved; privacy policy published; crash-free rate above target for 2 consecutive weeks |

## 8. Risks & Assumptions

- **Play Store policy risk:** default-handler requirement for `READ_SMS`/`READ_CALL_LOG`
  is strictly enforced (confirmed current as of mid-2026 — see `06-PERMISSIONS-COMPLIANCE.md`).
  The relinquish-immediately-after-restore flow is not optional; it's a compliance
  requirement, not just good UX.
- **OEM variance:** some manufacturers throttle background work aggressively;
  scheduled backups need battery-optimization exemption guidance in onboarding.
- **Assumption:** users are willing to grant `ROLE_SMS` transiently even though they
  don't want SMS Vault as their daily messaging app — this depends entirely on the
  onboarding copy in the Permissions screen making the "why" and "for how long" clear
  (see `03-UI-UX-DESIGN-SYSTEM.md` §4).
