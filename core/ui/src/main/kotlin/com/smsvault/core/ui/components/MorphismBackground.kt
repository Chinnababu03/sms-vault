package com.smsvault.core.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import com.smsvault.core.domain.model.UiStyle
import com.smsvault.core.ui.theme.LocalUiStyle

@Composable
fun MorphismBackground(
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit,
) {
    val uiStyle = LocalUiStyle.current
    val surfaceColor = MaterialTheme.colorScheme.background
    val primaryColor = MaterialTheme.colorScheme.primary
    val secondaryColor = MaterialTheme.colorScheme.secondary

    val backgroundModifier = when (uiStyle) {
        UiStyle.GLASSMORPHISM -> {
            modifier
                .fillMaxSize()
                .background(
                    brush = Brush.radialGradient(
                        colors = listOf(
                            primaryColor.copy(alpha = 0.18f),
                            secondaryColor.copy(alpha = 0.08f),
                            surfaceColor,
                        ),
                        radius = 1200f,
                    )
                )
        }
        UiStyle.CLAYMORPHISM -> {
            modifier
                .fillMaxSize()
                .background(
                    brush = Brush.verticalGradient(
                        colors = listOf(
                            surfaceColor,
                            primaryColor.copy(alpha = 0.06f),
                            surfaceColor,
                        )
                    )
                )
        }
        UiStyle.NEUMORPHISM -> {
            modifier
                .fillMaxSize()
                .background(surfaceColor)
        }
        UiStyle.MATERIAL_YOU -> {
            modifier
                .fillMaxSize()
                .background(surfaceColor)
        }
    }

    Box(
        modifier = backgroundModifier,
    ) {
        content()
    }
}
