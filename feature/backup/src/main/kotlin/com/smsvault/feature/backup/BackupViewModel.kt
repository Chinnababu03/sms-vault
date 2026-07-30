package com.smsvault.feature.backup

import android.app.Application
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.work.WorkInfo
import com.smsvault.core.domain.model.BackupSpec
import com.smsvault.core.domain.model.ProviderId
import com.smsvault.core.workmanager.BackupCoordinator
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch

data class BackupOperationUiState(
    val isRunning: Boolean = false,
    val stageText: String = "Initializing backup engine...",
    val progressFraction: Float = 0f,
    val processedItems: Int = 0,
    val totalItems: Int = 0,
    val isSuccess: Boolean = false,
    val errorMessage: String? = null,
)

class BackupViewModel(
    private val application: Application,
    private val backupCoordinator: BackupCoordinator,
    private val prefs: com.smsvault.core.data.datastore.SmsVaultPreferences,
) : ViewModel() {

    private val _uiState = MutableStateFlow(BackupOperationUiState())
    val uiState: StateFlow<BackupOperationUiState> = _uiState.asStateFlow()

    fun startBackup(providerId: ProviderId = ProviderId.GOOGLE_DRIVE) {
        viewModelScope.launch {
            val aesEnabled = prefs.observeAesEnabled().first()
            val spec = BackupSpec(
                includeMessages = true,
                includeCallLogs = true,
                targetProviders = listOf(providerId, ProviderId.LOCAL),
                encrypt = aesEnabled,
            )

            _uiState.value = BackupOperationUiState(
                isRunning = true,
                stageText = "Extracting SMS & Call Logs from device...",
                progressFraction = 0.1f,
            )

            try {
                backupCoordinator.triggerBackup(spec)

                backupCoordinator.observeBackupWork().collect { workInfoList ->
                    if (workInfoList.isEmpty()) return@collect

                    val activeWork = workInfoList.firstOrNull { it.state == WorkInfo.State.RUNNING }
                        ?: workInfoList.lastOrNull() ?: return@collect

                    val progress = activeWork.progress
                    val step = progress.getString("STEP") ?: "PROCESSING"
                    val items = progress.getInt("PROCESSED_ITEMS", 0)
                    val total = progress.getInt("TOTAL_ITEMS", 0)

                    val isAllSucceeded = workInfoList.all { it.state == WorkInfo.State.SUCCEEDED }
                    val hasFailed = workInfoList.any { it.state == WorkInfo.State.FAILED }

                    if (isAllSucceeded) {
                        _uiState.value = BackupOperationUiState(
                            isRunning = false,
                            stageText = "Backup Successfully Encrypted & Saved!",
                            progressFraction = 1.0f,
                            processedItems = if (items > 0) items else total,
                            totalItems = total,
                            isSuccess = true,
                        )
                    } else if (hasFailed) {
                        val failedWork = workInfoList.firstOrNull { it.state == WorkInfo.State.FAILED }
                        _uiState.value = BackupOperationUiState(
                            isRunning = false,
                            stageText = "Backup Failed",
                            progressFraction = 0f,
                            errorMessage = failedWork?.outputData?.getString("error") ?: "WorkManager backup execution failed.",
                        )
                    } else {
                        val fraction = when (step) {
                            "EXTRACTING" -> 0.25f
                            "TRANSFORMING" -> 0.50f
                            "ENCRYPTING" -> 0.75f
                            "UPLOADING" -> 0.90f
                            else -> 0.30f
                        }
                        val stageMsg = when (step) {
                            "EXTRACTING" -> "Extracting device messages & call logs..."
                            "TRANSFORMING" -> "Building zero-knowledge JSON payload & SHA-256..."
                            "ENCRYPTING" -> "Encrypting payload with AES-256-GCM hardware key..."
                            "UPLOADING" -> "Syncing encrypted vault file to cloud storage..."
                            else -> "Processing backup..."
                        }
                        _uiState.value = _uiState.value.copy(
                            isRunning = true,
                            stageText = stageMsg,
                            progressFraction = fraction,
                            processedItems = items,
                            totalItems = total,
                        )
                    }
                }
            } catch (e: Exception) {
                _uiState.value = BackupOperationUiState(
                    isRunning = false,
                    stageText = "Backup Error",
                    errorMessage = e.localizedMessage ?: "Failed to start backup pipeline.",
                )
            }
        }
    }

    fun cancelBackup() {
        backupCoordinator.cancelBackup()
        _uiState.value = BackupOperationUiState(
            isRunning = false,
            stageText = "Backup Cancelled",
        )
    }
}
