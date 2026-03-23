package com.piliharbor.eaze.ui.claim

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.piliharbor.eaze.EazeApp
import com.piliharbor.eaze.model.ForkliftInfo
import com.piliharbor.eaze.model.YardListItem
import com.piliharbor.eaze.ui.theme.*
import kotlinx.coroutines.launch

@Composable
fun ClaimScreen(
    onClaimed: () -> Unit,
    onLogout: () -> Unit,
) {
    val app = EazeApp.instance
    var yards by remember { mutableStateOf<List<YardListItem>>(emptyList()) }
    var forklifts by remember { mutableStateOf<List<ForkliftInfo>>(emptyList()) }
    var selectedYard by remember { mutableStateOf<String?>(null) }
    var loading by remember { mutableStateOf(true) }
    var claiming by remember { mutableStateOf<String?>(null) }
    var error by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()

    LaunchedEffect(Unit) {
        try {
            yards = app.api.getYards()
            if (yards.size == 1) {
                selectedYard = yards[0].id
                forklifts = app.api.getForklifts(yards[0].id)
            }
        } catch (e: Exception) {
            error = "Erro ao carregar dados"
        }
        loading = false
    }

    LaunchedEffect(selectedYard) {
        selectedYard?.let { yardId ->
            try {
                forklifts = app.api.getForklifts(yardId)
            } catch (_: Exception) {}
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(HarborBg)
            .padding(24.dp),
    ) {
        // Header
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Column {
                Text(
                    "EAZE",
                    color = HarborAccent,
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Black,
                    letterSpacing = 4.sp,
                )
                Text(
                    "Olá, ${app.userName ?: "Operador"}",
                    color = HarborMuted,
                    fontSize = 14.sp,
                )
            }
            TextButton(onClick = onLogout) {
                Text("Sair", color = HarborMuted)
            }
        }

        Spacer(Modifier.height(24.dp))

        // Yard selector (if multiple)
        if (yards.size > 1) {
            Text(
                "PÁTIO",
                color = HarborMuted,
                fontSize = 11.sp,
                letterSpacing = 2.sp,
            )
            Spacer(Modifier.height(8.dp))
            yards.forEach { yard ->
                Surface(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable {
                            selectedYard = yard.id
                            app.currentYardId = yard.id
                        },
                    shape = RoundedCornerShape(12.dp),
                    color = if (selectedYard == yard.id)
                        HarborAccent.copy(alpha = 0.1f)
                    else HarborSurface,
                    border = if (selectedYard == yard.id)
                        null else null,
                ) {
                    Text(
                        yard.name,
                        modifier = Modifier.padding(16.dp),
                        color = if (selectedYard == yard.id)
                            HarborAccent else HarborText,
                        fontWeight = FontWeight.SemiBold,
                    )
                }
                Spacer(Modifier.height(8.dp))
            }
            Spacer(Modifier.height(16.dp))
        } else if (yards.size == 1) {
            app.currentYardId = yards[0].id
        }

        // Forklifts
        Text(
            "EMPILHADEIRA",
            color = HarborMuted,
            fontSize = 11.sp,
            letterSpacing = 2.sp,
        )
        Spacer(Modifier.height(8.dp))

        if (loading) {
            Box(
                modifier = Modifier.fillMaxWidth(),
                contentAlignment = Alignment.Center,
            ) {
                CircularProgressIndicator(
                    color = HarborAccent,
                    modifier = Modifier.size(32.dp),
                )
            }
        } else {
            LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                items(forklifts) { fl ->
                    val available = fl.operator_id == null
                    val isClaiming = claiming == fl.id

                    Surface(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable(enabled = available && !isClaiming) {
                                scope.launch {
                                    claiming = fl.id
                                    error = null
                                    try {
                                        app.api.claimForklift(fl.id)
                                        app.currentForkliftId = fl.id
                                        onClaimed()
                                    } catch (e: Exception) {
                                        error = "Erro ao vincular empilhadeira"
                                        claiming = null
                                    }
                                }
                            },
                        shape = RoundedCornerShape(12.dp),
                        color = HarborSurface,
                    ) {
                        Row(
                            modifier = Modifier.padding(16.dp),
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            // Status dot
                            Box(
                                modifier = Modifier
                                    .size(10.dp)
                                    .background(
                                        if (available) HarborGreen else HarborMuted,
                                        CircleShape,
                                    ),
                            )
                            Spacer(Modifier.width(12.dp))

                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    fl.code,
                                    color = HarborText,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 16.sp,
                                )
                                Text(
                                    if (available) "Disponível" else "Em uso",
                                    color = if (available) HarborGreen else HarborMuted,
                                    fontSize = 12.sp,
                                )
                            }

                            if (isClaiming) {
                                CircularProgressIndicator(
                                    modifier = Modifier.size(20.dp),
                                    color = HarborAccent,
                                    strokeWidth = 2.dp,
                                )
                            }
                        }
                    }
                }
            }
        }

        // Error
        if (error != null) {
            Spacer(Modifier.height(16.dp))
            Text(error!!, color = HarborAccent, fontSize = 13.sp)
        }
    }
}
