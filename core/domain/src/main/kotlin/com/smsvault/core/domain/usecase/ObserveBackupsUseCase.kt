package com.smsvault.core.domain.usecase

import com.smsvault.core.domain.model.BackupLocation
import com.smsvault.core.domain.model.BackupRecord
import com.smsvault.core.domain.repository.BackupRepository
import kotlinx.coroutines.flow.Flow

class ObserveBackupsUseCase(
    private val repository: BackupRepository,
) {
    operator fun invoke(location: BackupLocation? = null): Flow<List<BackupRecord>> =
        if (location != null) repository.observeBackups(location)
        else repository.observeAllBackups()
}
