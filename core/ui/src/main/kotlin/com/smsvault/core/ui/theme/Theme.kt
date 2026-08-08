package com.smsvault.core.ui.theme

import android.app.Activity
import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat
import com.smsvault.core.domain.model.UiStyle

// Dark Theme Scheme linked to Dark constants in Color.kt
private val DarkColorScheme = darkColorScheme(
    primary = DarkPrimaryAccent,
    onPrimary = DarkAppBackground,
    primaryContainer = DarkSurfaceVariant,
    onPrimaryContainer = DarkPrimaryAccent,
    secondary = DarkSecondaryAccent,
    onSecondary = DarkAppBackground,
    tertiary = DarkTertiaryGlow,
    background = DarkAppBackground,
    onBackground = DarkTextPrimary,
    surface = DarkCardSurface,
    onSurface = DarkTextPrimary,
    surfaceVariant = DarkSurfaceVariant,
    onSurfaceVariant = DarkTextSecondary,
    error = StatusErrorColor,
    onError = DarkAppBackground,
)

// Light Theme Scheme linked to Light constants in Color.kt
private val LightColorScheme = lightColorScheme(
    primary = LightPrimaryAccent,
    onPrimary = LightCardSurface,
    primaryContainer = LightSurfaceVariant,
    onPrimaryContainer = LightTextPrimary,
    secondary = LightSecondaryAccent,
    onSecondary = LightCardSurface,
    tertiary = LightTertiaryGlow,
    background = LightAppBackground,
    onBackground = LightTextPrimary,
    surface = LightCardSurface,
    onSurface = LightTextPrimary,
    surfaceVariant = LightSurfaceVariant,
    onSurfaceVariant = LightTextSecondary,
    error = StatusErrorColor,
    onError = LightCardSurface,
)

@Composable
fun SmsVaultTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    dynamicColor: Boolean = false,
    uiStyle: UiStyle = UiStyle.MATERIAL_YOU,
    content: @Composable () -> Unit,
) {
    val colorScheme = when {
        dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
            val context = LocalContext.current
            if (darkTheme) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
        }
        darkTheme -> DarkColorScheme
        else -> LightColorScheme
    }

    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            window.statusBarColor = colorScheme.background.toArgb()
            WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = !darkTheme
        }
    }

    CompositionLocalProvider(LocalUiStyle provides uiStyle) {
        MaterialTheme(
            colorScheme = colorScheme,
            typography = SmsVaultTypography,
            content = content,
        )
    }
}
