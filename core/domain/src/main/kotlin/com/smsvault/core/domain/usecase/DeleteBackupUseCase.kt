package com.smsvault.core.domain.usecase

import com.smsvault.core.domain.model.AppError
import com.smsvault.core.domain.model.BackupId
import com.smsvault.core.domain.model.BackupLocation
import com.smsvault.core.domain.model.Outcome
import com.smsvault.core.domain.repository.BackupRepository

class DeleteBackupUseCase(
    private val repository: BackupRepository,
) {
    suspend operator fun invoke(id: BackupId, location: BackupLocation): Outcome<Unit> {
        return repository.deleteBackup(id, location).fold(
            onSuccess = { Outcome.Success(Unit) },
            onFailure = { Outcome.Failure(AppError.Unknown(it)) }
        )
    }
}
