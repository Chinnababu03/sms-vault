# SMS Vault — UI/UX Design System & Screen Specifications

## 1. Design Philosophy

The subject of this app is literal: a vault that holds something irreplaceable. Every
existing app in this category treats that idea as a metaphor confined to the icon and
the name, then falls back to a generic list-and-card interface underneath. SMS Vault
takes the vault idea one layer deeper and gives it a single, real interaction: **the
Seal** — a shape that is visibly open when your messages are unprotected and visibly
closed, sealed, and slightly warm (brass, not green) the moment a backup completes.
That's the one deliberate risk this system takes. Everything else — grids, cards,
lists — stays quiet and standard Material 3 Expressive so the Seal has room to be the
thing people remember.

This replaces the legacy pattern of a static colored card with the word "Protected" or
"Unprotected" printed on it. State should be seen in shape and motion, not just read.

## 2. Design Tokens

### 2.1 Color

Material 3's color system generates full tonal palettes from seed colors via the HCT
color space; these are the seeds, not the only rendered values.

| Role | Seed | Hex | Rationale |
|---|---|---|---|
| Primary | Vault Indigo | `#2B3A55` | Steel/ink tone — security, not the generic "trustworthy blue" of finance apps; dark enough to anchor a confident dark theme |
| Secondary / accent | Aged Brass | `#B08D57` | The literal material of a vault's hardware; used for the Seal, the "Protected" state, and primary CTAs — warm rather than the expected green (legacy) or blue (generic) |
| Tertiary | Verdigris | `#4C7A7C` | Aged-copper teal for informational accents (progress, links, secondary charts) — keeps the palette from reading as purely "bank app" |
| Surface (light) | Warm paper | `#FBF8F3` | Slightly warm off-white, not clinical pure white |
| Surface (dark) | Graphite | `#15181D` | Near-black with a blue undertone matching Vault Indigo, not a pure neutral black |
| Error | Standard M3 error ramp | `#BA1A1A` | No deviation — error color should never be a place to be clever |

