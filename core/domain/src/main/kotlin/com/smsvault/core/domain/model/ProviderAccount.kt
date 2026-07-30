package com.smsvault.core.domain.model

data class ProviderAccount(
    val provider: ProviderId,
    val accountLabel: String,
    val isAuthorized: Boolean,
    val linkedAtEpochMs: Long,
)
