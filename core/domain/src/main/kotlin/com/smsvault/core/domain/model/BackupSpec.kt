package com.smsvault.core.domain.model

data class BackupSpec(
    val includeMessages: Boolean = true,
    val includeCallLogs: Boolean = true,
    val targetProviders: List<ProviderId>,
    val encrypt: Boolean = true,
    val passphrase: String? = null, // null = Keystore key only
    val contentType: ContentType = ContentType.COMBINED,
)
