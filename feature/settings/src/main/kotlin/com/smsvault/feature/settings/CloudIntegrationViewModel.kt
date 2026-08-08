package com.smsvault.feature.settings

import android.app.Application
import android.content.Context
import android.content.IntentSender
import android.util.Log
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.google.android.gms.auth.api.identity.AuthorizationRequest
import com.google.android.gms.auth.api.identity.Identity
import com.google.android.gms.common.api.Scope
import com.smsvault.core.cloudstorage.CloudSecrets
import com.smsvault.core.cloudstorage.impl.GoogleDriveProvider
import com.smsvault.core.data.datastore.SmsVaultPreferences
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class CloudIntegrationViewModel(
    application: Application,
    private val gdriveProvider: GoogleDriveProvider,
    private val prefs: SmsVaultPreferences,
    private val cloudSecrets: CloudSecrets
) : AndroidViewModel(application) {

    companion object {
        private const val TAG = "DriveAuth"
        private val DRIVE_FILE_SCOPE = Scope("https://www.googleapis.com/auth/drive.file")
    }

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

    fun requestDriveAuthorization(context: Context) {
        _uiState.value = _uiState.value.copy(isConnecting = true, error = null)

        val authRequest = AuthorizationRequest.builder()
            .setRequestedScopes(listOf(DRIVE_FILE_SCOPE))
            .build()

        Identity.getAuthorizationClient(context)
            .authorize(authRequest)
            .addOnSuccessListener { authResult ->
                val accessToken = authResult.accessToken
                if (accessToken != null) {
                    gdriveProvider.storeTokens(accessToken, null)
                    _uiState.value = _uiState.value.copy(
                        googleDriveConnected = true,
                        isConnecting = false,
                        error = null
                    )
                    Log.i(TAG, "Drive authorized directly (cached grant)")
                } else if (authResult.hasResolution()) {
                    val pendingIntent = authResult.pendingIntent
                    if (pendingIntent != null) {
                        _uiState.value = _uiState.value.copy(
                            pendingDriveAuthIntent = pendingIntent.intentSender
                        )
                        Log.i(TAG, "Drive consent / account picker resolution requested")
                    } else {
                        _uiState.value = _uiState.value.copy(
                            isConnecting = false,
                            error = "Authorization pending intent was null"
                        )
                    }
                } else {
                    _uiState.value = _uiState.value.copy(
                        isConnecting = false,
                        error = "Drive authorization failed: No resolution available"
                    )
                }
            }
            .addOnFailureListener { e ->
                Log.e(TAG, "Drive authorization request failed", e)
                _uiState.value = _uiState.value.copy(
                    isConnecting = false,
                    error = "Drive authorization error: ${e.localizedMessage ?: e.message}"
                )
            }
    }

    fun onDriveAuthResult(granted: Boolean, accessToken: String?, errorMsg: String? = null) {
        if (granted && accessToken != null) {
            gdriveProvider.storeTokens(accessToken, null)
            _uiState.value = _uiState.value.copy(
                googleDriveConnected = true,
                isConnecting = false,
                error = null
            )
            Log.i(TAG, "Drive permission granted, access token stored")
        } else {
            _uiState.value = _uiState.value.copy(
                googleDriveConnected = false,
                isConnecting = false,
                error = errorMsg
            )
            gdriveProvider.clearTokens()
        }
    }

    fun onDriveAuthCancelled() {
        _uiState.value = _uiState.value.copy(
            isConnecting = false,
            error = null
        )
    }

    fun disconnectDrive(context: Context) {
        viewModelScope.launch(Dispatchers.IO) {
            gdriveProvider.clearTokens()
            try {
                Identity.getSignInClient(context).signOut()
            } catch (e: Exception) {
                Log.w(TAG, "Sign-out error (non-fatal)", e)
            }
            _uiState.value = _uiState.value.copy(
                googleDriveConnected = false,
                pendingDriveAuthIntent = null
            )
        }
    }

    fun clearError() {
        _uiState.value = _uiState.value.copy(error = null)
    }

    fun clearPendingDriveAuthIntent() {
        _uiState.value = _uiState.value.copy(pendingDriveAuthIntent = null)
    }
}

data class CloudIntegrationUiState(
    val googleDriveConnected: Boolean = false,
    val localConnected: Boolean = true,
    val isConnecting: Boolean = false,
    val error: String? = null,
    val pendingDriveAuthIntent: IntentSender? = null,
)
