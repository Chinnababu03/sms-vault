package com.smsvault.feature.settings

import android.app.Application
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.smsvault.core.data.datastore.SmsVaultPreferences
import com.smsvault.core.domain.repository.ThemeMode
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

data class SettingsUiState(
    val aesEnabled: Boolean = true,
    val chargingOnly: Boolean = true,
    val wifiOnly: Boolean = true,
    val isDarkTheme: Boolean = true,
)

class SettingsViewModel(
    private val prefs: SmsVaultPreferences
) : ViewModel() {

    val uiState: StateFlow<SettingsUiState> = combine(
        prefs.observeAesEnabled(),
        prefs.observeRequireCharging(),
        prefs.observeWifiOnly(),
        prefs.observeThemeMode()
    ) { aesEnabled, chargingOnly, wifiOnly, themeMode ->
        SettingsUiState(
            aesEnabled = aesEnabled,
            chargingOnly = chargingOnly,
            wifiOnly = wifiOnly,
            isDarkTheme = themeMode == ThemeMode.DARK || themeMode == ThemeMode.SYSTEM
        )
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = SettingsUiState()
    )

    fun setAesEnabled(enabled: Boolean) {
        viewModelScope.launch { prefs.setAesEnabled(enabled) }
    }

    fun setRequireCharging(enabled: Boolean) {
        viewModelScope.launch { prefs.setRequireCharging(enabled) }
    }

    fun setWifiOnly(enabled: Boolean) {
        viewModelScope.launch { prefs.setWifiOnly(enabled) }
    }

    fun toggleTheme() {
        viewModelScope.launch {
            val currentMode = uiState.value.isDarkTheme
            prefs.setThemeMode(if (currentMode) ThemeMode.LIGHT else ThemeMode.DARK)
        }
    }
}
