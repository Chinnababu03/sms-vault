package com.smsvault.feature.transfer

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.PhoneAndroid
import androidx.compose.material.icons.filled.WifiTethering
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.smsvault.core.ui.components.GlassCard
import com.smsvault.core.ui.components.VaultButton

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TransferScreen(
    onBack: () -> Unit,
    modifier: Modifier = Modifier,
    viewModel: TransferViewModel = viewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val primaryColor = MaterialTheme.colorScheme.primary

    Scaffold(
        modifier = modifier.fillMaxSize(),
        containerColor = MaterialTheme.colorScheme.background,
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = "P2P Direct Transfer",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold,
                    )
                },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(imageVector = Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = primaryColor)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.background),
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Spacer(modifier = Modifier.height(24.dp))
            Icon(
                imageVector = Icons.Default.WifiTethering,
                contentDescription = null,
                tint = primaryColor,
                modifier = Modifier.size(72.dp),
            )
            Spacer(modifier = Modifier.height(24.dp))
            
            Text(
                text = "Wi-Fi Direct Transfer",
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onBackground,
            )
            Spacer(modifier = Modifier.height(12.dp))
            
            if (uiState.isTransferring || uiState.isSuccess) {
                GlassCard(
                    modifier = Modifier.fillMaxWidth(),
                    cornerRadius = 24.dp,
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(24.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                    ) {
                        if (!uiState.isSuccess) {
                            CircularProgressIndicator(
                                progress = { uiState.progress },
                                color = primaryColor,
                                modifier = Modifier.size(64.dp),
                            )
                        } else {
                            Text(
                                text = "✅",
                                style = MaterialTheme.typography.displayMedium,
                            )
                        }
                        Spacer(modifier = Modifier.height(24.dp))
                        Text(
                            text = uiState.statusText,
                            style = MaterialTheme.typography.titleMedium,
                            color = MaterialTheme.colorScheme.onSurface,
                            textAlign = TextAlign.Center,
                        )
                    }
                }
                if (uiState.isSuccess) {
                    Spacer(modifier = Modifier.height(32.dp))
                    VaultButton(text = "Return to Dashboard", onClick = onBack)
                }
            } else {
                Text(
                    text = uiState.statusText,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    textAlign = TextAlign.Center,
                )
                
                Spacer(modifier = Modifier.height(24.dp))
                
                if (uiState.isScanning) {
                    CircularProgressIndicator(color = primaryColor, modifier = Modifier.size(48.dp))
                } else if (uiState.devices.isNotEmpty()) {
                    LazyColumn(
                        modifier = Modifier.weight(1f),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        items(uiState.devices) { device ->
                            val isSelected = uiState.selectedDevice == device
                            GlassCard(
                                modifier = Modifier.fillMaxWidth(),
                                cornerRadius = 16.dp,
                                borderColor = if (isSelected) primaryColor else primaryColor.copy(alpha = 0.15f),
                                onClick = { viewModel.selectDevice(device) }
                            ) {
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(16.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Icon(imageVector = Icons.Default.PhoneAndroid, contentDescription = null, tint = primaryColor)
                                    Spacer(modifier = Modifier.width(16.dp))
                                    Text(
                                        text = device.name,
                                        style = MaterialTheme.typography.titleMedium,
                                        fontWeight = FontWeight.Bold,
                                        color = MaterialTheme.colorScheme.onSurface
                                    )
                                }
                            }
                        }
                    }
                    
                    Spacer(modifier = Modifier.height(24.dp))
                    
                    VaultButton(
                        text = "Transfer to Selected Device",
                        onClick = { viewModel.startTransfer() },
                        enabled = uiState.selectedDevice != null
                    )
                }
                
                Spacer(modifier = Modifier.height(24.dp))
                VaultButton(text = "Scan Again", onClick = { viewModel.startScan() }, isSecondary = true, enabled = !uiState.isScanning)
                Spacer(modifier = Modifier.height(16.dp))
            }
        }
    }
}
