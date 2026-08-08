package com.smsvault.core.data.datastore

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.longPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.smsvault.core.domain.repository.ThemeMode
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "smsvault_prefs")

object PrefKeys {
    val THEME_MODE = stringPreferencesKey("pref_theme_mode")
    val DYNAMIC_COLOR_ENABLED = booleanPreferencesKey("pref_dynamic_color_enabled")
    val KEEP_SCREEN_ON = booleanPreferencesKey("pref_keep_screen_on")
    val BIOMETRIC_LOCK_ENABLED = booleanPreferencesKey("pref_biometric_lock_enabled")
    val PASSPHRASE_SET = booleanPreferencesKey("pref_passphrase_set")
    val ANALYTICS_ENABLED = booleanPreferencesKey("pref_analytics_enabled")
    val LAST_SUCCESSFUL_BACKUP_EPOCH_MS = longPreferencesKey("pref_last_successful_backup_epoch_ms")
    
    val AES_ENABLED = booleanPreferencesKey("pref_aes_enabled")
    val REQUIRE_CHARGING = booleanPreferencesKey("pref_require_charging")
    val WIFI_ONLY = booleanPreferencesKey("pref_wifi_only")
    val UI_STYLE = stringPreferencesKey("pref_ui_style")
}

@Singleton
class SmsVaultPreferences @Inject constructor(
    @ApplicationContext private val context: Context,
) {
    private val dataStore = context.dataStore

    fun observeThemeMode(): Flow<ThemeMode> = dataStore.data.map { prefs ->
        prefs[PrefKeys.THEME_MODE]?.let { ThemeMode.valueOf(it) } ?: ThemeMode.SYSTEM
    }
    suspend fun setThemeMode(mode: ThemeMode) {
        dataStore.edit { it[PrefKeys.THEME_MODE] = mode.name }
    }

    fun observeDynamicColorEnabled(): Flow<Boolean> = dataStore.data.map { prefs ->
        prefs[PrefKeys.DYNAMIC_COLOR_ENABLED] ?: false
    }
    suspend fun setDynamicColorEnabled(enabled: Boolean) {
        dataStore.edit { it[PrefKeys.DYNAMIC_COLOR_ENABLED] = enabled }
    }

    fun observeKeepScreenOn(): Flow<Boolean> = dataStore.data.map { prefs ->
        prefs[PrefKeys.KEEP_SCREEN_ON] ?: true
    }
    suspend fun setKeepScreenOn(enabled: Boolean) {
        dataStore.edit { it[PrefKeys.KEEP_SCREEN_ON] = enabled }
    }

    fun observeBiometricLockEnabled(): Flow<Boolean> = dataStore.data.map { prefs ->
        prefs[PrefKeys.BIOMETRIC_LOCK_ENABLED] ?: false
    }
    suspend fun setBiometricLockEnabled(enabled: Boolean) {
        dataStore.edit { it[PrefKeys.BIOMETRIC_LOCK_ENABLED] = enabled }
    }

    fun observePassphraseSet(): Flow<Boolean> = dataStore.data.map { prefs ->
        prefs[PrefKeys.PASSPHRASE_SET] ?: false
    }
    suspend fun setPassphraseSet(isSet: Boolean) {
        dataStore.edit { it[PrefKeys.PASSPHRASE_SET] = isSet }
    }

    fun observeAnalyticsEnabled(): Flow<Boolean> = dataStore.data.map { prefs ->
        prefs[PrefKeys.ANALYTICS_ENABLED] ?: false
    }
    suspend fun setAnalyticsEnabled(enabled: Boolean) {
        dataStore.edit { it[PrefKeys.ANALYTICS_ENABLED] = enabled }
    }

    fun observeLastSuccessfulBackupEpochMs(): Flow<Long?> = dataStore.data.map { prefs ->
        prefs[PrefKeys.LAST_SUCCESSFUL_BACKUP_EPOCH_MS]
    }
    suspend fun setLastSuccessfulBackupEpochMs(epochMs: Long) {
        dataStore.edit { it[PrefKeys.LAST_SUCCESSFUL_BACKUP_EPOCH_MS] = epochMs }
    }
    
    fun observeAesEnabled(): Flow<Boolean> = dataStore.data.map { prefs ->
        prefs[PrefKeys.AES_ENABLED] ?: true
    }
    suspend fun setAesEnabled(enabled: Boolean) {
        dataStore.edit { it[PrefKeys.AES_ENABLED] = enabled }
    }
    
    fun observeRequireCharging(): Flow<Boolean> = dataStore.data.map { prefs ->
        prefs[PrefKeys.REQUIRE_CHARGING] ?: true
    }
    suspend fun setRequireCharging(enabled: Boolean) {
        dataStore.edit { it[PrefKeys.REQUIRE_CHARGING] = enabled }
    }
    
    fun observeWifiOnly(): Flow<Boolean> = dataStore.data.map { prefs ->
        prefs[PrefKeys.WIFI_ONLY] ?: true
    }
    suspend fun setWifiOnly(enabled: Boolean) {
        dataStore.edit { it[PrefKeys.WIFI_ONLY] = enabled }
    }

    fun observeUiStyle(): Flow<com.smsvault.core.domain.model.UiStyle> = dataStore.data.map { prefs ->
        prefs[PrefKeys.UI_STYLE]?.let {
            runCatching { com.smsvault.core.domain.model.UiStyle.valueOf(it) }.getOrNull()
        } ?: com.smsvault.core.domain.model.UiStyle.MATERIAL_YOU
    }
    suspend fun setUiStyle(style: com.smsvault.core.domain.model.UiStyle) {
        dataStore.edit { it[PrefKeys.UI_STYLE] = style.name }
    }
}

