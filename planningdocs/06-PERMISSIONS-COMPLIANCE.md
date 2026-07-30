# SMS Vault — Permissions, Privacy & Play Store Compliance

`READ_SMS` and `READ_CALL_LOG` are the two riskiest permissions this app requests.
Google Play treats them as high-sensitivity and reviews apps that declare them more
strictly than almost any other permission category. This document exists so that
compliance is designed in from Phase 1, not patched in before submission.

## 1. Sensitive Permissions Overview

| Permission | Why SMS Vault needs it | Risk category |
|---|---|---|
| `READ_SMS` / `SEND_SMS` / `RECEIVE_SMS` / `RECEIVE_MMS` | Core backup/restore functionality | Play Store "high-risk/sensitive," default-handler-gated |
| `READ_CALL_LOG` | Call history backup/restore | Same category |
| `BROADCAST_SMS` / `BROADCAST_WAP_PUSH` / `SEND_RESPOND_VIA_MESSAGE` | Required to *qualify* as an SMS handler at all, not used for any feature directly | Only meaningful bundled with the above |
| Location (Android 8+) | Required by the OS to discover nearby devices for Transfer | Standard runtime permission, unrelated to the SMS/Call Log policy category |

## 2. The Default-Handler Requirement (current as of mid-2026)

Google Play restricts SMS and Call Log permission groups to apps that are actively
registered as the user's default SMS, Phone, or Assistant handler. This is not a
one-time check at install — it's an ongoing condition:

- An app **cannot even declare** these permissions in its manifest unless it is
  built to become a default handler (placeholder/unused declarations are also
  disallowed).
- The app **must actively be the default handler at the moment** it uses the
  permission, and must **stop using it immediately** if the user changes their
  default handler elsewhere.
- The app's Play Store listing description must make the SMS/call-related core
  functionality clear, and a published privacy policy is mandatory.
- Usage is limited strictly to the core functionality that justifies the
  permission — Play's spyware policy separately prohibits exfiltrating data
  unrelated to that documented purpose (e.g., using message content for anything
  other than backup/restore is out of bounds even if the user technically granted
  the permission).

**What this means for SMS Vault's design (already reflected in the specs above):**

- The Permission Priming screen (`03-UI-UX-DESIGN-SYSTEM.md` §4.2) must state the
  core functionality clearly *before* the OS permission dialog appears.
- The relinquishment prompt (`02-ARCHITECTURE.md` §5) is not optional UX polish —
  it's how the app satisfies "stop using the permission the moment it's no longer
  the default handler." It must fire immediately after every backup/restore run,
  with no path for a user to dismiss it into an indefinitely-held role.
- No feature may use SMS/call-log content for anything other than backup, restore,
  transfer, and the print/export tools already specified. In particular: no
  analytics on message content, no ad targeting, no third-party sharing beyond the
  cloud storage destination the user explicitly picked.

## 3. Runtime Permission Rationale Copy

Shown on the Permission Priming card, plain and specific (see
`03-UI-UX-DESIGN-SYSTEM.md` §6 for the general voice rules this follows):

> "SMS Vault needs to read your messages and call history to back them up, and needs
> to become your default messaging app briefly to write them back during a restore.
> It only holds that role while a backup or restore is running, then automatically
> hands control back to your regular messaging app."

## 4. Data Safety Form Mapping

| Play Console Data Safety field | SMS Vault answer |
|---|---|
| Data collected: SMS/MMS, Call logs | Yes — collected for backup/restore, user-initiated |
| Shared with third parties | No — data goes only to the cloud provider the user explicitly authorizes; SMS Vault does not operate a server that stores message content |
| Encrypted in transit | Yes (provider APIs are TLS; payload is also encrypted before upload) |
| Encrypted at rest | Yes, by default (AES-256-GCM, see `04-DATA-MODEL-API.md` §6) |
| User can request deletion | Yes — Delete Backups tool, plus uninstall removes all local data |
| Data used for advertising | No |

## 5. Privacy Policy Requirements Checklist

- [ ] States plainly that message/call content is never transmitted to SMS Vault's
      own servers — only to the storage destination the user picks.
- [ ] Names each cloud provider integration (Google Drive, Dropbox, OneDrive) and
      links to that provider's own privacy terms.
- [ ] Describes what Firestore stores (metadata only — see
      `04-DATA-MODEL-API.md` §3) and explicitly states it does not include message
      bodies or call content.
- [ ] Describes encryption at rest and that a user-set passphrase, if enabled, is
      never transmitted or stored by SMS Vault.
- [ ] Provides a deletion/account-closure path.
- [ ] Kept in sync with the Data Safety form (§4) — these two must never drift.

## 6. GDPR / CCPA Notes

- Message content and call metadata are personal data under GDPR; the lawful basis
  is user consent obtained at the point of backup/restore, not "legitimate
  interest."
- Because the payload never transits a SMS Vault-operated server, most GDPR
  processing obligations attach to the cloud provider the user picked, not to SMS
  Vault itself — but the privacy policy still needs to name that division of
  responsibility clearly rather than leave it implied.
- CCPA "do not sell" is moot in the sense that no message content is ever monetized,
  but the privacy policy should say so explicitly rather than rely on the general
  no-ads note in §4.

## 7. Relinquishment & Handler Lifecycle

Non-negotiable implementation rule, referenced from `02-ARCHITECTURE.md` §5 and
`05-BUILD-PLAN.md` Phase 4:

1. Role requested only after explicit user acknowledgment on the Priming screen.
2. Role held only for the duration of an active backup/restore pipeline run.
3. On pipeline completion (success, partial failure, or user cancel), the
   relinquishment prompt fires unconditionally — there is no code path where a
   completed run leaves the app holding `ROLE_SMS` silently.
4. If the user manually changes their default SMS app elsewhere in the OS mid-run,
   the next pipeline step must detect the role is no longer held and halt rather
   than continue reading/writing telephony data.

## Sources

Current Play Store policy details in §2 and the Data Safety mapping in §4 were
checked against Google's own developer documentation as of July 2026:

- Play Console Help — Permissions and APIs that Access Sensitive Information:
  https://support.google.com/googleplay/android-developer/answer/16558241
- Play Console Help — Use of SMS or Call Log permission groups:
  https://support.google.com/googleplay/android-developer/answer/10208820
- Android Developers — Permissions used only in default handlers:
  https://developer.android.com/guide/topics/permissions/default-handlers

Policy specifics change; re-check these before the Phase 8 Play Console submission
rather than relying solely on this document.
