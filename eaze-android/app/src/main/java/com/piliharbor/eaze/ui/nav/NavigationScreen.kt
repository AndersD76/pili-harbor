package com.piliharbor.eaze.ui.nav

import android.Manifest
import android.content.Context
import android.os.VibrationEffect
import android.os.Vibrator
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.rotate
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.piliharbor.eaze.EazeApp
import com.piliharbor.eaze.model.TaskOffline
import com.piliharbor.eaze.service.CompassService
import com.piliharbor.eaze.service.LocationService
import com.piliharbor.eaze.service.NavigationEngine
import com.piliharbor.eaze.ui.theme.*
import kotlinx.coroutines.launch

@Composable
fun NavigationScreen(onChangeForklift: () -> Unit) {
    val app = EazeApp.instance
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    // State
    var currentTask by remember { mutableStateOf<TaskOffline?>(null) }
    var remaining by remember { mutableIntStateOf(0) }
    var total by remember { mutableIntStateOf(0) }
    var heading by remember { mutableFloatStateOf(0f) }
    var myLat by remember { mutableDoubleStateOf(0.0) }
    var myLng by remember { mutableDoubleStateOf(0.0) }
    var distance by remember { mutableFloatStateOf(999f) }
    var bearing by remember { mutableFloatStateOf(0f) }
    var completing by remember { mutableStateOf(false) }
    var allDone by remember { mutableStateOf(false) }
    var hasLocation by remember { mutableStateOf(false) }

    // Permission
    val permLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) {}

    LaunchedEffect(Unit) {
        permLauncher.launch(
            arrayOf(
                Manifest.permission.ACCESS_FINE_LOCATION,
                Manifest.permission.ACCESS_COARSE_LOCATION,
            )
        )
    }

    // Load first task
    LaunchedEffect(Unit) {
        val manifest = app.database.manifestDao().getLatest() ?: return@LaunchedEffect
        total = app.database.taskDao().countTotal(manifest.manifestId)
        remaining = app.database.taskDao().countRemaining(manifest.manifestId)
        currentTask = app.database.taskDao().getNextPending(manifest.manifestId)
        if (currentTask == null) allDone = true
    }

    // Compass
    LaunchedEffect(Unit) {
        val compass = CompassService(context)
        compass.headingFlow().collect { h -> heading = h }
    }

    // GPS
    LaunchedEffect(Unit) {
        val locationService = LocationService(context)
        locationService.locationFlow().collect { loc ->
            myLat = loc.latitude
            myLng = loc.longitude
            hasLocation = true
        }
    }

    // Update distance/bearing when position or task changes
    LaunchedEffect(myLat, myLng, currentTask) {
        val task = currentTask ?: return@LaunchedEffect
        if (!hasLocation) return@LaunchedEffect

        distance = NavigationEngine.getDistance(
            myLat, myLng, task.containerLat, task.containerLng,
        )
        bearing = NavigationEngine.getBearing(
            myLat, myLng, task.containerLat, task.containerLng,
        )

        // Vibrate when close
        if (distance < 5f) {
            val vibrator = context.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
            vibrator?.vibrate(VibrationEffect.createOneShot(200, VibrationEffect.DEFAULT_AMPLITUDE))
        }
    }

    val direction = NavigationEngine.getDirection(bearing, heading, distance)
    val dirText = NavigationEngine.getDirectionText(direction, distance)
    val color = distanceColor(distance)
    val arrowAngle = bearing - heading

    // Complete task
    fun completeTask() {
        scope.launch {
            val task = currentTask ?: return@launch
            completing = true

            // Mark done locally
            app.database.taskDao().updateStatus(
                task.taskId, "done",
                System.currentTimeMillis(),
                synced = false,
            )

            // Try sync with server
            try {
                val yardId = app.currentYardId ?: ""
                app.api.updateTaskStatus(
                    yardId, task.taskId,
                    mapOf("status" to "done"),
                )
                app.database.taskDao().updateStatus(
                    task.taskId, "done",
                    task.completedAt ?: System.currentTimeMillis(),
                    synced = true,
                )
            } catch (_: Exception) {
                // Will sync later
            }

            // Load next
            val manifest = app.database.manifestDao().getLatest()
            if (manifest != null) {
                remaining = app.database.taskDao().countRemaining(manifest.manifestId)
                currentTask = app.database.taskDao().getNextPending(manifest.manifestId)
                if (currentTask == null) allDone = true
            }
            completing = false
        }
    }

    // UI
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(HarborBg),
    ) {
        // Header
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(
                "EAZE",
                color = HarborAccent,
                fontSize = 18.sp,
                fontWeight = FontWeight.Black,
                letterSpacing = 4.sp,
            )
            if (!allDone) {
                Text(
                    "Tarefa ${total - remaining + 1} de $total",
                    color = HarborMuted,
                    fontSize = 13.sp,
                )
            }
            TextButton(onClick = onChangeForklift) {
                Text("Trocar", color = HarborMuted, fontSize = 12.sp)
            }
        }

        if (allDone) {
            // All done!
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(32.dp),
                contentAlignment = Alignment.Center,
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("✓", fontSize = 64.sp, color = HarborGreen)
                    Spacer(Modifier.height(16.dp))
                    Text(
                        "Manifesto Concluído!",
                        color = HarborGreen,
                        fontSize = 24.sp,
                        fontWeight = FontWeight.Bold,
                    )
                    Spacer(Modifier.height(8.dp))
                    Text(
                        "Todas as $total tarefas foram concluídas.",
                        color = HarborMuted,
                        fontSize = 14.sp,
                    )
                    Spacer(Modifier.height(32.dp))
                    Button(
                        onClick = onChangeForklift,
                        colors = ButtonDefaults.buttonColors(
                            containerColor = HarborAccent,
                        ),
                        shape = RoundedCornerShape(16.dp),
                    ) {
                        Text("Trocar Empilhadeira", fontWeight = FontWeight.Bold)
                    }
                }
            }
            return
        }

        val task = currentTask ?: return

        // Container info
        Surface(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp),
            shape = RoundedCornerShape(16.dp),
            color = HarborSurface,
        ) {
            Column(
                modifier = Modifier.padding(16.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                Text(
                    task.containerCode,
                    color = HarborText,
                    fontSize = 22.sp,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Monospace,
                )
                if (task.destinationLabel != null) {
                    Text(
                        "→ ${task.destinationLabel}",
                        color = HarborMuted,
                        fontSize = 14.sp,
                    )
                }
                Text(
                    task.type.uppercase(),
                    color = HarborAmber,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 2.sp,
                )
            }
        }

        Spacer(Modifier.height(16.dp))

        // Compass
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .weight(1f),
            contentAlignment = Alignment.Center,
        ) {
            CompassArrow(
                angle = arrowAngle,
                color = color,
                modifier = Modifier.size(220.dp),
            )
        }

        // Direction text
        Text(
            dirText,
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp),
            color = color,
            fontSize = 20.sp,
            fontWeight = FontWeight.Bold,
            textAlign = TextAlign.Center,
        )

        Spacer(Modifier.height(8.dp))

        // Distance
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.Center,
            verticalAlignment = Alignment.Bottom,
        ) {
            Text(
                "%.0f".format(distance),
                color = HarborText,
                fontSize = 48.sp,
                fontWeight = FontWeight.Black,
                fontFamily = FontFamily.Monospace,
            )
            Text(
                "m",
                color = HarborMuted,
                fontSize = 20.sp,
                modifier = Modifier.padding(bottom = 8.dp),
            )
        }

        Spacer(Modifier.height(8.dp))

        // AI instructions
        if (task.aiInstructions != null) {
            Surface(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp),
                shape = RoundedCornerShape(12.dp),
                color = HarborSurface,
            ) {
                Text(
                    task.aiInstructions,
                    modifier = Modifier.padding(12.dp),
                    color = HarborMuted,
                    fontSize = 13.sp,
                    textAlign = TextAlign.Center,
                )
            }
        }

        Spacer(Modifier.height(16.dp))

        // CHEGUEI button
        Button(
            onClick = { completeTask() },
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp)
                .height(64.dp),
            enabled = !completing,
            shape = RoundedCornerShape(20.dp),
            colors = ButtonDefaults.buttonColors(
                containerColor = HarborGreen,
            ),
        ) {
            if (completing) {
                CircularProgressIndicator(
                    modifier = Modifier.size(24.dp),
                    color = Color.White,
                    strokeWidth = 2.dp,
                )
            } else {
                Text(
                    "CHEGUEI",
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Black,
                    letterSpacing = 4.sp,
                )
            }
        }

        // Queue info
        Spacer(Modifier.height(8.dp))
        Text(
            if (remaining > 1) "+${remaining - 1} tarefas restantes"
            else "Última tarefa",
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 24.dp),
            color = HarborMuted,
            fontSize = 13.sp,
            textAlign = TextAlign.Center,
        )
    }
}

