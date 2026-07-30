package com.smsvault.core.data.repository

import com.smsvault.core.data.datastore.SmsVaultPreferences
import com.smsvault.core.domain.repository.PreferencesRepository
import com.smsvault.core.domain.repository.ThemeMode
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class PreferencesRepositoryImpl @Inject constructor(
    private val prefs: SmsVaultPreferences,
) : PreferencesRepository {
    override fun observeThemeMode(): Flow<ThemeMode> = prefs.observeThemeMode()
    override suspend fun setThemeMode(mode: ThemeMode) = prefs.setThemeMode(mode)
    override fun observeDynamicColorEnabled(): Flow<Boolean> = prefs.observeDynamicColorEnabled()
    override suspend fun setDynamicColorEnabled(enabled: Boolean) = prefs.setDynamicColorEnabled(enabled)
    override fun observeKeepScreenOn(): Flow<Boolean> = prefs.observeKeepScreenOn()
    override suspend fun setKeepScreenOn(enabled: Boolean) = prefs.setKeepScreenOn(enabled)
    override fun observeBiometricLockEnabled(): Flow<Boolean> = prefs.observeBiometricLockEnabled()
    override suspend fun setBiometricLockEnabled(enabled: Boolean) = prefs.setBiometricLockEnabled(enabled)
    override fun observePassphraseSet(): Flow<Boolean> = prefs.observePassphraseSet()
    override suspend fun setPassphraseSet(isSet: Boolean) = prefs.setPassphraseSet(isSet)
    override fun observeLastSuccessfulBackupEpochMs(): Flow<Long?> = prefs.observeLastSuccessfulBackupEpochMs()
    override suspend fun setLastSuccessfulBackupEpochMs(epochMs: Long) = prefs.setLastSuccessfulBackupEpochMs(epochMs)
    override fun observeAnalyticsEnabled(): Flow<Boolean> = prefs.observeAnalyticsEnabled()
    override suspend fun setAnalyticsEnabled(enabled: Boolean) = prefs.setAnalyticsEnabled(enabled)
}
