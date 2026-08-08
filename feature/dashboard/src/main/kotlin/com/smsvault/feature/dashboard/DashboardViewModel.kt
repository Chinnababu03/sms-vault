package com.smsvault.feature.dashboard

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.smsvault.core.domain.model.BackupRecord
import com.smsvault.core.domain.model.ScheduleConfig
import com.smsvault.core.domain.repository.AuthRepository
import com.smsvault.core.domain.repository.BackupRepository
import com.smsvault.core.domain.repository.ScheduleRepository
import com.smsvault.core.telephony.TelephonyReader
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

data class DashboardUiState(
    val smsCount: Int = 0,
    val callLogCount: Int = 0,
    val backups: List<BackupRecord> = emptyList(),
    val schedule: ScheduleConfig? = null,
    val userEmail: String = "Guest User",
    val isEncrypted: Boolean = true,
    val isLoading: Boolean = false,
    val showDuplicateWarning: Boolean = false,
    val showScheduleDialog: Boolean = false,
)

class DashboardViewModel(
    private val backupRepository: BackupRepository,
    private val scheduleRepository: ScheduleRepository,
    private val telephonyReader: TelephonyReader,
    private val authRepository: AuthRepository,
    private val backupCoordinator: com.smsvault.core.workmanager.BackupCoordinator,
) : ViewModel() {

    private val _uiState = MutableStateFlow(DashboardUiState())
    val uiState: StateFlow<DashboardUiState> = _uiState.asStateFlow()

    private var currentUserIdentifier: String? = null
    private var lastBackupTimestampForCurrentUser: Long = 0L

    init {
        refreshCounts()

        viewModelScope.launch {
            runCatching { backupRepository.syncFromFirestore() }
        }

        viewModelScope.launch {
            backupRepository.observeAllBackups().collect { backups ->
                _uiState.value = _uiState.value.copy(backups = backups)
            }
        }

        viewModelScope.launch {
            scheduleRepository.observeSchedule().collect { schedule ->
                _uiState.value = _uiState.value.copy(schedule = schedule)
            }
        }

        viewModelScope.launch {
            authRepository.observeAuthState().collect { user ->
                val newIdentifier = user?.email?.ifBlank { user.uid } ?: user?.uid
                if (newIdentifier != currentUserIdentifier) {
                    currentUserIdentifier = newIdentifier
                    lastBackupTimestampForCurrentUser = 0L // Reset when logging in with new/different account!
                }
                _uiState.value = _uiState.value.copy(
                    userEmail = user?.displayName?.ifBlank { user.email } ?: user?.email ?: "Guest User"
                )
            }
        }
    }

    fun deleteBackup(record: BackupRecord) {
        viewModelScope.launch {
            val location = com.smsvault.core.domain.model.BackupLocation(
                provider = record.provider,
            )
            backupRepository.deleteBackup(com.smsvault.core.domain.model.BackupId(record.id), location)
        }
    }

    fun onBackupClicked(onNavigateToBackup: () -> Unit) {
        val now = System.currentTimeMillis()
        // Only show duplicate warning if current account made a backup in this session within the last 5 minutes
        if (lastBackupTimestampForCurrentUser > 0L && (now - lastBackupTimestampForCurrentUser) < 5 * 60 * 1000) {
            _uiState.value = _uiState.value.copy(showDuplicateWarning = true)
        } else {
            lastBackupTimestampForCurrentUser = now
            onNavigateToBackup()
        }
    }

    fun dismissDuplicateWarning() {
        _uiState.value = _uiState.value.copy(showDuplicateWarning = false)
    }
    
    fun showScheduleDialog() { _uiState.value = _uiState.value.copy(showScheduleDialog = true) }
    fun dismissScheduleDialog() { _uiState.value = _uiState.value.copy(showScheduleDialog = false) }
    fun confirmDuplicateBackup(onNavigateToBackup: () -> Unit) {
        _uiState.value = _uiState.value.copy(showDuplicateWarning = false)
        lastBackupTimestampForCurrentUser = System.currentTimeMillis()
        onNavigateToBackup()
    }

    fun updateSchedule(cadence: com.smsvault.core.domain.model.Cadence?) {
        viewModelScope.launch {
            if (cadence == null) {
                _uiState.value.schedule?.let { scheduleRepository.deleteSchedule(it.id)
                backupCoordinator.cancelScheduledBackup() }
            } else {
                val newConfig = com.smsvault.core.domain.model.ScheduleConfig(
                    id = _uiState.value.schedule?.id ?: java.util.UUID.randomUUID().toString(),
                    cadence = cadence,
                    requiresCharging = true,
                    requiresUnmeteredNetwork = true,
                    includeMessages = true,
                    includeCallLogs = true,
                    targetProviders = listOf(com.smsvault.core.domain.model.ProviderId.LOCAL),
                    isEnabled = true,
                )
                scheduleRepository.saveSchedule(newConfig)
                backupCoordinator.enqueuePeriodicBackup(
                    spec = com.smsvault.core.domain.model.BackupSpec(
                        targetProviders = newConfig.targetProviders,
                        includeMessages = newConfig.includeMessages,
                        includeCallLogs = newConfig.includeCallLogs,
                        encrypt = true,
                        passphrase = ""
                    ),
                    requiresCharging = newConfig.requiresCharging,
                    requiresUnmeteredNetwork = newConfig.requiresUnmeteredNetwork,
                    intervalDays = if (cadence == com.smsvault.core.domain.model.Cadence.DAILY) 1L else if (cadence == com.smsvault.core.domain.model.Cadence.WEEKLY) 7L else 30L
                )
            }
        }
    }

    fun refreshCounts() {
        viewModelScope.launch {
            val sms = telephonyReader.getSmsCount()
            val calls = telephonyReader.getCallLogCount()
            _uiState.value = _uiState.value.copy(smsCount = sms, callLogCount = calls)
        }
    }
}
