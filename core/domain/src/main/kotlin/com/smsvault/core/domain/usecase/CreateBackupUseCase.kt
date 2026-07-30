package com.smsvault.core.domain.usecase

import com.smsvault.core.domain.model.BackupRecord
import com.smsvault.core.domain.model.BackupSpec
import com.smsvault.core.domain.model.Outcome
import com.smsvault.core.domain.repository.BackupRepository

class CreateBackupUseCase(
    private val repository: BackupRepository,
) {
    suspend operator fun invoke(spec: BackupSpec): Outcome<BackupRecord> {
        return try {
            val result = repository.saveBackupRecord(
                BackupRecord(
                    id = java.util.UUID.randomUUID().toString(),
                    provider = spec.targetProviders.firstOrNull() ?: com.smsvault.core.domain.model.ProviderId.LOCAL,
                    remoteFileId = null,
                    localPath = null,
                    fileName = "", // populated by worker chain
                    contentType = spec.contentType,
                    itemCount = 0, // populated by worker chain
                    sizeBytes = 0L,
                    encrypted = spec.encrypt,
                    createdAtEpochMs = System.currentTimeMillis(),
                    checksumSha256 = "",
                )
            )
            result.fold(
                onSuccess = { Outcome.Success(BackupRecord("", spec.targetProviders.firstOrNull() ?: com.smsvault.core.domain.model.ProviderId.LOCAL, null, null, "", spec.contentType, 0, 0L, spec.encrypt, System.currentTimeMillis(), "")) },
                onFailure = { Outcome.Failure(com.smsvault.core.domain.model.AppError.Unknown(it)) }
            )
        } catch (e: Exception) {
            Outcome.Failure(com.smsvault.core.domain.model.AppError.Unknown(e))
        }
    }
}
