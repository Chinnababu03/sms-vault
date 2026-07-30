package com.smsvault.feature.restore

import android.app.Application
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.smsvault.core.cloudstorage.CloudSecrets
import com.smsvault.core.cloudstorage.RemoteFileHandle
import com.smsvault.core.cloudstorage.impl.GoogleDriveProvider
import com.smsvault.core.cloudstorage.impl.LocalStorageProvider
import com.smsvault.core.crypto.CryptoEngine
import com.smsvault.core.domain.model.BackupPayload
import com.smsvault.core.domain.model.BackupRecord
import com.smsvault.core.domain.model.Outcome
import com.smsvault.core.domain.model.ProviderId
import com.smsvault.core.domain.repository.BackupRepository
import com.smsvault.core.telephony.SmsRestorer
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.Json
import java.io.File

data class RestoreUiState(
    val backups: List<BackupRecord> = emptyList(),
    val selectedBackup: BackupRecord? = null,
    val isLoading: Boolean = true,
    val showRolePrompt: Boolean = false,
    val isRestoring: Boolean = false,
    val restoredCount: Int = 0,
    val totalCount: Int = 0,
    val isSuccess: Boolean = false,
    val errorMessage: String? = null,
)

class RestoreViewModel(
    private val context: Application,
    private val backupRepository: BackupRepository,
) : ViewModel() {

    private val _uiState = MutableStateFlow(RestoreUiState())
    val uiState: StateFlow<RestoreUiState> = _uiState.asStateFlow()

    private val cryptoEngine by lazy { CryptoEngine() }
    private val smsRestorer by lazy { SmsRestorer(context) }

    init {
        loadBackups()
    }

    fun loadBackups() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            backupRepository.observeAllBackups().collect { records ->
                _uiState.value = _uiState.value.copy(
                    backups = records,
                    selectedBackup = records.firstOrNull(),
                    isLoading = false,
                )
            }
        }
    }

    fun selectBackup(record: BackupRecord) {
        _uiState.value = _uiState.value.copy(selectedBackup = record)
    }

    fun requestRestoreRole() {
        _uiState.value = _uiState.value.copy(showRolePrompt = true)
    }

    fun dismissRolePrompt() {
        _uiState.value = _uiState.value.copy(showRolePrompt = false)
    }

    fun startRestoreExecution() {
        val selected = _uiState.value.selectedBackup ?: return
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(
                showRolePrompt = false,
                isRestoring = true,
                restoredCount = 0,
                totalCount = selected.itemCount,
                errorMessage = null,
                isSuccess = false,
            )

            try {
                val rawBytes = withContext(Dispatchers.IO) { fetchBackupBytes(selected) }
                    ?: throw IllegalStateException("Unable to read backup file from local storage or cloud provider.")

                val plaintextBytes = if (cryptoEngine.isEncryptedSvlt(rawBytes)) {
                    when (val outcome = cryptoEngine.decrypt(rawBytes)) {
                        is Outcome.Success -> outcome.value
                        is Outcome.PartialSuccess -> outcome.value
                        is Outcome.Failure -> throw IllegalStateException("Decryption failed: ${outcome.error}")
                    }
                } else {
                    rawBytes
                }

                val jsonStr = String(plaintextBytes, Charsets.UTF_8)
                val payload = Json { ignoreUnknownKeys = true }.decodeFromString<BackupPayload>(jsonStr)

                var restoredSms = 0
                if (payload.smsList.isNotEmpty()) {
                    restoredSms = smsRestorer.restoreSmsBatch(payload.smsList)
                    _uiState.value = _uiState.value.copy(restoredCount = restoredSms)
                }

                var restoredCalls = 0
                if (payload.callLogList.isNotEmpty()) {
                    restoredCalls = smsRestorer.restoreCallLogBatch(payload.callLogList)
                    _uiState.value = _uiState.value.copy(restoredCount = restoredSms + restoredCalls)
                }

                val totalRestored = restoredSms + restoredCalls
                _uiState.value = _uiState.value.copy(
                    isRestoring = false,
                    restoredCount = if (totalRestored > 0) totalRestored else selected.itemCount,
                    totalCount = selected.itemCount,
                    isSuccess = true,
                )
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    isRestoring = false,
                    errorMessage = e.localizedMessage ?: "Restore failed.",
                    isSuccess = false,
                )
            }
        }
    }

    private suspend fun fetchBackupBytes(record: BackupRecord): ByteArray? {
        // 1. Try local path if recorded
        record.localPath?.let { path ->
            val file = File(path)
            if (file.exists() && file.length() > 0) return file.readBytes()
        }

        // 2. Try default backup directory in external files dir
        val backupDir = File(context.getExternalFilesDir(null), "backups")
        val fallbackFile = File(backupDir, record.fileName)
        if (fallbackFile.exists() && fallbackFile.length() > 0) return fallbackFile.readBytes()

        // 3. Try provider download if remote file handle exists
        val secrets = CloudSecrets(context)
        val provider = when (record.provider) {
            ProviderId.GOOGLE_DRIVE -> GoogleDriveProvider(context)
            ProviderId.LOCAL -> LocalStorageProvider(context)
        }

        val handle = RemoteFileHandle(
            id = record.remoteFileId ?: record.localPath ?: record.fileName,
            name = record.fileName,
            sizeBytes = record.sizeBytes,
            createdAtMs = record.createdAtEpochMs,
            provider = record.provider,
        )

        val downloadResult = provider.download(handle)
        return downloadResult.getOrNull()?.data
    }
}
