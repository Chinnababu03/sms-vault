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
import com.smsvault.core.domain.model.UiStyle
import com.smsvault.core.ui.theme.LocalUiStyle

@Composable
fun GlassCard(
    modifier: Modifier = Modifier,
    cornerRadius: Dp = 24.dp,
    borderColor: Color? = null,
    onClick: (() -> Unit)? = null,
    content: @Composable BoxScope.() -> Unit,
) {
    val uiStyle = LocalUiStyle.current

    val shape = when (uiStyle) {
        UiStyle.CLAYMORPHISM -> RoundedCornerShape(cornerRadius.coerceAtLeast(28.dp))
        UiStyle.NEUMORPHISM -> RoundedCornerShape(cornerRadius)
        UiStyle.GLASSMORPHISM -> RoundedCornerShape(cornerRadius)
        UiStyle.MATERIAL_YOU -> RoundedCornerShape((cornerRadius - 4.dp).coerceAtLeast(16.dp))
    }

    val activeBorderColor = borderColor ?: MaterialTheme.colorScheme.primary.copy(alpha = 0.25f)

    val styledModifier = when (uiStyle) {
        UiStyle.MATERIAL_YOU -> {
            modifier
                .shadow(2.dp, shape)
                .clip(shape)
                .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f))
                .border(1.dp, MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.3f), shape)
        }
        UiStyle.GLASSMORPHISM -> {
            modifier
                .shadow(12.dp, shape, spotColor = MaterialTheme.colorScheme.primary.copy(alpha = 0.15f))
                .clip(shape)
                .background(
                    brush = Brush.verticalGradient(
                        colors = listOf(
                            MaterialTheme.colorScheme.surface.copy(alpha = 0.85f),
                            MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.65f),
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
        }
        UiStyle.CLAYMORPHISM -> {
            modifier
                .shadow(14.dp, shape, spotColor = MaterialTheme.colorScheme.primary.copy(alpha = 0.25f))
                .clip(shape)
                .background(
                    brush = Brush.verticalGradient(
                        colors = listOf(
                            MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.95f),
                            MaterialTheme.colorScheme.surface,
                        )
                    )
                )
                .border(2.dp, MaterialTheme.colorScheme.primary.copy(alpha = 0.3f), shape)
        }
        UiStyle.NEUMORPHISM -> {
            modifier
                .shadow(8.dp, shape, spotColor = Color.Black.copy(alpha = 0.3f))
                .clip(shape)
                .background(MaterialTheme.colorScheme.surface)
                .border(1.dp, MaterialTheme.colorScheme.onSurface.copy(alpha = 0.08f), shape)
        }
    }

    val finalModifier = styledModifier.then(
        if (onClick != null) Modifier.clickable(onClick = onClick) else Modifier
    )

    Box(
        modifier = finalModifier.padding(16.dp),
        content = content,
    )
}
