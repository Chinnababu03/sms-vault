package com.smsvault.feature.transfer

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class Device(val id: String, val name: String)

data class TransferUiState(
    val isScanning: Boolean = true,
    val devices: List<Device> = emptyList(),
    val selectedDevice: Device? = null,
    val isTransferring: Boolean = false,
    val progress: Float = 0f,
    val isSuccess: Boolean = false,
    val statusText: String = "Scanning for nearby devices..."
)

class TransferViewModel : ViewModel() {

    private val _uiState = MutableStateFlow(TransferUiState())
    val uiState: StateFlow<TransferUiState> = _uiState.asStateFlow()
    
    init {
        startScan()
    }

    fun startScan() {
        viewModelScope.launch {
            _uiState.value = TransferUiState(isScanning = true, statusText = "Scanning for nearby devices...")
            delay(2000)
            _uiState.value = _uiState.value.copy(
                isScanning = false,
                devices = listOf(
                    Device("dev1", "Pixel 8 Pro - SMS Vault"),
                    Device("dev2", "Galaxy S23 - SMS Vault")
                ),
                statusText = "Select a device to transfer vault"
            )
        }
    }
    
    fun selectDevice(device: Device) {
        _uiState.value = _uiState.value.copy(selectedDevice = device)
    }

    fun startTransfer() {
        val targetDevice = _uiState.value.selectedDevice?.name ?: "Device"
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isTransferring = true, progress = 0.1f, statusText = "Establishing Wi-Fi Direct Socket with \$targetDevice...")
            delay(1500)
            _uiState.value = _uiState.value.copy(progress = 0.3f, statusText = "Extracting & Encrypting Data...")
            delay(1500)
            _uiState.value = _uiState.value.copy(progress = 0.6f, statusText = "Streaming Encrypted Payload...")
            delay(2000)
            _uiState.value = _uiState.value.copy(progress = 1.0f, statusText = "Transfer Complete to \$targetDevice!", isSuccess = true)
        }
    }
}
