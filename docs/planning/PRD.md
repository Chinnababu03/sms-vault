# Product Requirements Document (PRD)
# SMS Vault — Privacy-First Encrypted Backup

---

## 1. Product Overview

**Product Name:** SMS Vault

**Version:** 2.0.0 (Full Rewrite)

**Vision:** A privacy-first, multi-cloud SMS & Call Log backup app that gives users complete control over their communication data with military-grade encryption.

**Mission Statement:** To provide the most secure, user-friendly, and reliable way to backup and restore SMS messages and call logs, ensuring no communication data is ever lost.

---

## 2. Target Audience

### Primary Users

| User Segment | Description | Pain Point |
|-------------|-------------|------------|
| **Privacy Advocates** | Security-conscious users who refuse to use cloud services that can read their data | Existing backup solutions upload unencrypted data |
| **Business Professionals** | Users who need to preserve SMS for legal/compliance reasons | No reliable, audit-trail backup exists |
| **Switching Users** | People upgrading phones who want to preserve conversation history | Native backup tools are inconsistent across manufacturers |
| **Family Archivists** | Users preserving family memories in text form | SMS data loss when phones break or are lost |

### Demographics
- **Age:** 25-55
- **Tech Savvy:** Moderate to High
- **Devices:** Android primary (iOS future)
- **Cloud Usage:** Google Drive, OneDrive, or Dropbox users

---

## 3. Competitive Analysis

| Feature | SMS Vault | Google Messages | iMobie AnyDroid | Super Backup |
|---------|-----------|-----------------|-----------------|--------------|
| **Client-side Encryption** | ✅ AES-256-GCM | ❌ | ❌ | ❌ |
| **Multi-cloud Support** | ✅ 3 providers | ❌ Google only | ❌ | ❌ |
| **Open Source** | ✅ | ❌ | ❌ | ❌ |
| **Zero-knowledge** | ✅ | ❌ | ❌ | ❌ |
| **Scheduled Backups** | ✅ | ✅ | ✅ | ✅ |
| **Incremental Backup** | ✅ | ❌ | ❌ | ❌ |
| **Cross-platform Restore** | ✅ | ❌ | ❌ | ❌ |
| **Free** | ✅ | ✅ | ❌ | Freemium |

### Competitive Advantage
1. **Only solution with client-side AES-256-GCM encryption**
2. **Multi-cloud with zero-knowledge architecture**
3. **Open source and auditable**
4. **No account required — complete anonymity**

---

## 4. Core Features

### 4.1 MVP Features (Phase 1)

| Feature | Priority | Description | User Story |
|---------|----------|-------------|------------|
| SMS Backup | P0 | Read & backup all SMS messages via native bridge | "As a user, I want to backup all my SMS messages so I never lose important conversations" |
| Call Log Backup | P0 | Read & backup call log entries via native bridge | "As a user, I want to backup my call history for reference" |
| Full Restore | P0 | Restore SMS & Call Logs to device | "As a user, I want to restore my backups to a new phone" |
| Google Drive Backup | P0 | Upload encrypted backups to Google Drive | "As a user, I want to store my backup in Google Drive" |
| OneDrive Backup | P0 | Upload to OneDrive | "As a user, I want to store my backup in OneDrive" |
| Dropbox Backup | P0 | Upload to Dropbox | "As a user, I want to store my backup in Dropbox" |
| AES-256-GCM Encryption | P0 | Client-side encryption before upload | "As a user, I want my backups encrypted so no one can read them" |
| Onboarding | P0 | First-time setup with permissions | "As a new user, I want to be guided through setup" |

### 4.2 Enhanced Features (Phase 2)

| Feature | Priority | Description | User Story |
|---------|----------|-------------|------------|
| Scheduled Backups | P0 | Daily/weekly automated backups | "As a user, I want backups to happen automatically" |
| Backup History | P0 | View and manage past backups | "As a user, I want to see my backup history" |
| Incremental Backup | P1 | Only backup new messages since last backup | "As a user, I want fast backups that don't repeat work" |
| MMS Text Backup | P1 | Backup MMS text body | "As a user, I want to backup MMS messages too" |
| Backup Notifications | P1 | Get notified when backup completes | "As a user, I want to know when my backup finishes" |
| Storage Management | P2 | View and manage cloud storage usage | "As a user, I want to manage my cloud storage" |

### 4.3 Premium Features (Phase 3)