@Composable
private fun CompassArrow(
    angle: Float,
    color: Color,
    modifier: Modifier = Modifier,
) {
    Canvas(modifier = modifier) {
        val cx = size.width / 2
        val cy = size.height / 2
        val radius = size.minDimension / 2 * 0.85f

        // Outer ring (pulsing color)
        drawCircle(
            color = color.copy(alpha = 0.15f),
            radius = radius,
            center = Offset(cx, cy),
        )
        drawCircle(
            color = color.copy(alpha = 0.4f),
            radius = radius,
            center = Offset(cx, cy),
            style = androidx.compose.ui.graphics.drawscope.Stroke(4f),
        )

        // Arrow
        rotate(angle, pivot = Offset(cx, cy)) {
            val arrow = Path().apply {
                moveTo(cx, cy - radius * 0.7f) // tip
                lineTo(cx - radius * 0.2f, cy + radius * 0.3f) // left
                lineTo(cx, cy + radius * 0.1f) // notch
                lineTo(cx + radius * 0.2f, cy + radius * 0.3f) // right
                close()
            }
            drawPath(
                arrow,
                brush = Brush.verticalGradient(
                    colors = listOf(color, color.copy(alpha = 0.6f)),
                    startY = cy - radius * 0.7f,
                    endY = cy + radius * 0.3f,
                ),
            )
        }

        // Center dot
        drawCircle(
            color = Color.White,
            radius = 6f,
            center = Offset(cx, cy),
        )
    }
}
