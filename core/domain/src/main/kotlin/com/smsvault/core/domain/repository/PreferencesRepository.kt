package com.smsvault.core.domain.repository

import kotlinx.coroutines.flow.Flow

enum class ThemeMode { LIGHT, DARK, SYSTEM }

interface PreferencesRepository {
    fun observeThemeMode(): Flow<ThemeMode>
    suspend fun setThemeMode(mode: ThemeMode)
    fun observeDynamicColorEnabled(): Flow<Boolean>
    suspend fun setDynamicColorEnabled(enabled: Boolean)
    fun observeKeepScreenOn(): Flow<Boolean>
    suspend fun setKeepScreenOn(enabled: Boolean)
    fun observeBiometricLockEnabled(): Flow<Boolean>
    suspend fun setBiometricLockEnabled(enabled: Boolean)
    fun observePassphraseSet(): Flow<Boolean>
    suspend fun setPassphraseSet(isSet: Boolean)
    fun observeLastSuccessfulBackupEpochMs(): Flow<Long?>
    suspend fun setLastSuccessfulBackupEpochMs(epochMs: Long)
    fun observeAnalyticsEnabled(): Flow<Boolean>
    suspend fun setAnalyticsEnabled(enabled: Boolean)
    fun observeUiStyle(): Flow<com.smsvault.core.domain.model.UiStyle>
    suspend fun setUiStyle(style: com.smsvault.core.domain.model.UiStyle)
}

