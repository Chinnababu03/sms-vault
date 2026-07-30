package com.smsvault.core.data.db.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.smsvault.core.data.db.entities.BackupRecordEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface BackupRecordDao {
    @Query("SELECT * FROM backup_records ORDER BY createdAtEpochMs DESC")
    fun observeAll(): Flow<List<BackupRecordEntity>>

    @Query("SELECT * FROM backup_records WHERE provider = :provider ORDER BY createdAtEpochMs DESC")
    fun observeByProvider(provider: String): Flow<List<BackupRecordEntity>>

    @Query("SELECT * FROM backup_records WHERE id = :id LIMIT 1")
    suspend fun getById(id: String): BackupRecordEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(entity: BackupRecordEntity)

    @Query("DELETE FROM backup_records WHERE id = :id")
    suspend fun deleteById(id: String)

    @Query("DELETE FROM backup_records")
    suspend fun deleteAll()
}
