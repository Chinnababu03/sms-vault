package com.smsvault.feature.settings

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.Logout
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.smsvault.core.ui.components.GlassCard
import com.smsvault.core.ui.components.VaultButton

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(
    userEmail: String,
    state: SettingsUiState,
    onToggleTheme: () -> Unit,
    onToggleAes: (Boolean) -> Unit,
    onToggleCharging: (Boolean) -> Unit,
    onToggleWifi: (Boolean) -> Unit,
    onSignOut: () -> Unit,
    onBack: () -> Unit,
    onOpenCloudIntegrations: () -> Unit = {},
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
                        text = "Settings & Security",
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
                .padding(horizontal = 20.dp)
                .verticalScroll(rememberScrollState()),
        ) {
            Text(
                text = "Authenticated Vault Account",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = primaryColor,
                modifier = Modifier.padding(vertical = 10.dp),
            )

            GlassCard(modifier = Modifier.fillMaxWidth(), cornerRadius = 20.dp) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween,
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(48.dp)
                                .clip(CircleShape)
                                .background(primaryColor.copy(alpha = 0.15f)),
                            contentAlignment = Alignment.Center,
                        ) {
                            Icon(imageVector = Icons.Default.Person, contentDescription = null, tint = primaryColor, modifier = Modifier.size(24.dp))
                        }
                        Spacer(modifier = Modifier.width(14.dp))
                        Column {
                            Text(text = "User Account", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface)
                            Text(text = userEmail, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                    }

                    IconButton(onClick = onSignOut) {
                        Icon(imageVector = Icons.AutoMirrored.Filled.Logout, contentDescription = "Sign Out", tint = MaterialTheme.colorScheme.error)
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Cloud Providers Tile
            GlassCard(
                modifier = Modifier.fillMaxWidth(),
                cornerRadius = 20.dp,
                onClick = onOpenCloudIntegrations,
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween,
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(imageVector = Icons.Default.CloudQueue, contentDescription = null, tint = primaryColor, modifier = Modifier.size(24.dp))
                        Spacer(modifier = Modifier.width(12.dp))
                        Column {
                            Text(text = "Cloud Storage Integrations", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface)
                            Text(text = "Google Drive & Local Storage", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                    }
                    Icon(imageVector = Icons.Default.ChevronRight, contentDescription = null, tint = primaryColor)
                }
            }

            Spacer(modifier = Modifier.height(20.dp))

            // Appearance & Theme Section
            Text(
                text = "Appearance & Theme",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = primaryColor,
                modifier = Modifier.padding(bottom = 10.dp),
            )

            GlassCard(modifier = Modifier.fillMaxWidth(), cornerRadius = 20.dp) {
                Column {
                    SettingToggleRow(
                        title = if (state.isDarkTheme) "Cyber-Purple Dark Theme" else "Emerald Green Light Theme",
                        subtitle = if (state.isDarkTheme) "Switch to Emerald Green Light Mode" else "Switch to Cyber-Purple Dark Mode",
                        icon = if (state.isDarkTheme) Icons.Default.DarkMode else Icons.Default.LightMode,
                        checked = state.isDarkTheme,
                        onCheckedChange = { onToggleTheme() },
                    )
                }
            }

            Spacer(modifier = Modifier.height(20.dp))

            Text(
                text = "Security & Encryption",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = primaryColor,
                modifier = Modifier.padding(bottom = 10.dp),
            )

            GlassCard(modifier = Modifier.fillMaxWidth(), cornerRadius = 20.dp) {
                Column {
                    SettingToggleRow(
                        title = "Zero-Knowledge AES-256-GCM",
                        subtitle = "Hardware-backed AndroidKeyStore master key",
                        icon = Icons.Default.Security,
                        checked = state.aesEnabled,
                        onCheckedChange = onToggleAes,
                    )
                }
            }

            Spacer(modifier = Modifier.height(20.dp))

            Text(
                text = "Automation Constraints",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = primaryColor,
                modifier = Modifier.padding(bottom = 10.dp),
            )

            GlassCard(modifier = Modifier.fillMaxWidth(), cornerRadius = 20.dp) {
                Column {
                    SettingToggleRow(
                        title = "Require Charging",
                        subtitle = "Run auto-backups only when device is plugged in",
                        icon = Icons.Default.BatteryChargingFull,
                        checked = state.chargingOnly,
                        onCheckedChange = onToggleCharging,
                    )
                    HorizontalDivider(color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.2f), modifier = Modifier.padding(vertical = 8.dp))
                    SettingToggleRow(
                        title = "Wi-Fi Only (Unmetered)",
                        subtitle = "Avoid cellular data usage during cloud sync",
                        icon = Icons.Default.Wifi,
                        checked = state.wifiOnly,
                        onCheckedChange = onToggleWifi,
                    )
                }
            }

            Spacer(modifier = Modifier.height(32.dp))

            VaultButton(
                text = "Sign Out & Lock Vault",
                onClick = onSignOut,
                isSecondary = true,
            )

            Spacer(modifier = Modifier.height(24.dp))
        }
    }
}

@Composable
fun SettingToggleRow(
    title: String,
    subtitle: String,
    icon: ImageVector,
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit,
) {
    val primaryColor = MaterialTheme.colorScheme.primary

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween,
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.weight(1f),
        ) {
            Icon(imageVector = icon, contentDescription = null, tint = primaryColor, modifier = Modifier.size(24.dp))
            Spacer(modifier = Modifier.width(12.dp))
            Column {
                Text(text = title, style = MaterialTheme.typography.titleMedium, color = MaterialTheme.colorScheme.onSurface)
                Text(text = subtitle, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        }
        Switch(
            checked = checked,
            onCheckedChange = onCheckedChange,
            colors = SwitchDefaults.colors(checkedThumbColor = primaryColor, checkedTrackColor = primaryColor.copy(0.3f)),
        )
    }
}
