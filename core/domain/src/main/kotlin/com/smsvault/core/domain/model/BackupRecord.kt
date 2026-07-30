package com.smsvault.core.domain.model

import kotlinx.serialization.Serializable

@Serializable
data class BackupRecord(
    val id: String,
    val provider: ProviderId,
    val remoteFileId: String?,
    val localPath: String?,
    val fileName: String,
    val contentType: ContentType,
    val itemCount: Int,
    val sizeBytes: Long,
    val encrypted: Boolean,
    val createdAtEpochMs: Long,
    val checksumSha256: String,
)

@Serializable
enum class ProviderId { LOCAL, GOOGLE_DRIVE }

@Serializable
enum class ContentType { SMS, CALL_LOG, COMBINED }

@JvmInline
value class BackupId(val value: String)

@Serializable
data class BackupLocation(val provider: ProviderId)
