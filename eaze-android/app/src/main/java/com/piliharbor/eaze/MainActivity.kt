package com.piliharbor.eaze

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.runtime.Composable
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.piliharbor.eaze.ui.claim.ClaimScreen
import com.piliharbor.eaze.ui.login.LoginScreen
import com.piliharbor.eaze.ui.nav.NavigationScreen
import com.piliharbor.eaze.ui.sync.SyncScreen
import com.piliharbor.eaze.ui.theme.EazeTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            EazeTheme {
                EazeNavGraph()
            }
        }
    }
}

@Composable
fun EazeNavGraph() {
    val navController = rememberNavController()

    NavHost(navController = navController, startDestination = "login") {
        composable("login") {
            LoginScreen(
                onLoginSuccess = {
                    navController.navigate("claim") {
                        popUpTo("login") { inclusive = true }
                    }
                }
            )
        }
        composable("claim") {
            ClaimScreen(
                onClaimed = {
                    navController.navigate("sync") {
                        popUpTo("claim") { inclusive = true }
                    }
                },
                onLogout = {
                    EazeApp.instance.accessToken = null
                    navController.navigate("login") {
                        popUpTo(0) { inclusive = true }
                    }
                }
            )
        }
        composable("sync") {
            SyncScreen(
                onSynced = {
                    navController.navigate("navigation") {
                        popUpTo("sync") { inclusive = true }
                    }
                }
            )
        }
        composable("navigation") {
            NavigationScreen(
                onChangeForklift = {
                    navController.navigate("claim") {
                        popUpTo(0) { inclusive = true }
                    }
                }
            )
        }
    }
}
