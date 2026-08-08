package com.smsvault.feature.settings

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.smsvault.core.data.datastore.SmsVaultPreferences
import com.smsvault.core.domain.model.UiStyle
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
    val uiStyle: UiStyle = UiStyle.MATERIAL_YOU,
)

class SettingsViewModel(
    private val prefs: SmsVaultPreferences
) : ViewModel() {

    val uiState: StateFlow<SettingsUiState> = combine(
        prefs.observeAesEnabled(),
        prefs.observeRequireCharging(),
        prefs.observeWifiOnly(),
        prefs.observeThemeMode(),
        prefs.observeUiStyle()
    ) { aesEnabled, chargingOnly, wifiOnly, themeMode, uiStyle ->
        SettingsUiState(
            aesEnabled = aesEnabled,
            chargingOnly = chargingOnly,
            wifiOnly = wifiOnly,
            isDarkTheme = themeMode == ThemeMode.DARK || themeMode == ThemeMode.SYSTEM,
            uiStyle = uiStyle
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

    fun setUiStyle(style: UiStyle) {
        viewModelScope.launch { prefs.setUiStyle(style) }
    }

    fun toggleTheme() {
        viewModelScope.launch {
            val currentMode = uiState.value.isDarkTheme
            prefs.setThemeMode(if (currentMode) ThemeMode.LIGHT else ThemeMode.DARK)
        }
    }
}
