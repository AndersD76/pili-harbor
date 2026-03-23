package com.piliharbor.eaze.ui.sync

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.piliharbor.eaze.EazeApp
import com.piliharbor.eaze.model.ManifestPackage
import com.piliharbor.eaze.model.TaskOffline
import com.piliharbor.eaze.service.NavigationEngine
import com.piliharbor.eaze.ui.theme.*
import kotlinx.coroutines.launch

@Composable
fun SyncScreen(onSynced: () -> Unit) {
    val app = EazeApp.instance
    var status by remember { mutableStateOf("Conectando...") }
    var progress by remember { mutableFloatStateOf(0f) }
    var error by remember { mutableStateOf<String?>(null) }
    var taskCount by remember { mutableIntStateOf(0) }
    val scope = rememberCoroutineScope()

    LaunchedEffect(Unit) {
        scope.launch {
            try {
                // Check if we have cached data
                val cached = app.database.manifestDao().getLatest()
                if (cached != null) {
                    val remaining = app.database.taskDao()
                        .countRemaining(cached.manifestId)
                    if (remaining > 0) {
                        status = "Pacote local encontrado"
                        taskCount = remaining
                        kotlinx.coroutines.delay(1000)
                        onSynced()
                        return@launch
                    }
                }

                // Download fresh package
                status = "Baixando manifesto..."
                progress = 0.2f

                val forkliftId = app.currentForkliftId ?: return@launch
                val pkg = app.api.getManifestPackage(forkliftId)

                if (pkg.tasks.isEmpty()) {
                    status = "Nenhuma tarefa atribuída"
                    error = "Peça ao supervisor para ativar um manifesto"
                    return@launch
                }

                progress = 0.5f
                status = "Salvando ${pkg.tasks.size} tarefas..."

                val yard = pkg.yard
                val originLat = yard?.origin_lat ?: -23.9536
                val originLng = yard?.origin_lng ?: -46.3323

                // Save manifest
                val manifest = ManifestPackage(
                    manifestId = pkg.manifest?.id ?: "unknown",
                    manifestName = pkg.manifest?.name ?: "Manifesto",
                    operationType = pkg.manifest?.operation_type ?: "loading",
                    vesselName = pkg.manifest?.vessel_name,
                    yardName = yard?.name,
                    yardWidthMeters = yard?.width_meters ?: 200.0,
                    yardHeightMeters = yard?.height_meters ?: 150.0,
                    originLat = originLat,
                    originLng = originLng,
                )
                app.database.manifestDao().insert(manifest)

                progress = 0.7f

                // Convert and save tasks
                val tasks = pkg.tasks.map { t ->
                    val (cLat, cLng) = NavigationEngine.yardToGps(
                        t.container_x, t.container_y,
                        originLat, originLng,
                    )
                    val (dLat, dLng) = if (t.destination_x != null && t.destination_y != null) {
                        NavigationEngine.yardToGps(
                            t.destination_x, t.destination_y,
                            originLat, originLng,
                        )
                    } else null to null

                    TaskOffline(
                        taskId = t.id,
                        manifestId = manifest.manifestId,
                        sequence = t.sequence,
                        type = t.type,
                        priority = t.priority,
                        containerCode = t.container_code,
                        containerX = t.container_x,
                        containerY = t.container_y,
                        containerLat = cLat,
                        containerLng = cLng,
                        destinationLabel = t.destination_label,
                        destinationX = t.destination_x,
                        destinationY = t.destination_y,
                        destinationLat = dLat,
                        destinationLng = dLng,
                        aiInstructions = t.ai_instructions,
                    )
                }
                app.database.taskDao().insertAll(tasks)

                progress = 1f
                taskCount = tasks.size
                status = "Pronto! $taskCount tarefas"

                kotlinx.coroutines.delay(800)
                onSynced()
            } catch (e: Exception) {
                // Try cached data
                val cached = app.database.manifestDao().getLatest()
                if (cached != null) {
                    val remaining = app.database.taskDao()
                        .countRemaining(cached.manifestId)
                    if (remaining > 0) {
                        status = "Offline — usando pacote salvo"
                        taskCount = remaining
                        kotlinx.coroutines.delay(1500)
                        onSynced()
                        return@launch
                    }
                }
                error = "Sem conexão e sem pacote salvo"
                status = "Erro"
            }
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(HarborBg),
        contentAlignment = Alignment.Center,
    ) {
        Column(
            modifier = Modifier.padding(48.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Text(
                "EAZE",
                color = HarborAccent,
                fontSize = 24.sp,
                fontWeight = FontWeight.Black,
                letterSpacing = 6.sp,
            )

            Spacer(Modifier.height(48.dp))

            if (error == null) {
                CircularProgressIndicator(
                    progress = { progress },
                    modifier = Modifier.size(80.dp),
                    color = HarborAccent,
                    strokeWidth = 6.dp,
                )
            }

            Spacer(Modifier.height(24.dp))

            Text(
                status,
                color = HarborText,
                fontSize = 16.sp,
                fontWeight = FontWeight.SemiBold,
                textAlign = TextAlign.Center,
            )

            if (taskCount > 0) {
                Spacer(Modifier.height(8.dp))
                Text(
                    "$taskCount tarefas no pacote",
                    color = HarborGreen,
                    fontSize = 14.sp,
                )
            }

            if (error != null) {
                Spacer(Modifier.height(16.dp))
                Text(
                    error!!,
                    color = HarborAccent,
                    fontSize = 13.sp,
                    textAlign = TextAlign.Center,
                )
            }
        }
    }
}
