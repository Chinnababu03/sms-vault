package com.smsvault.core.ui.components

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.smsvault.core.domain.model.UiStyle
import com.smsvault.core.ui.theme.LocalUiStyle

@Composable
fun VaultButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    isLoading: Boolean = false,
    enabled: Boolean = true,
    isSecondary: Boolean = false,
) {
    val uiStyle = LocalUiStyle.current
    val interactionSource = remember { MutableInteractionSource() }
    val isPressed by interactionSource.collectIsPressedAsState()

    val scaleAnim by animateFloatAsState(
        targetValue = if (isPressed) 0.95f else 1.0f,
        animationSpec = spring(stiffness = Spring.StiffnessLow, dampingRatio = Spring.DampingRatioMediumBouncy),
        label = "VaultButtonScale",
    )

    val primaryColor = MaterialTheme.colorScheme.primary
    val secondaryColor = MaterialTheme.colorScheme.secondary

    val buttonShape = when (uiStyle) {
        UiStyle.CLAYMORPHISM -> CircleShape
        UiStyle.GLASSMORPHISM -> RoundedCornerShape(20.dp)
        UiStyle.NEUMORPHISM -> RoundedCornerShape(16.dp)
        UiStyle.MATERIAL_YOU -> RoundedCornerShape(16.dp)
    }

    val backgroundBrush = if (isSecondary) {
        Brush.horizontalGradient(
            colors = listOf(
                MaterialTheme.colorScheme.surfaceVariant,
                MaterialTheme.colorScheme.surface,
            )
        )
    } else {
        Brush.horizontalGradient(
            colors = listOf(
                primaryColor,
                secondaryColor,
            )
        )
    }

    val textColor = if (isSecondary) {
        MaterialTheme.colorScheme.onSurface
    } else {
        MaterialTheme.colorScheme.onPrimary
    }

    val shadowElevation = when {
        !enabled -> 0.dp
        uiStyle == UiStyle.CLAYMORPHISM -> 10.dp
        uiStyle == UiStyle.GLASSMORPHISM -> 8.dp
        uiStyle == UiStyle.NEUMORPHISM -> 6.dp
        else -> 4.dp
    }

    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(54.dp)
            .scale(scaleAnim)
            .shadow(
                elevation = shadowElevation,
                shape = buttonShape,
                spotColor = primaryColor.copy(alpha = 0.3f),
            )
            .clip(buttonShape)
            .background(
                brush = if (enabled) backgroundBrush else Brush.linearGradient(listOf(Color.Gray.copy(0.3f), Color.Gray.copy(0.3f)))
            )
            .then(
                if (uiStyle == UiStyle.GLASSMORPHISM && enabled) {
                    Modifier.border(1.dp, Color.White.copy(alpha = 0.3f), buttonShape)
                } else Modifier
            )
            .clickable(
                enabled = enabled && !isLoading,
                interactionSource = interactionSource,
                indication = null,
                onClick = onClick,
            ),
        contentAlignment = Alignment.Center,
    ) {
        if (isLoading) {
            CircularProgressIndicator(
                modifier = Modifier.size(24.dp),
                color = textColor,
                strokeWidth = 2.5.dp,
            )
        } else {
            Text(
                text = text,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = if (enabled) textColor else Color.Gray,
            )
        }
    }
}
