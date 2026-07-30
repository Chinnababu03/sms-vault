package com.smsvault.feature.backup

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.ErrorOutline
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.smsvault.core.domain.model.ProviderId
import com.smsvault.core.ui.components.GlassCard
import com.smsvault.core.ui.components.VaultButton
import com.smsvault.core.ui.components.VaultLogo
import com.smsvault.core.ui.theme.StatusErrorColor
import com.smsvault.core.ui.theme.StatusSuccessColor

@Composable
fun ActiveOperationScreen(
    state: BackupOperationUiState,
    onStartBackup: (ProviderId) -> Unit,
    onCancel: () -> Unit,
    onDone: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val primaryColor = MaterialTheme.colorScheme.primary

    LaunchedEffect(Unit) {
        if (!state.isRunning && !state.isSuccess && state.errorMessage == null) {
            onStartBackup(ProviderId.GOOGLE_DRIVE)
        }
    }

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .windowInsetsPadding(WindowInsets.safeDrawing),
        contentAlignment = Alignment.Center,
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center,
        ) {
            VaultLogo(size = 110.dp, showGlow = true)

            Spacer(modifier = Modifier.height(28.dp))

            GlassCard(
                modifier = Modifier.fillMaxWidth(),
                cornerRadius = 28.dp,
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                ) {
                    if (state.isSuccess) {
                        Icon(
                            imageVector = Icons.Default.CheckCircle,
                            contentDescription = null,
                            tint = StatusSuccessColor,
                            modifier = Modifier.size(80.dp),
                        )
                    } else if (state.errorMessage != null) {
                        Icon(
                            imageVector = Icons.Default.ErrorOutline,
                            contentDescription = null,
                            tint = StatusErrorColor,
                            modifier = Modifier.size(80.dp),
                        )
                    } else {
                        CircularProgressIndicator(
                            progress = { state.progressFraction.coerceIn(0.05f, 1.0f) },
                            modifier = Modifier.size(80.dp),
                            color = primaryColor,
                            strokeWidth = 6.dp,
                        )
                    }

                    Spacer(modifier = Modifier.height(24.dp))

                    Text(
                        text = state.stageText,
                        style = MaterialTheme.typography.headlineSmall,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface,
                        textAlign = TextAlign.Center,
                    )

                    Spacer(modifier = Modifier.height(8.dp))

                    if (state.totalItems > 0) {
                        Text(
                            text = "${state.processedItems} / ${state.totalItems} Items Processed (${(state.progressFraction * 100).toInt()}%)",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }

                    AnimatedVisibility(visible = state.errorMessage != null) {
                        state.errorMessage?.let { msg ->
                            Text(
                                text = msg,
                                style = MaterialTheme.typography.bodySmall,
                                color = StatusErrorColor,
                                textAlign = TextAlign.Center,
                                modifier = Modifier.padding(top = 12.dp),
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(32.dp))

            if (state.isSuccess) {
                VaultButton(
                    text = "Return to Dashboard",
                    onClick = onDone,
                )
            } else if (state.errorMessage != null) {
                VaultButton(
                    text = "Retry Backup",
                    onClick = { onStartBackup(ProviderId.GOOGLE_DRIVE) },
                )
            } else {
                VaultButton(
                    text = "Cancel Operation",
                    onClick = onCancel,
                    isSecondary = true,
                )
            }
        }
    }
}
