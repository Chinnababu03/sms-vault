package com.smsvault.core.ui.components

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.smsvault.core.ui.theme.StatusSuccessColor

@Composable
fun StatusSeal(
    statusText: String = "VAULT SECURED",
    isEncrypted: Boolean = true,
    modifier: Modifier = Modifier,
) {
    var isRotated by remember { mutableStateOf(false) }
    val rotationAnim by animateFloatAsState(
        targetValue = if (isRotated) 360f else 0f,
        animationSpec = spring(stiffness = Spring.StiffnessMediumLow, dampingRatio = Spring.DampingRatioMediumBouncy),
        label = "SealRotation",
    )

    val primaryColor = MaterialTheme.colorScheme.primary
    val secondaryColor = MaterialTheme.colorScheme.secondary

    Box(
        modifier = modifier
            .shadow(12.dp, CircleShape, spotColor = primaryColor)
            .clip(CircleShape)
            .background(
                Brush.radialGradient(
                    colors = listOf(
                        MaterialTheme.colorScheme.surface,
                        MaterialTheme.colorScheme.surfaceVariant,
                    )
                )
            )
            .border(
                width = 2.dp,
                brush = Brush.sweepGradient(listOf(primaryColor, secondaryColor, primaryColor)),
                shape = CircleShape,
            )
            .clickable { isRotated = !isRotated }
            .padding(16.dp),
        contentAlignment = Alignment.Center,
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.Center,
        ) {
            Icon(
                imageVector = if (isEncrypted) Icons.Default.Shield else Icons.Default.Lock,
                contentDescription = null,
                tint = primaryColor,
                modifier = Modifier
                    .size(24.dp)
                    .rotate(rotationAnim),
            )
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                text = statusText,
                style = MaterialTheme.typography.labelLarge,
                fontWeight = FontWeight.Bold,
                color = StatusSuccessColor,
            )
        }
    }
}
