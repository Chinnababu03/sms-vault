package com.smsvault.feature.dashboard

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.automirrored.filled.Message
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.smsvault.core.ui.components.GlassCard
import com.smsvault.core.ui.components.StatusSeal
import com.smsvault.core.ui.components.VaultLogo

@Composable
fun DashboardScreen(
    state: DashboardUiState,
    isDarkTheme: Boolean = true,
    onToggleTheme: () -> Unit = {},
    onNavigateToBackup: () -> Unit,
    onNavigateToRestore: () -> Unit,
    onNavigateToVault: () -> Unit,
    onNavigateToTransfer: () -> Unit,
    onNavigateToSettings: () -> Unit,
    onOpenScheduleDialog: () -> Unit,
    onCloseScheduleDialog: () -> Unit,
    onSaveSchedule: (com.smsvault.core.domain.model.Cadence?) -> Unit,
    onConfirmDuplicateBackup: () -> Unit,
    onDismissDuplicateWarning: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val primaryColor = MaterialTheme.colorScheme.primary
    val secondaryColor = MaterialTheme.colorScheme.secondary
    val tertiaryColor = MaterialTheme.colorScheme.tertiary

    if (state.showScheduleDialog) {
        ScheduleDialog(
            currentCadence = state.schedule?.cadence,
            onDismiss = onCloseScheduleDialog,
            onSave = {
                onSaveSchedule(it)
                onCloseScheduleDialog()
            },
        )
    }

    if (state.showDuplicateWarning) {
        DuplicateBackupWarningDialog(
            onConfirm = onConfirmDuplicateBackup,
            onDismiss = onDismissDuplicateWarning
        )
    }

    Scaffold(
        modifier = modifier.fillMaxSize(),
        containerColor = MaterialTheme.colorScheme.background,
        topBar = {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .windowInsetsPadding(WindowInsets.statusBars)
                    .padding(horizontal = 20.dp, vertical = 12.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween,
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    VaultLogo(size = 42.dp, showGlow = false)
                    Spacer(modifier = Modifier.width(12.dp))
                    Column {
                        Text(
                            text = "SMS Vault",
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onBackground,
                        )
                        Text(
                            text = state.userEmail,
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                }

                Row(verticalAlignment = Alignment.CenterVertically) {
                    IconButton(onClick = onToggleTheme) {
                        Icon(
                            imageVector = if (isDarkTheme) Icons.Default.LightMode else Icons.Default.DarkMode,
                            contentDescription = "Toggle Theme",
                            tint = primaryColor,
                        )
                    }
                    IconButton(onClick = onNavigateToSettings) {
                        Icon(
                            imageVector = Icons.Default.Settings,
                            contentDescription = "Settings",
                            tint = primaryColor,
                        )
                    }
                }
            }
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 20.dp)
                .verticalScroll(rememberScrollState()),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Spacer(modifier = Modifier.height(8.dp))

            // Vault Status Seal Header
            StatusSeal(
                statusText = if (state.isEncrypted) "AES-256 VAULT SECURED" else "VAULT UNLOCKED",
                isEncrypted = state.isEncrypted,
                modifier = Modifier.fillMaxWidth(),
            )

            Spacer(modifier = Modifier.height(24.dp))

            // Overview Stats Grid
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                StatCard(
                    title = "Device Messages",
                    count = state.smsCount,
                    icon = Icons.AutoMirrored.Filled.Message,
                    accentColor = primaryColor,
                    modifier = Modifier.weight(1f),
                )
                StatCard(
                    title = "Device Call Logs",
                    count = state.callLogCount,
                    icon = Icons.Default.Call,
                    accentColor = secondaryColor,
                    modifier = Modifier.weight(1f),
                )
                StatCard(
                    title = "Vault Archives",
                    count = state.backups.size,
                    icon = Icons.Default.CloudQueue,
                    accentColor = tertiaryColor,
                    modifier = Modifier.weight(1f),
                )
            }

            Spacer(modifier = Modifier.height(24.dp))

            Text(
                text = "Quick Actions",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onBackground,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 12.dp),
            )

            // Core Action Grid
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                ActionCard(
                    title = "Back Up Now",
                    description = "Extract & AES Encrypt",
                    icon = Icons.Default.CloudUpload,
                    accentColor = primaryColor,
                    onClick = onNavigateToBackup,
                    modifier = Modifier.weight(1f),
                )
                ActionCard(
                    title = "Restore Vault",
                    description = "Decrypt & Restore",
                    icon = Icons.Default.CloudDownload,
                    accentColor = secondaryColor,
                    onClick = onNavigateToRestore,
                    modifier = Modifier.weight(1f),
                )
            }

            Spacer(modifier = Modifier.height(12.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                ActionCard(
                    title = "P2P Transfer",
                    description = "Nearby Device Socket",
                    icon = Icons.Default.QrCodeScanner,
                    accentColor = tertiaryColor,
                    onClick = onNavigateToTransfer,
                    modifier = Modifier.weight(1f),
                )
                ActionCard(
                    title = "Vault Explorer",
                    description = "Inspect Backup Files",
                    icon = Icons.Default.FolderZip,
                    accentColor = MaterialTheme.colorScheme.onSurface,
                    onClick = onNavigateToVault,
                    modifier = Modifier.weight(1f),
                )
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Auto-Backup Banner
            GlassCard(
                onClick = onOpenScheduleDialog,
                modifier = Modifier.fillMaxWidth(),
                cornerRadius = 20.dp,
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Icon(
                        imageVector = Icons.Default.Schedule,
                        contentDescription = null,
                        tint = primaryColor,
                        modifier = Modifier.size(28.dp),
                    )
                    Spacer(modifier = Modifier.width(16.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "Auto-Backup Schedule",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurface,
                        )
                        Text(
                            text = state.schedule?.let { "${it.cadence.name} • Charging required" } ?: "Weekly automatic cloud backup active",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(24.dp))
        }
    }
}

@Composable
fun StatCard(
    title: String,
    count: Int,
    icon: ImageVector,
    accentColor: Color,
    modifier: Modifier = Modifier,
) {
    GlassCard(
        modifier = modifier,
        cornerRadius = 18.dp,
        borderColor = accentColor.copy(alpha = 0.3f),
    ) {
        Column(horizontalAlignment = Alignment.Start) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = accentColor,
                modifier = Modifier.size(22.dp),
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = count.toString(),
                style = MaterialTheme.typography.headlineLarge,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onSurface,
            )
            Text(
                text = title,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
}

@Composable
fun ActionCard(
    title: String,
    description: String,
    icon: ImageVector,
    accentColor: Color,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    GlassCard(
        modifier = modifier.height(130.dp),
        cornerRadius = 22.dp,
        borderColor = accentColor.copy(alpha = 0.35f),
        onClick = onClick,
    ) {
        Column(
            modifier = Modifier.fillMaxSize(),
            verticalArrangement = Arrangement.SpaceBetween,
        ) {
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(accentColor.copy(alpha = 0.15f)),
                contentAlignment = Alignment.Center,
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    tint = accentColor,
                    modifier = Modifier.size(22.dp),
                )
            }

            Column {
                Text(
                    text = title,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurface,
                )
                Text(
                    text = description,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }
    }
}

@Composable
fun DuplicateBackupWarningDialog(
    onConfirm: () -> Unit,
    onDismiss: () -> Unit
) {
    androidx.compose.material3.AlertDialog(
        onDismissRequest = onDismiss,
        title = { androidx.compose.material3.Text("Backup Recently Completed") },
        text = { androidx.compose.material3.Text("A backup was just completed within the last 5 minutes. Taking another one so soon will create duplicates. Are you sure you want to proceed?") },
        confirmButton = {
            androidx.compose.material3.TextButton(onClick = onConfirm) {
                androidx.compose.material3.Text("Proceed")
            }
        },
        dismissButton = {
            androidx.compose.material3.TextButton(onClick = onDismiss) {
                androidx.compose.material3.Text("Cancel")
            }
        }
    )
}
