package com.smsvault.feature.settings

import android.app.Application
import android.content.Context
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.android.gms.auth.api.signin.GoogleSignInAccount
import com.google.android.gms.auth.api.signin.GoogleSignInOptions
import com.google.android.gms.common.api.Scope
import com.smsvault.core.cloudstorage.CloudSecrets
import com.smsvault.core.cloudstorage.impl.GoogleDriveProvider
import com.smsvault.core.data.datastore.SmsVaultPreferences
import com.smsvault.core.domain.model.ProviderId
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import com.google.android.gms.auth.GoogleAuthUtil

class CloudIntegrationViewModel(
    application: Application,
    private val gdriveProvider: GoogleDriveProvider,
    private val prefs: SmsVaultPreferences,
    private val cloudSecrets: CloudSecrets
) : AndroidViewModel(application) {

    private val _uiState = MutableStateFlow(CloudIntegrationUiState())
    val uiState: StateFlow<CloudIntegrationUiState> = _uiState.asStateFlow()

    init {
        checkStatus()
    }

    private fun checkStatus() {
        viewModelScope.launch {
            val isDriveConnected = gdriveProvider.isAuthorized()
            _uiState.value = _uiState.value.copy(googleDriveConnected = isDriveConnected)
        }
    }

    fun handleSignInResult(account: GoogleSignInAccount?) {
        if (account == null) {
            _uiState.value = _uiState.value.copy(googleDriveConnected = false, error = "Sign-in failed")
            return
        }

        viewModelScope.launch(Dispatchers.IO) {
            try {
                // Get the OAuth access token for Drive API
                val scopes = "oauth2:${"https://www.googleapis.com/auth/drive.appdata"}"
                val token = GoogleAuthUtil.getToken(getApplication(), account.account!!, scopes)
                
                gdriveProvider.storeTokens(token, null)
                
                _uiState.value = _uiState.value.copy(googleDriveConnected = true, error = null)
            } catch (e: Exception) {
                val errorMsg = if (e is com.google.android.gms.auth.GoogleAuthException) {
                    "Cloud Console OAuth setup missing. Android Client ID with SHA-1 is required."
                } else {
                    e.message ?: "Failed to connect"
                }
                _uiState.value = _uiState.value.copy(googleDriveConnected = false, error = errorMsg)
                gdriveProvider.clearTokens()
            }
        }
    }

    fun disconnectDrive() {
        viewModelScope.launch(Dispatchers.IO) {
            gdriveProvider.clearTokens()
            
            val signInClient = GoogleSignIn.getClient(getApplication<Application>(), GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN).build())
            signInClient.signOut()
            
            
            _uiState.value = _uiState.value.copy(googleDriveConnected = false)
        }
    }

    fun clearError() {
        _uiState.value = _uiState.value.copy(error = null)
    }
}

data class CloudIntegrationUiState(
    val googleDriveConnected: Boolean = false,
    val localConnected: Boolean = true,
    val error: String? = null
)
