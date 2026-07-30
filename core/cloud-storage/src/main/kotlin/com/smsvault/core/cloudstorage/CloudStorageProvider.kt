package com.smsvault.core.cloudstorage

import com.smsvault.core.domain.model.ProviderId

data class RemoteFileHandle(
    val id: String,
    val name: String,
    val sizeBytes: Long,
    val createdAtMs: Long,
    val provider: ProviderId,
)

data class BackupPayloadFile(
    val fileName: String,
    val data: ByteArray,
    val sizeBytes: Long = data.size.toLong(),
)

interface CloudStorageProvider {
    val id: ProviderId

    suspend fun isAuthorized(): Boolean

    /** List all backup files this app has uploaded for this provider. */
    suspend fun list(): Result<List<RemoteFileHandle>>

    /** Upload an encrypted backup payload. Returns the remote file handle on success. */
    suspend fun upload(file: BackupPayloadFile): Result<RemoteFileHandle>

    /** Download a backup payload by its remote handle. */
    suspend fun download(handle: RemoteFileHandle): Result<BackupPayloadFile>

    /** Delete a backup file. */
    suspend fun delete(handle: RemoteFileHandle): Result<Unit>
}
