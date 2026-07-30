package com.smsvault.core.domain.repository

import com.smsvault.core.domain.model.BackupId
import com.smsvault.core.domain.model.BackupLocation
import com.smsvault.core.domain.model.BackupRecord
import kotlinx.coroutines.flow.Flow

interface BackupRepository {
    fun observeBackups(location: BackupLocation): Flow<List<BackupRecord>>
    fun observeAllBackups(): Flow<List<BackupRecord>>
    suspend fun getBackupById(id: BackupId): BackupRecord?
    suspend fun saveBackupRecord(record: BackupRecord): Result<Unit>
    suspend fun deleteBackup(id: BackupId, location: BackupLocation): Result<Unit>
    suspend fun syncFromFirestore(): Result<Unit>
}
