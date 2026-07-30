package com.smsvault.core.data.db.entities

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.smsvault.core.domain.model.ProviderId
import com.smsvault.core.domain.model.ProviderAccount

@Entity(tableName = "provider_accounts")
data class ProviderAccountEntity(
    @PrimaryKey val provider: String,    // ProviderId.name()
    val accountLabel: String,
    val isAuthorized: Boolean,
    val linkedAtEpochMs: Long,
)

fun ProviderAccountEntity.toDomain() = ProviderAccount(
    provider = ProviderId.valueOf(provider),
    accountLabel = accountLabel,
    isAuthorized = isAuthorized,
    linkedAtEpochMs = linkedAtEpochMs,
)

fun ProviderAccount.toEntity() = ProviderAccountEntity(
    provider = provider.name,
    accountLabel = accountLabel,
    isAuthorized = isAuthorized,
    linkedAtEpochMs = linkedAtEpochMs,
)
