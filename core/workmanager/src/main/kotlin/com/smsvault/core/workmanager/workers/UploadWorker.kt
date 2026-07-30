package com.smsvault.core.workmanager.workers

import android.content.Context
import kotlinx.coroutines.flow.first
import androidx.work.*
import com.smsvault.core.cloudstorage.BackupPayloadFile
import com.smsvault.core.cloudstorage.CloudStorageProvider
import com.smsvault.core.cloudstorage.impl.LocalStorageProvider
import com.smsvault.core.data.db.SmsVaultDatabase
import com.smsvault.core.data.db.entities.BackupRecordEntity
import com.smsvault.core.data.db.entities.toDomain
import com.smsvault.core.data.firestore.FirestoreSyncManager
import com.smsvault.core.domain.model.ContentType
import com.smsvault.core.domain.model.ProviderId
import java.io.File
import java.text.SimpleDateFormat
import java.util.*

/**
 * Step 4 (final): Uploads the encrypted file(s) to the target CloudStorageProvider,
 * then saves the BackupRecord(s) to Room and cleans up the staging file.
 */
class UploadWorker(
    context: Context,
    params: WorkerParameters,
) : CoroutineWorker(context, params) {

    companion object {
        const val KEY_PROVIDER_ID = "provider_id"
        const val KEY_BACKUP_ID = "backup_id"
    }

    override suspend fun doWork(): Result {
        val encryptedPaths = inputData.getStringArray(EncryptWorker.KEY_ENCRYPTED_FILE_PATHS)
            ?: return Result.failure(workDataOf("error" to "Missing encrypted file paths"))
        val checksums = inputData.getStringArray(TransformWorker.KEY_CHECKSUMS) ?: emptyArray()
        val itemCounts = inputData.getIntArray(TransformWorker.KEY_ITEM_COUNTS) ?: intArrayOf()
        val contentTypes = inputData.getStringArray(TransformWorker.KEY_CONTENT_TYPES) ?: emptyArray()
        val fileSizes = inputData.getLongArray(EncryptWorker.KEY_FILE_SIZES) ?: longArrayOf()
        
        val encrypt = inputData.getBoolean(EncryptWorker.KEY_ENCRYPT, true)

        val localProvider = LocalStorageProvider(applicationContext)
        val backupRecordDao = SmsVaultDatabase.getInstance(applicationContext).backupRecordDao()
        
        val providerIdStr = inputData.getString(KEY_PROVIDER_ID) ?: ProviderId.LOCAL.name
        val providerId = ProviderId.valueOf(providerIdStr)

        val gdriveProvider = com.smsvault.core.cloudstorage.impl.GoogleDriveProvider(applicationContext)
        val cloudProvider: CloudStorageProvider? = when (providerId) {
            ProviderId.GOOGLE_DRIVE -> gdriveProvider
            else -> null
        }
        
        val timestamp = SimpleDateFormat("yyyyMMdd", Locale.US).format(Date())
        val fullTimestamp = SimpleDateFormat("yyyyMMdd-HHmmss", Locale.US).format(Date())
        val backupIds = mutableListOf<String>()

        for (i in encryptedPaths.indices) {
            val encryptedPath = encryptedPaths[i]
            val encFile = File(encryptedPath)
            
            val checksum = if (i < checksums.size) checksums[i] else ""
            val itemCount = if (i < itemCounts.size) itemCounts[i] else 0
            val contentTypeStr = if (i < contentTypes.size) contentTypes[i] else ContentType.COMBINED.name
            val contentType = ContentType.valueOf(contentTypeStr)
            val fileSize = if (i < fileSizes.size) fileSizes[i] else encFile.length()

            setProgress(workDataOf("STEP" to "UPLOADING", ExtractWorker.PROGRESS_STAGE to "Uploading ${contentType.name} to ${providerId.name}", "PROCESSED_ITEMS" to itemCount, "TOTAL_ITEMS" to itemCount))

            val ext = if (encrypt) {
                "${contentType.name.lowercase()}-$fullTimestamp.json.enc"
            } else {
                val prefix = if (contentType == ContentType.SMS) "sms" else if (contentType == ContentType.CALL_LOG) "calls" else "backup"
                "${prefix}_${timestamp}.xml"
            }

            val payloadFile = BackupPayloadFile(fileName = ext, data = encFile.readBytes())
            encFile.delete()

            val localUploadResult = localProvider.upload(payloadFile)
            val localHandle = localUploadResult.getOrElse { return Result.failure(workDataOf("error" to "Local storage write failed: ${it.message}")) }

            var remoteFileId: String? = null
            if (cloudProvider != null && cloudProvider.isAuthorized()) {
                val remoteResult = cloudProvider.upload(payloadFile)
                remoteFileId = remoteResult.getOrNull()?.id
            }

            val backupId = UUID.randomUUID().toString()
            backupIds.add(backupId)
            
            val entity = BackupRecordEntity(
                id = backupId,
                provider = providerId.name,
                remoteFileId = remoteFileId,
                localPath = localHandle.id,
                fileName = localHandle.name,
                contentType = contentType.name,
                itemCount = itemCount,
                sizeBytes = fileSize,
                encrypted = encrypt,
                createdAtEpochMs = System.currentTimeMillis(),
                checksumSha256 = checksum,
            )
            backupRecordDao.insert(entity)
            val allBackups = backupRecordDao.observeAll().first()
            val oldBackups = allBackups.filter { it.provider == providerId.name && it.contentType == contentType.name && it.id != backupId }
            for (oldBackup in oldBackups) {
                if (providerId == com.smsvault.core.domain.model.ProviderId.LOCAL) {
                    localProvider.delete(com.smsvault.core.cloudstorage.RemoteFileHandle(id = oldBackup.localPath ?: "", name = "", provider = providerId, sizeBytes = 0, createdAtMs = 0))
                } else if (cloudProvider != null) {
                    cloudProvider.delete(com.smsvault.core.cloudstorage.RemoteFileHandle(id = oldBackup.remoteFileId ?: "", name = "", provider = providerId, sizeBytes = 0, createdAtMs = 0))
                }
                backupRecordDao.deleteById(oldBackup.id)
            }

            runCatching {
                FirestoreSyncManager().syncCurrentBackupMetadata(entity.toDomain())
            }
        }

        return Result.success(workDataOf(KEY_BACKUP_ID to backupIds.joinToString(",")))
    }
}