| Feature | Priority | Description | User Story |
|---------|----------|-------------|------------|
| Export to CSV/JSON | P2 | Export backups to readable formats | "As a user, I want to read my backups in other apps" |
| Search in Backup | P2 | Search through backed up messages | "As a user, I want to search my backup archive" |
| Selective Restore | P2 | Restore specific conversations or date ranges | "As a user, I want to restore only certain messages" |
| Biometric Lock | P2 | App lock with fingerprint/face | "As a user, I want to lock the app with biometrics" |
| Widget | P3 | Home screen widget for quick backup | "As a user, I want one-tap backup from home screen" |

---

## 5. User Flows

### 5.1 First-Time User Flow
```
App Launch → Onboarding Welcome → Permission Request (SMS) → Permission Request (Call Log)
    → Encryption Info → Cloud Setup (Optional) → Dashboard
```

### 5.2 Backup Flow
```
Dashboard → Tap "Backup" → Select Cloud Destinations → Start Backup
    → Progress Animation → Success Screen → Return to Dashboard
```

### 5.3 Restore Flow
```
Dashboard → Tap "Restore" → Select Backup File → Confirm Restore
    → Progress Animation → Success Screen → Return to Dashboard
```

### 5.4 Cloud Management Flow
```
Dashboard → Tap "Cloud" → View Connected Accounts → Connect/Disconnect
    → OAuth Flow (if connecting) → Return to Cloud Manager
```

---

## 6. Success Metrics

### 6.1 Primary Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Backup Success Rate** | >99% | Completed backups / Started backups |
| **Restore Success Rate** | >99% | Successful restores / Attempted restores |
| **User Retention (30-day)** | >60% | Active users after 30 days |
| **App Store Rating** | >4.5 stars | User reviews |

### 6.2 Secondary Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Average Backup Time | <60 seconds | Time from start to completion |
| Crash-free Rate | >99.5% | Sessions without crashes |
| Cloud Connection Success | >95% | Successful OAuth flows |
| Permission Grant Rate | >80% | Permissions granted / Requests |

---

## 7. Security Requirements

### 7.1 Encryption Standards
- **Algorithm:** AES-256-GCM
- **Key Derivation:** PBKDF2 with 100,000 iterations
- **Salt:** Random 16-byte salt per backup
- **IV:** Random 12-byte IV per encryption operation
- **Key Storage:** Android Keystore (never in plaintext)

### 7.2 Data Protection Rules
1. **Never** store encryption keys in cloud storage
2. **Never** transmit unencrypted data
3. **Never** log sensitive message content
4. **Always** verify data integrity with checksums
5. **Always** use secure TLS for all network requests

### 7.3 Compliance
- GDPR compliant (data portability right)
- No analytics or tracking
- No ads or third-party SDKs
- Complete offline operation capability

---

## 8. Non-Functional Requirements

### 8.1 Performance
- App launch to dashboard: <2 seconds
- Backup initiation: <1 second
- Backup of 10,000 SMS: <30 seconds
- Memory usage: <100MB during backup

### 8.2 Reliability
- Backup resume capability (handle interruptions)
- Data integrity verification
- Graceful error handling with retry options
- Offline mode with queue for cloud upload

### 8.3 Usability
- Accessible to users with low technical knowledge
- Clear progress indicators for all operations
- Meaningful error messages with solutions
- Dark mode support

---

## 9. Technical Constraints

| Constraint | Requirement |
|-----------|-------------|
| **Platform** | Android 8.0+ (API 26+) |
| **Framework** | React Native 0.76+ |
| **Language** | TypeScript 5.x |
| **Min Device RAM** | 2GB |
| **Storage Required** | 50MB + backup size |
| **Network** | Optional (offline capable) |

---

## 10. Release Criteria

### 10.1 MVP Release
- [ ] All P0 features implemented
- [ ] Security audit passed
- [ ] Performance benchmarks met
- [ ] Error rate <0.5%
- [ ] Onboarding flow tested
- [ ] Cloud backup tested on all 3 providers
- [ ] Restore functionality verified
- [ ] Documentation complete

### 10.2 App Store Ready
- [ ] App icon and splash screen
- [ ] Screenshots for all screen sizes
- [ ] Privacy policy
- [ ] Terms of service
- [ ] Support email configured
- [ ] Version metadata

---

## 11. Future Vision

### Year 1 Roadmap
- **Q1:** MVP Launch with core backup/restore
- **Q2:** Scheduled backups and notifications
- **Q3:** iOS support and cross-platform sync
- **Q4:** Premium features (search, export)

### Long-term Vision
- End-to-end encrypted sync across devices
- Family sharing with permission controls
- Enterprise version for business compliance
- Open API for third-party integrations

---

*Document Version: 2.0.0*
*Last Updated: July 2026*
*Status: Ready for Development*
