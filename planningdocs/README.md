# SMS Vault — Documentation Set

**SMS Vault** is a ground-up redesign of the SMS/call-log backup category: a Kotlin +
Jetpack Compose Android app that backs up, restores, and transfers messages and call
history with a modern Material 3 Expressive interface, a pluggable multi-cloud storage
layer, and on-device encryption by default.

This folder is the full product + engineering spec for building it from scratch. It is
written to be handed directly to a development team **or** to an AI coding agent as a
build brief — every document ends with concrete, checkable deliverables rather than
open-ended prose.

## How to read this set

Read in order if you're starting the project; jump directly to a doc if you already
know what you need.

| # | Document | Answers |
|---|---|---|
| 1 | [`01-PRD.md`](./01-PRD.md) | What are we building, for whom, and why? What does "done" look like? |
| 2 | [`02-ARCHITECTURE.md`](./02-ARCHITECTURE.md) | How is the codebase structured? What are the layers, modules, and data flows? |
| 3 | [`03-UI-UX-DESIGN-SYSTEM.md`](./03-UI-UX-DESIGN-SYSTEM.md) | What does it look and feel like? Tokens, components, screen-by-screen specs. |
| 4 | [`04-DATA-MODEL-API.md`](./04-DATA-MODEL-API.md) | What are the exact schemas — Room, Firestore, backup file format, manifest? |
| 5 | [`05-BUILD-PLAN.md`](./05-BUILD-PLAN.md) | What order do we build things in, and what's the Definition of Done per phase? |
| 6 | [`06-PERMISSIONS-COMPLIANCE.md`](./06-PERMISSIONS-COMPLIANCE.md) | How do we stay compliant on Play Store sensitive-permission policy, and handle privacy? |

## Quick facts

| | |
|---|---|
| **Platform** | Android, minSdk 26 (Android 8.0) / targetSdk latest stable |
| **Language** | Kotlin (100%) |
| **UI** | Jetpack Compose, Material 3 Expressive |
| **Architecture** | Clean Architecture + MVVM, unidirectional data flow |
| **DI** | Hilt |
| **Local storage** | Room (metadata) + DataStore (prefs) + Scoped Storage (payload files) |
| **Cloud storage** | Pluggable provider layer — Google Drive (`appDataFolder`), Dropbox, OneDrive |
| **Auth** | Credential Manager (sign-in) + AuthorizationClient (Drive scope grant) + Firebase Auth (identity/metadata sync) |
| **Background work** | WorkManager (chained, constrained, resumable) |
| **Security** | AES-256-GCM payload encryption via Android Keystore, optional biometric lock |

## What's new vs. legacy SMS backup apps

Existing tools in this category (the app whose screens are referenced for parity in
this spec is a well-known, long-running Play Store utility) are built on an older
Android stack — Java/XML views, `AlarmManager`-based scheduling, single-provider
cloud logic duplicated per destination, and no default-on encryption. SMS Vault keeps
every feature users already rely on (local + multi-cloud backup, restore, device
transfer, scheduled automation, print/export) but rebuilds the implementation and the
interface on a current foundation. Specifics are in `01-PRD.md` §6.

## Status

This is a **v1.0 planning spec** — architecture and design are locked enough to start
Phase 0 of the build plan, but expect UI token values and schema field names to be
refined once the first Compose screens are prototyped.
