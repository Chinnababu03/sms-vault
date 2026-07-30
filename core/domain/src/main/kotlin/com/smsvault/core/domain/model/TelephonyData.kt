package com.smsvault.core.domain.model

import kotlinx.serialization.Serializable

@Serializable
data class SmsMessage(
    val id: Long,
    val address: String,
    val body: String,
    val dateMs: Long,
    val dateSentMs: Long,
    val type: SmsType,
    val read: Boolean,
    val threadId: Long,
    val subscriptionId: Int = 0,
)

@Serializable
enum class SmsType { INBOX, SENT, DRAFT, OUTBOX, FAILED }

@Serializable
data class MmsMessage(
    val id: Long,
    val dateMs: Long,
    val threadId: Long,
    val parts: List<MmsPart>,
)

@Serializable
data class MmsPart(
    val contentType: String,
    val data: ByteArray?,
    val text: String?,
)

@Serializable
data class CallLogEntry(
    val id: Long,
    val number: String,
    val type: CallType,
    val dateMs: Long,
    val durationSeconds: Long,
    val cachedName: String?,
)

@Serializable
enum class CallType { INCOMING, OUTGOING, MISSED, REJECTED, BLOCKED }

@Serializable
data class BackupPayload(
    val schemaVersion: Int = 1,
    val generatedBy: String = "SMS Vault 1.0.0",
    val contentType: ContentType,
    val itemCount: Int,
    val checksumSha256: String,
    val createdAtEpochMs: Long,
    val smsList: List<SmsMessage> = emptyList(),
    val callLogList: List<CallLogEntry> = emptyList(),
)
