package com.smsvault.feature.restore

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.smsvault.core.domain.model.BackupRecord
import com.smsvault.core.ui.components.GlassCard
import com.smsvault.core.ui.components.VaultButton
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RestoreScreen(
    state: RestoreUiState,
    onSelectBackup: (BackupRecord) -> Unit,
    onRequestRestoreRole: () -> Unit,
    onConfirmRestore: () -> Unit,
    onDismissRolePrompt: () -> Unit,
    onBack: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val primaryColor = MaterialTheme.colorScheme.primary

    Scaffold(
        modifier = modifier.fillMaxSize(),
        containerColor = MaterialTheme.colorScheme.background,
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = "Restore Vault Archive",
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
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 20.dp),
        ) {
            Column(modifier = Modifier.fillMaxSize()) {
                Text(
                    text = "Select Backup Archive to Restore",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = primaryColor,
                    modifier = Modifier.padding(vertical = 12.dp),
                )

                if (state.backups.isEmpty()) {
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
                            Icon(imageVector = Icons.Default.CloudOff, contentDescription = null, tint = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.size(48.dp))
                            Spacer(modifier = Modifier.height(12.dp))
                            Text(text = "No Backups Available for Restore", style = MaterialTheme.typography.titleMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            Text(text = "Back up your messages first using 'Back Up Now' on the dashboard.", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant, textAlign = TextAlign.Center)
                        }
                    }
                } else {
                    LazyColumn(
                        modifier = Modifier.weight(1f),
                        verticalArrangement = Arrangement.spacedBy(10.dp),
                    ) {
                        items(state.backups, key = { it.id }) { record ->
                            val isSelected = state.selectedBackup?.id == record.id
                            val dateStr = SimpleDateFormat("MMM dd, yyyy • HH:mm", Locale.US).format(Date(record.createdAtEpochMs))

                            GlassCard(
                                modifier = Modifier.fillMaxWidth(),
                                cornerRadius = 20.dp,
                                borderColor = if (isSelected) primaryColor else primaryColor.copy(alpha = 0.15f),
                                onClick = { onSelectBackup(record) },
                            ) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                ) {
                                    Column(modifier = Modifier.weight(1f)) {
                                        Row(verticalAlignment = Alignment.CenterVertically) {
                                            RadioButton(
                                                selected = isSelected,
                                                onClick = { onSelectBackup(record) },
                                                colors = RadioButtonDefaults.colors(selectedColor = primaryColor),
                                            )
                                            Text(
                                                text = "${record.provider.name} Archive",
                                                style = MaterialTheme.typography.titleMedium,
                                                fontWeight = FontWeight.Bold,
                                                color = MaterialTheme.colorScheme.onSurface,
                                            )
                                        }
                                        Text(
                                            text = "${record.itemCount} Items (${record.contentType.name}) • $dateStr",
                                            style = MaterialTheme.typography.bodySmall,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                                            modifier = Modifier.padding(start = 32.dp),
                                        )
                                    }
                                }
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    VaultButton(
                        text = "Restore Selected Archive to Phone",
                        onClick = onRequestRestoreRole,
                        enabled = state.selectedBackup != null && !state.isRestoring,
                        isLoading = state.isRestoring,
                    )

                    Spacer(modifier = Modifier.height(20.dp))
                }
            }

            // Role acquisition confirmation dialog
            if (state.showRolePrompt) {
                AlertDialog(
                    onDismissRequest = onDismissRolePrompt,
                    title = {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(imageVector = Icons.Default.Shield, contentDescription = null, tint = primaryColor)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(text = "Android Role Authorization")
                        }
                    },
                    text = {
                        Text(
                            text = "To write messages back to your device, Android requires SMS Vault to temporarily hold Default SMS Handler status. Role will be released immediately after restore completes."
                        )
                    },
                    confirmButton = {
                        TextButton(onClick = onConfirmRestore) {
                            Text(text = "Grant & Restore", color = primaryColor, fontWeight = FontWeight.Bold)
                        }
                    },
                    dismissButton = {
                        TextButton(onClick = onDismissRolePrompt) {
                            Text(text = "Cancel")
                        }
                    },
                    containerColor = MaterialTheme.colorScheme.surface,
                )
            }
        }
    }
}
