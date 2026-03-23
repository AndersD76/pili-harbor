package com.piliharbor.eaze.ui.theme

import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

// Pili Harbor dark palette
val HarborBg = Color(0xFF0A0E14)
val HarborSurface = Color(0xFF111820)
val HarborBorder = Color(0xFF1E2A3A)
val HarborText = Color(0xFFE2E8F0)
val HarborMuted = Color(0xFF64748B)
val HarborAccent = Color(0xFFEF4444) // red-500
val HarborGreen = Color(0xFF22C55E)
val HarborAmber = Color(0xFFF59E0B)
val HarborCyan = Color(0xFF22D3EE)

// Distance colors
val DistFar = Color(0xFFEF4444)       // > 30m red
val DistMedium = Color(0xFFF97316)    // 20-30m orange
val DistClose = Color(0xFFEAB308)     // 10-20m yellow
val DistNear = Color(0xFF4ADE80)      // 5-10m light green
val DistArrived = Color(0xFF22C55E)   // < 5m bright green

private val DarkColorScheme = darkColorScheme(
    primary = HarborAccent,
    secondary = HarborGreen,
    background = HarborBg,
    surface = HarborSurface,
    onBackground = HarborText,
    onSurface = HarborText,
    onPrimary = Color.White,
    outline = HarborBorder,
)

@Composable
fun EazeTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = DarkColorScheme,
        content = content,
    )
}

fun distanceColor(meters: Float): Color = when {
    meters < 5f -> DistArrived
    meters < 10f -> DistNear
    meters < 20f -> DistClose
    meters < 30f -> DistMedium
    else -> DistFar
}
