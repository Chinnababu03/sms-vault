package com.smsvault.core.data.db.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.smsvault.core.data.db.entities.ProviderAccountEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface ProviderAccountDao {
    @Query("SELECT * FROM provider_accounts")
    fun observeAll(): Flow<List<ProviderAccountEntity>>

    @Query("SELECT * FROM provider_accounts WHERE provider = :provider LIMIT 1")
    suspend fun getByProvider(provider: String): ProviderAccountEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(entity: ProviderAccountEntity)

    @Query("DELETE FROM provider_accounts WHERE provider = :provider")
    suspend fun deleteByProvider(provider: String)
}
