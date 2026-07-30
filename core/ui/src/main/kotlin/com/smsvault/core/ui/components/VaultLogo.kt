package com.smsvault.core.ui.components

import androidx.compose.animation.core.*
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.smsvault.core.ui.R

@Composable
fun VaultLogo(
    modifier: Modifier = Modifier,
    size: Dp = 120.dp,
    showGlow: Boolean = true,
) {
    val primaryColor = MaterialTheme.colorScheme.primary
    val secondaryColor = MaterialTheme.colorScheme.secondary

    // Breathing pulse animation for theme halo glow
    val infiniteTransition = rememberInfiniteTransition(label = "VaultLogoPulse")
    val pulseScale by infiniteTransition.animateFloat(
        initialValue = 0.95f,
        targetValue = 1.05f,
        animationSpec = infiniteRepeatable(
            animation = tween(2000, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse,
        ),
        label = "PulseScale",
    )

    val pulseAlpha by infiniteTransition.animateFloat(
        initialValue = 0.3f,
        targetValue = 0.75f,
        animationSpec = infiniteRepeatable(
            animation = tween(2000, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse,
        ),
        label = "PulseAlpha",
    )

    // Tap spring scale feedback
    var isPressed by remember { mutableStateOf(false) }
    val scaleAnim by animateFloatAsState(
        targetValue = if (isPressed) 0.92f else 1.0f,
        animationSpec = spring(stiffness = Spring.StiffnessMedium, dampingRatio = Spring.DampingRatioMediumBouncy),
        label = "LogoPressScale",
    )

    Box(
        modifier = modifier
            .size(size)
            .scale(scaleAnim)
            .clickable(
                interactionSource = remember { MutableInteractionSource() },
                indication = null,
                onClick = { isPressed = !isPressed },
            ),
        contentAlignment = Alignment.Center,
    ) {
        if (showGlow) {
            // Glowing background aura matching active theme (Purple in Dark, Emerald in Light)
            Box(
                modifier = Modifier
                    .size(size * 0.95f)
                    .scale(pulseScale)
                    .alpha(pulseAlpha)
                    .clip(CircleShape)
                    .background(
                        Brush.radialGradient(
                            colors = listOf(
                                primaryColor.copy(alpha = 0.55f),
                                secondaryColor.copy(alpha = 0.25f),
                                Color.Transparent,
                            )
                        )
                    )
            )
        }

        // High-res 3D metallic logo image
        Image(
            painter = painterResource(id = R.drawable.ic_app_logo),
            contentDescription = "SMS Vault Metallic Logo",
            modifier = Modifier
                .fillMaxSize()
                .shadow(16.dp, CircleShape, spotColor = primaryColor)
                .clip(CircleShape)
                .border(
                    width = 2.5.dp,
                    brush = Brush.sweepGradient(
                        listOf(primaryColor, secondaryColor, primaryColor)
                    ),
                    shape = CircleShape,
                )
        )
    }
}