Dynamic color (Material You, deriving tones from the user's wallpaper) is supported as
an opt-in in Settings → Appearance; the seed palette above is the default and the
fallback on devices/API levels without dynamic color support.

### 2.2 Typography

| Role | Typeface | Used for |
|---|---|---|
| Display / Headline | Google Sans Flex (variable) | Screen titles, the Seal's status label, Operation Summary headline |
| Body / UI | Roboto Flex (variable) | Everything else — buttons, list content, form fields |
| Utility / data | Roboto Mono | Byte sizes, timestamps, item counts, backup filenames (e.g. `sms-20260715-153809.xml`) |

Variable fonts let weight/width respond to context (e.g. the Seal's label gets a
heavier weight only in the instant it seals) without shipping multiple font files —
this is the expressive-typography direction Material 3 Expressive is built around.

Legacy note: the reference screens use a handwriting-style display face throughout.
That reads as playful but undermines trust for a security-adjacent tool; SMS Vault
reserves personality for shape and motion instead, and keeps type professional.

### 2.3 Shape

Material 3 Expressive's expanded shape library (35+ shapes) and built-in shape
morphing are used exactly twice, deliberately:

1. **The Seal** (Dashboard) morphs between an open/unlocked outline (Unprotected)
   and a closed, cut-corner sealed form (Protected) when a backup completes.
2. **The determinate progress indicator** on the Active Operation screen uses the
   new expressive `LoadingIndicator`/`ContainedLoadingIndicator` shapes rather than a
   plain circular spinner.

Every other surface uses standard M3 rounded-rectangle shape tokens (`shape.small`
12dp, `shape.medium` 16dp, `shape.large` 28dp) — shape morphing is a signature, not a
house style applied everywhere.

### 2.4 Spacing & Layout

- 4dp base unit; standard content padding 16dp, card internal padding 20dp.
- `NavigationSuiteScaffold` drives layout adaptively: bottom navigation bar on
  compact width, navigation rail on medium width (large phones landscape, small
  tablets), full navigation drawer on expanded width (tablets, foldables unfolded).

### 2.5 Motion

| Transition | Duration | Easing |
|---|---|---|
| Seal morph (open → sealed) | 600ms | M3 expressive spring (bouncy, low damping) — the one place a spring feels earned |
| Screen-to-screen navigation | 300ms | M3 standard easing |
| List item enter/exit | 150ms | M3 standard easing |
| Progress value change | Continuous, tied to `WorkInfo` progress | — |

Reduced-motion (`Settings.Global.ANIMATOR_DURATION_SCALE = 0` / system reduce-motion)
disables the Seal morph spring in favor of a plain cross-fade, and disables list
enter/exit animation.

## 3. Component Library

| Component | Description |
|---|---|
| **StatusSeal** | The morphing shape + label described in §1/§2.3; shows message/call counts as secondary text |
| **ActionGridTile** | 2×2 grid item (Back Up Now / Restore / Vault / Transfer); icon + label, large tap target (min 88dp) |
| **ProviderTabRow** | Scrollable tab row across Local + only the cloud providers the user has actually connected — an unconnected provider is never shown as a dead tab |
| **BackupHistoryCard** | Timestamp (Roboto Mono), file size, item count, overflow menu (Restore / Delete / Share — Share local-only) |
| **ProgressStage** | Determinate `LoadingIndicator` + dynamic label ("Encrypting payload… 1,450 / 3,000") + Cancel action |
| **EncryptionBadge** | Small persistent chip shown wherever a backup is listed, confirming encrypted vs. not |
| **ToolCard** | Icon + title + one-line description, used on the Tools screen instead of a bare text link list |

## 4. Screen-by-Screen Specifications

### 4.1 Onboarding & Sign-In
- Credential Manager bottom sheet (passkey / saved password / Sign in with Google) —
  one call, no custom form for the Google path.
- **New:** "Continue without an account" — local-only mode. Cloud sync of backup
  *metadata* requires sign-in; local backup and restore never do. This is stated
  plainly on the screen, not buried in settings.
- `AuthViewModel` states: `Idle`, `Loading`, `Success`, `Error` (unchanged from the
  base spec — this state shape is already correct).

### 4.2 Permission Priming (Critical)
- `HorizontalPager`, 3 slides: Cloud Sync, Encryption, Transfers.
- Final "Permissions Required" card states plainly what `READ_SMS`, `WRITE_SMS`, and
  the temporary `ROLE_SMS` grant are for, **and how long SMS Vault holds the role**
  ("only while a backup or restore is running — then it hands your default
  messaging app back automatically").
- `rememberLauncherForActivityResult` fires only after the user taps "Acknowledge."

### 4.3 Dashboard (Home)
- StatusSeal at top, morphing per state; counts shown as secondary text under it
  (mirrors the legacy count-chips pattern, redesigned).
- 2×2 ActionGridTile grid: Back Up Now, Restore, Vault, Transfer.
- A quiet schedule chip beneath the grid ("Next scheduled backup: tomorrow, 2:00 AM")
  when automation is on — surfaces the existing setting instead of hiding it in
  Settings.

### 4.4 Vault (Backup Browser)
- `ProviderTabRow` (Local always present; Drive/Dropbox/OneDrive appear once
  connected).
- `LazyColumn` of `BackupHistoryCard`, each with `EncryptionBadge`.
- Search icon (filter by date) and overflow menu in the top bar, matching the
  pattern already established in the reference screens' `View Backups` screen.

### 4.5 Back Up Now (Backup Configuration)
- Per-type toggle rows (Messages, Call logs), each with an editable, pre-filled
  filename using the `type-YYYYMMDD-HHMMSS` convention.
- Provider selection as a row of chips (not a single Drive toggle) — multi-provider
  from the same screen, since the underlying `CloudStorageProvider` abstraction
  supports it natively (see `02-ARCHITECTURE.md` §6).
- "Advanced options" expander: compression, custom encryption passphrase override.
- Sticky bottom "Back Up" CTA, disabled until at least one type + one destination is
  selected.

### 4.6 Restore
- Step 1: pick a location (`ProviderTabRow`, same component as Vault).
- Step 2: pick a backup (`BackupHistoryCard` list, single-select).
- **New — pre-restore preview:** before committing, show a summary card: "This will
  add up to 3,000 messages and 593 calls. Existing conversations are merged;
  duplicates are skipped." — the legacy flow jumps straight from picking a backup
  to restoring with no preview.
- Confirm → Active Operation screen.

### 4.7 Transfer (Device-to-Device)
- "Send from this phone" / "Receive on this phone", as in the reference screens.
- **New:** pairing via an on-screen QR code (Nearby Connections) instead of relying
  purely on matching Wi-Fi networks — faster and clearer for the common
  same-room case; Wi-Fi network matching remains as a fallback path.
- Location permission rationale line is kept, worded plainly (Android 8+ requires it
  to discover nearby devices — this is an OS requirement, not a Vault choice, and the
  copy says so).
- Live transfer speed / ETA shown once pairing succeeds.

### 4.8 Active Operation (Execution)
- Bottom navigation hidden; `FLAG_KEEP_SCREEN_ON` applied (toggleable in Settings,
  matching the reference app's "Allow screen to turn off" option).
- `ProgressStage` component: expressive `LoadingIndicator`, determinate, bound to
  real `WorkInfo` progress.
- Cancel triggers a confirmation dialog explaining that partial progress up to that
  point is kept, not discarded (aligns with the resumable worker chain in
  `02-ARCHITECTURE.md` §8).

### 4.9 Operation Summary
- Success: the StatusSeal completes its morph-to-sealed animation here (not only on
  the Dashboard) so the moment of completion is where the payoff actually lands.
- Partial/failed: amber state, explicit counts of what succeeded vs. what didn't,
  and a direct "Try again" action that resumes rather than restarts from zero.
- Stats grid: Total SMS, Total Calls, Payload Size, Time Elapsed.

### 4.10 Settings
- Account section per connected provider (not just Firebase user) — shows which of
  Drive/Dropbox/OneDrive are linked, with individual sign-out.
- Automation: segmented control (Daily/Weekly/Monthly) + constraint chips
  (Wi-Fi only, Charging only) bound directly to the `PeriodicWorkRequest` constraints
  in `02-ARCHITECTURE.md` §8.
- Security: encryption is shown as **always on**, with an "Add a passphrase"
  secondary action (not a togglable "off" state — see `01-PRD.md` §3 target of
  ≥90% encrypted backups), plus a separate biometric-lock toggle for restore/export/
  delete actions.
- Appearance: Light/Dark/System, dynamic color opt-in.
- About: version, licenses, privacy policy, contact, "send app logs to developer"
  (logs are non-PII per `02-ARCHITECTURE.md` §10, and the screen says so).

### 4.11 Tools
- `ToolCard` list replacing the bare-link Tools menu: "Delete messages or call logs,"
  "Restore from another person's backup" (import flow) — same functionality as the
  reference screens, given an actual visual affordance instead of plain text rows.

### 4.12 Backup Detail / Diff (V2)
- Side-by-side summary of two backups from the same provider: conversations added,
  removed, message-count delta. Entry point: long-press or overflow action on any
  `BackupHistoryCard` → "Compare with…".

### 4.13 Home Screen Widget (Glance)
- Compact card: StatusSeal (static, non-morphing render) + "Last backup: 2 hours
  ago" + a single "Back up now" tap target that enqueues the same `OneTimeWorkRequest`
  used by the in-app button.

## 5. Accessibility Requirements

- Text contrast ≥ 4.5:1 (body), ≥ 3:1 (large text ≥ 18sp), checked against both
  light and dark surface tokens above.
- State is never color-only: the StatusSeal always carries a text label
  ("Protected"/"Unprotected") alongside shape and color.
- Every icon-only control has a `contentDescription`; minimum touch target 48dp
  (grid tiles use 88dp, larger than the minimum, since they're primary actions).
- Layouts verified at 200% system font scale without truncation — utility/data text
  (Roboto Mono) is the one place a horizontal scroll fallback is acceptable (long
  filenames), never for headlines or body copy.
- TalkBack traversal order follows visual reading order on every screen; the Seal's
  shape-morph animation is announced via a state-change accessibility event, not
  only conveyed visually.
- Reduce-motion setting disables the Seal spring and list animations (see §2.5).

## 6. Content & Voice Guidelines

Copy is part of the interface, not decoration. Two rules drive every string in this
app: name the action by what it does, and treat failure as direction, not apology.

| Situation | Avoid | Use |
|---|---|---|
| Primary action button | "Submit" | "Back up now" |
| Confirming an action's result | Toast doesn't match the button's verb | Button says "Back up now" → toast says "Backed up" (same verb family, not "Success!") |
| Sync failure | "An error occurred during sync." | "Couldn't reach Google Drive. Check your connection and try again." |
| Partial restore failure | "Oops! Something went wrong." | "Restore stopped partway through. 1,204 of 3,000 messages were saved. Try again to pick up where it left off." |
| Empty state | Mood-only ("Nothing here!") | Directional: "Your messages and calls aren't protected yet." + a single next action, "Set up a backup" |
| Permission rationale | System-speak ("This app requires READ_SMS permission") | Plain terms: "SMS Vault needs to read your messages to back them up. It only asks for this while backing up or restoring." |

Every button label stays identical from the tap through to its resulting toast or
summary line — the vocabulary of the interface is the signposting for someone
navigating it, and inconsistent verbs between a button and its outcome is the most
common source of "did that actually work?" confusion in backup tools.
