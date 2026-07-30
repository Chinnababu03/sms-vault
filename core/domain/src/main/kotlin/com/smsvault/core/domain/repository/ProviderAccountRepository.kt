package com.smsvault.core.domain.repository

import com.smsvault.core.domain.model.ProviderId
import com.smsvault.core.domain.model.ProviderAccount
import kotlinx.coroutines.flow.Flow

interface ProviderAccountRepository {
    fun observeAccounts(): Flow<List<ProviderAccount>>
    suspend fun saveAccount(account: ProviderAccount): Result<Unit>
    suspend fun removeAccount(provider: ProviderId): Result<Unit>
    suspend fun isAuthorized(provider: ProviderId): Boolean
}
