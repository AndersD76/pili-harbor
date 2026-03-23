package com.piliharbor.eaze.ui.login

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.piliharbor.eaze.EazeApp
import com.piliharbor.eaze.model.LoginRequest
import com.piliharbor.eaze.ui.theme.*
import kotlinx.coroutines.launch

@Composable
fun LoginScreen(onLoginSuccess: () -> Unit) {
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var loading by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(HarborBg),
        contentAlignment = Alignment.Center,
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(32.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            // Logo
            Surface(
                modifier = Modifier.size(64.dp),
                shape = RoundedCornerShape(16.dp),
                color = HarborAccent,
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Text(
                        "P", color = MaterialTheme.colorScheme.onPrimary,
                        fontSize = 28.sp, fontWeight = FontWeight.Black,
                    )
                }
            }

            Spacer(Modifier.height(16.dp))

            Text(
                "EAZE",
                color = HarborAccent,
                fontSize = 32.sp,
                fontWeight = FontWeight.Black,
                letterSpacing = 8.sp,
            )
            Text(
                "PILI HARBOR",
                color = HarborMuted,
                fontSize = 12.sp,
                letterSpacing = 4.sp,
            )

            Spacer(Modifier.height(48.dp))

            // Error
            if (error != null) {
                Surface(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    color = HarborAccent.copy(alpha = 0.1f),
                ) {
                    Text(
                        error!!,
                        modifier = Modifier.padding(16.dp),
                        color = HarborAccent,
                        fontSize = 14.sp,
                        textAlign = TextAlign.Center,
                    )
                }
                Spacer(Modifier.height(16.dp))
            }

            // Email
            OutlinedTextField(
                value = email,
                onValueChange = { email = it },
                label = { Text("Email") },
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                keyboardOptions = KeyboardOptions(
                    keyboardType = KeyboardType.Email,
                ),
                singleLine = true,
            )

            Spacer(Modifier.height(12.dp))

            // Password
            OutlinedTextField(
                value = password,
                onValueChange = { password = it },
                label = { Text("Senha") },
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                visualTransformation = PasswordVisualTransformation(),
                singleLine = true,
            )

            Spacer(Modifier.height(24.dp))

            // Login button
            Button(
                onClick = {
                    scope.launch {
                        loading = true
                        error = null
                        try {
                            val resp = EazeApp.instance.api.login(
                                LoginRequest(email.trim(), password)
                            )
                            EazeApp.instance.accessToken = resp.access_token
                            EazeApp.instance.userName = resp.user.full_name
                            onLoginSuccess()
                        } catch (e: Exception) {
                            error = "Erro ao fazer login. Verifique suas credenciais."
                        } finally {
                            loading = false
                        }
                    }
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(56.dp),
                enabled = !loading && email.isNotBlank() && password.isNotBlank(),
                shape = RoundedCornerShape(16.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = HarborAccent,
                ),
            ) {
                if (loading) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(24.dp),
                        color = MaterialTheme.colorScheme.onPrimary,
                        strokeWidth = 2.dp,
                    )
                } else {
                    Text(
                        "Entrar",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                    )
                }
            }
        }
    }
}
