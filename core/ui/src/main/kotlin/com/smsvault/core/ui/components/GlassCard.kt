package com.smsvault.core.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

@Composable
fun GlassCard(
    modifier: Modifier = Modifier,
    cornerRadius: Dp = 24.dp,
    borderColor: Color? = null,
    onClick: (() -> Unit)? = null,
    content: @Composable BoxScope.() -> Unit,
) {
    val shape = RoundedCornerShape(cornerRadius)
    val activeBorderColor = borderColor ?: MaterialTheme.colorScheme.primary.copy(alpha = 0.25f)
    val spotColor = MaterialTheme.colorScheme.primary

    val cardModifier = modifier
        .shadow(12.dp, shape, spotColor = spotColor.copy(alpha = 0.15f))
        .clip(shape)
        .background(
            brush = Brush.verticalGradient(
                colors = listOf(
                    MaterialTheme.colorScheme.surface.copy(alpha = 0.9f),
                    MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.75f),
                )
            )
        )
        .border(
            width = 1.dp,
            brush = Brush.linearGradient(
                colors = listOf(
                    activeBorderColor,
                    Color.Transparent,
                    activeBorderColor.copy(alpha = 0.1f),
                )
            ),
            shape = shape,
        )
        .then(
            if (onClick != null) Modifier.clickable(onClick = onClick) else Modifier
        )

    Box(
        modifier = cardModifier.padding(16.dp),
        content = content,
    )
}
