package com.smsvault.feature.onboarding

import android.Manifest
import android.os.Build
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.*
import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Call
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.automirrored.filled.Message
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.smsvault.core.ui.components.GlassCard
import com.smsvault.core.ui.components.VaultButton
import com.smsvault.core.ui.components.VaultLogo
import kotlinx.coroutines.launch

data class PrimingSlide(
    val title: String,
    val description: String,
    val icon: ImageVector,
    val badgeText: String,
)

val PRIMING_SLIDES = listOf(
    PrimingSlide(
        title = "SMS & MMS Encrypted Backup",
        description = "Read your text messages locally to encrypt and backup with zero-knowledge AES-256 encryption. Your privacy remains 100% in your control.",
        icon = Icons.AutoMirrored.Filled.Message,
        badgeText = "SMS PERMISSION",
    ),
    PrimingSlide(
        title = "Call Logs Archival",
        description = "Archive call history alongside your text messages. Backups are stored in your private Google Drive appDataFolder or local vault.",
        icon = Icons.Default.Call,
        badgeText = "CALL LOG PERMISSION",
    ),
    PrimingSlide(
        title = "Temporary ROLE_SMS Access",
        description = "Per Android security rules, restoring messages requires holding default SMS handler role ONLY for the duration of the restore run, then immediately relinquished.",
        icon = Icons.Default.Shield,
        badgeText = "PLAY CONSOLE COMPLIANT",
    ),
)

@OptIn(ExperimentalFoundationApi::class)
@Composable
fun PermissionPrimingScreen(
    onPermissionsGranted: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val pagerState = rememberPagerState(pageCount = { PRIMING_SLIDES.size })
    val scope = rememberCoroutineScope()
    val primaryColor = MaterialTheme.colorScheme.primary

    val permissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestMultiplePermissions(),
        onResult = { permissions ->
            // Even if they deny, we proceed so they can still see the app, 
            // but the counts will be 0. Real app might block or show rationale.
            onPermissionsGranted()
        }
    )

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
        ) {
            // Header
            Spacer(modifier = Modifier.height(20.dp))
            VaultLogo(size = 90.dp, showGlow = false)
            Spacer(modifier = Modifier.height(16.dp))

            // Horizontal Pager
            HorizontalPager(
                state = pagerState,
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth(),
            ) { page ->
                val slide = PRIMING_SLIDES[page]
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(12.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center,
                ) {
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
                            Surface(
                                color = primaryColor.copy(alpha = 0.15f),
                                shape = RoundedCornerShape(12.dp),
                            ) {
                                Text(
                                    text = slide.badgeText,
                                    color = primaryColor,
                                    style = MaterialTheme.typography.labelMedium,
                                    fontWeight = FontWeight.Bold,
                                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                                )
                            }
                            Spacer(modifier = Modifier.height(20.dp))
                            Icon(
                                imageVector = slide.icon,
                                contentDescription = null,
                                tint = primaryColor,
                                modifier = Modifier.size(56.dp),
                            )
                            Spacer(modifier = Modifier.height(20.dp))
                            Text(
                                text = slide.title,
                                style = MaterialTheme.typography.headlineMedium,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onSurface,
                                textAlign = TextAlign.Center,
                            )
                            Spacer(modifier = Modifier.height(12.dp))
                            Text(
                                text = slide.description,
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                textAlign = TextAlign.Center,
                            )
                        }
                    }
                }
            }

            // Pager Indicator Dots
            Row(
                horizontalArrangement = Arrangement.Center,
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.padding(vertical = 16.dp),
            ) {
                repeat(PRIMING_SLIDES.size) { iteration ->
                    val isSelected = pagerState.currentPage == iteration
                    Box(
                        modifier = Modifier
                            .padding(4.dp)
                            .size(if (isSelected) 12.dp else 8.dp)
                            .clip(CircleShape)
                            .background(if (isSelected) primaryColor else MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.3f))
                    )
                }
            }

            // Bottom Action Button
            VaultButton(
                text = if (pagerState.currentPage == PRIMING_SLIDES.size - 1) "Grant Permissions & Enter Vault" else "Next",
                onClick = {
                    if (pagerState.currentPage < PRIMING_SLIDES.size - 1) {
                        scope.launch { pagerState.animateScrollToPage(pagerState.currentPage + 1) }
                    } else {
                        val permissions = mutableListOf(
                            Manifest.permission.READ_SMS,
                            Manifest.permission.READ_CALL_LOG,
                            Manifest.permission.WRITE_CALL_LOG
                        )
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                            permissions.add(Manifest.permission.POST_NOTIFICATIONS)
                        }
                        permissionLauncher.launch(permissions.toTypedArray())
                    }
                },
                modifier = Modifier.fillMaxWidth(),
            )
            Spacer(modifier = Modifier.height(16.dp))
        }
    }
}
