package com.smsvault.core.data.db.entities

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.smsvault.core.domain.model.BackupRecord
import com.smsvault.core.domain.model.ContentType
import com.smsvault.core.domain.model.ProviderId

@Entity(tableName = "backup_records")
data class BackupRecordEntity(
    @PrimaryKey val id: String,
    val provider: String,      // ProviderId.name()
    val remoteFileId: String?,
    val localPath: String?,
    val fileName: String,
    val contentType: String,   // ContentType.name()
    val itemCount: Int,
    val sizeBytes: Long,
    val encrypted: Boolean,
    val createdAtEpochMs: Long,
    val checksumSha256: String,
)

fun BackupRecordEntity.toDomain() = BackupRecord(
    id = id,
    provider = ProviderId.valueOf(provider),
    remoteFileId = remoteFileId,
    localPath = localPath,
    fileName = fileName,
    contentType = ContentType.valueOf(contentType),
    itemCount = itemCount,
    sizeBytes = sizeBytes,
    encrypted = encrypted,
    createdAtEpochMs = createdAtEpochMs,
    checksumSha256 = checksumSha256,
)

fun BackupRecord.toEntity() = BackupRecordEntity(
    id = id,
    provider = provider.name,
    remoteFileId = remoteFileId,
    localPath = localPath,
    fileName = fileName,
    contentType = contentType.name,
    itemCount = itemCount,
    sizeBytes = sizeBytes,
    encrypted = encrypted,
    createdAtEpochMs = createdAtEpochMs,
    checksumSha256 = checksumSha256,
)
