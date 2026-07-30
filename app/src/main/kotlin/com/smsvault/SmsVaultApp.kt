package com.smsvault

import android.app.Application
import android.app.Activity
import android.content.Context
import android.content.ContextWrapper
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.smsvault.core.cloudstorage.CloudSecrets
import com.smsvault.core.data.firestore.FirestoreSyncManager
import com.smsvault.core.data.repository.AuthRepositoryImpl
import com.smsvault.core.data.repository.BackupRepositoryImpl
import com.smsvault.core.data.repository.ScheduleRepositoryImpl
import com.smsvault.core.telephony.TelephonyReader
import com.smsvault.core.ui.theme.SmsVaultTheme
import kotlinx.coroutines.launch
import com.smsvault.feature.backup.ActiveOperationScreen
import com.smsvault.feature.backup.BackupViewModel
import com.smsvault.feature.dashboard.DashboardScreen
import com.smsvault.feature.dashboard.DashboardViewModel
import com.smsvault.feature.onboarding.AuthScreen
import com.smsvault.feature.onboarding.AuthViewModel
import com.smsvault.feature.onboarding.PermissionPrimingScreen
import com.smsvault.feature.restore.RestoreScreen
import com.smsvault.feature.restore.RestoreViewModel
import com.smsvault.feature.settings.CloudIntegrationScreen
import com.smsvault.feature.settings.SettingsScreen
import com.smsvault.feature.settings.SettingsViewModel
import com.smsvault.feature.transfer.TransferScreen
import com.smsvault.feature.vault.VaultScreen

@Composable
fun SmsVaultApp() {
    val context = LocalContext.current.applicationContext as Application
    val appContainer = (context as SmsVaultApplication).appContainer
    val navController = rememberNavController()
    val firestoreSync = remember { FirestoreSyncManager() }
    val authRepo = remember { AuthRepositoryImpl(firestoreSync) }
    val backupRepo = remember { BackupRepositoryImpl(appContainer.database.backupRecordDao()) }
    val scheduleRepo = remember { ScheduleRepositoryImpl(appContainer.database.scheduleDao()) }
    val telephonyReader = remember { TelephonyReader(context) }
    val prefs = remember { context.getSharedPreferences("smsvault_prefs", Application.MODE_PRIVATE) }

    val authViewModel: AuthViewModel = viewModel(
        factory = object : ViewModelProvider.Factory {
            @Suppress("UNCHECKED_CAST")
            override fun <T : ViewModel> create(modelClass: Class<T>): T {
                return AuthViewModel(authRepo) as T
            }
        }
    )

    val dashboardViewModel: DashboardViewModel = viewModel(
        factory = object : ViewModelProvider.Factory {
            @Suppress("UNCHECKED_CAST")
            override fun <T : ViewModel> create(modelClass: Class<T>): T {
                return DashboardViewModel(backupRepo, scheduleRepo, telephonyReader, authRepo, appContainer.backupCoordinator) as T
            }
        }
    )

    val backupViewModel: BackupViewModel = viewModel(
        factory = object : ViewModelProvider.Factory {
            @Suppress("UNCHECKED_CAST")
            override fun <T : ViewModel> create(modelClass: Class<T>): T {
                return BackupViewModel(context, appContainer.backupCoordinator, appContainer.prefs) as T
            }
        }
    )

    val restoreViewModel: RestoreViewModel = viewModel(
        factory = object : ViewModelProvider.Factory {
            @Suppress("UNCHECKED_CAST")
            override fun <T : ViewModel> create(modelClass: Class<T>): T {
                return RestoreViewModel(context, backupRepo) as T
            }
        }
    )
    
    val cloudIntegrationViewModel: com.smsvault.feature.settings.CloudIntegrationViewModel = viewModel(
        factory = object : ViewModelProvider.Factory {
            @Suppress("UNCHECKED_CAST")
            override fun <T : ViewModel> create(modelClass: Class<T>): T {
                return com.smsvault.feature.settings.CloudIntegrationViewModel(
                    context.applicationContext as android.app.Application,
                    com.smsvault.core.cloudstorage.impl.GoogleDriveProvider(context.applicationContext),
                    appContainer.prefs,
                    com.smsvault.core.cloudstorage.CloudSecrets(context.applicationContext)
                ) as T
            }
        }
    )

    val settingsViewModel: SettingsViewModel = viewModel(
        factory = object : ViewModelProvider.Factory {
            @Suppress("UNCHECKED_CAST")
            override fun <T : ViewModel> create(modelClass: Class<T>): T {
                return SettingsViewModel(appContainer.prefs) as T
            }
        }
    )

    val authState by authViewModel.uiState.collectAsStateWithLifecycle()
    val dashboardState by dashboardViewModel.uiState.collectAsStateWithLifecycle()
    val backupState by backupViewModel.uiState.collectAsStateWithLifecycle()
    val restoreState by restoreViewModel.uiState.collectAsStateWithLifecycle()
    val settingsState by settingsViewModel.uiState.collectAsStateWithLifecycle()

    if (authState.isCheckingAuth) {
        // Issue 2: Show a loading screen instead of flashing Login
        SmsVaultTheme(darkTheme = settingsState.isDarkTheme) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = MaterialTheme.colorScheme.primary)
            }
        }
        return
    }

    // Check onboarding completion state
    fun isCompletedOnboarding(): Boolean {
        val hasCompleted = prefs.getBoolean("has_completed_onboarding", false)
        val hasSms = androidx.core.content.ContextCompat.checkSelfPermission(context, android.Manifest.permission.READ_SMS) == android.content.pm.PackageManager.PERMISSION_GRANTED
        val hasCallLog = androidx.core.content.ContextCompat.checkSelfPermission(context, android.Manifest.permission.READ_CALL_LOG) == android.content.pm.PackageManager.PERMISSION_GRANTED
        return hasCompleted && hasSms && hasCallLog
    }

    // Login Screen comes FIRST if user is not authenticated
    val startDestination = remember {
        when {
            authState.user == null -> "auth"
            !isCompletedOnboarding() -> "onboarding"
            else -> "dashboard"
        }
    }

    SmsVaultTheme(darkTheme = settingsState.isDarkTheme) {
        NavHost(
            navController = navController,
            startDestination = startDestination,
        ) {
            // 1. Auth / Login Screen (FIRST)
            composable("auth") {
                AuthScreen(
                    state = authState,
                    onEmailChanged = authViewModel::onEmailChanged,
                    onPasswordChanged = authViewModel::onPasswordChanged,
                    onUsernameChanged = authViewModel::onUsernameChanged,
                    onToggleMode = authViewModel::toggleMode,
                    onSignIn = authViewModel::signIn,
                    onSignUp = authViewModel::signUp,
                    onGoogleSignIn = {
                        val activityContext = context.findActivity()
                        if (activityContext != null) {
                            val coroutineScope = kotlinx.coroutines.CoroutineScope(kotlinx.coroutines.Dispatchers.Main)
                            coroutineScope.launch {
                                try {
                                    val googleIdOption = com.google.android.libraries.identity.googleid.GetGoogleIdOption.Builder()
                                        .setFilterByAuthorizedAccounts(false)
                                        .setServerClientId(BuildConfig.GOOGLE_WEB_CLIENT_ID)
                                        .setNonce(java.util.UUID.randomUUID().toString())
                                        .build()

                                    val request = androidx.credentials.GetCredentialRequest.Builder()
                                        .addCredentialOption(googleIdOption)
                                        .build()

                                    val credentialManager = androidx.credentials.CredentialManager.create(activityContext)
                                    val result = credentialManager.getCredential(
                                        request = request,
                                        context = activityContext,
                                    )
                                    val credential = result.credential

                                    if (credential is androidx.credentials.CustomCredential &&
                                        credential.type == com.google.android.libraries.identity.googleid.GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL
                                    ) {
                                        val googleIdTokenCredential = com.google.android.libraries.identity.googleid.GoogleIdTokenCredential.createFrom(credential.data)
                                        authViewModel.signInWithGoogle(googleIdTokenCredential.idToken)
                                    } else {
                                        authViewModel.setError("Unexpected credential type")
                                    }
                                } catch (e: androidx.credentials.exceptions.GetCredentialException) {
                                    e.printStackTrace()
                                    authViewModel.setError("Credential error: ${e.message ?: "User cancelled or no accounts"}")
                                } catch (e: Exception) {
                                    e.printStackTrace()
                                    authViewModel.setError("Google Sign-In failed: ${e.localizedMessage}")
                                }
                            }
                        }
                    },
                    onAuthSuccess = {
                        if (isCompletedOnboarding()) {
                            navController.navigate("dashboard") { popUpTo("auth") { inclusive = true } }
                        } else {
                            navController.navigate("onboarding") { popUpTo("auth") { inclusive = true } }
                        }
                    },
                )
            }

            // 2. Permission Priming / Onboarding (3-slide pager - SHOWN ONLY ONCE)
            composable("onboarding") {
                PermissionPrimingScreen(
                    onPermissionsGranted = {
                        prefs.edit().putBoolean("has_completed_onboarding", true).apply()
                        dashboardViewModel.refreshCounts()
                        navController.navigate("dashboard") {
                            popUpTo("onboarding") { inclusive = true }
                        }
                    }
                )
            }

            // 3. Dashboard Screen
            composable("dashboard") {
                DashboardScreen(
                    state = dashboardState,
                    isDarkTheme = settingsState.isDarkTheme,
                    onToggleTheme = settingsViewModel::toggleTheme,
                    onNavigateToBackup = { dashboardViewModel.onBackupClicked { navController.navigate("active_operation") } },
                    onNavigateToRestore = { navController.navigate("restore") },
                    onNavigateToVault = { navController.navigate("vault") },
                    onNavigateToTransfer = { navController.navigate("transfer") },
                    onNavigateToSettings = { navController.navigate("settings") },
                    onConfirmDuplicateBackup = { dashboardViewModel.confirmDuplicateBackup { navController.navigate("active_operation") } },
                    onDismissDuplicateWarning = dashboardViewModel::dismissDuplicateWarning,
                    onOpenScheduleDialog = dashboardViewModel::showScheduleDialog,
                    onCloseScheduleDialog = dashboardViewModel::dismissScheduleDialog,
                    onSaveSchedule = dashboardViewModel::updateSchedule,
                )
            }

            // 4. Restore Screen
            composable("restore") {
                RestoreScreen(
                    state = restoreState,
                    onSelectBackup = restoreViewModel::selectBackup,
                    onRequestRestoreRole = restoreViewModel::requestRestoreRole,
                    onConfirmRestore = restoreViewModel::startRestoreExecution,
                    onDismissRolePrompt = restoreViewModel::dismissRolePrompt,
                    onBack = { navController.popBackStack() },
                )
            }

            // 5. Vault Explorer Screen
            composable("vault") {
                VaultScreen(
                    backups = dashboardState.backups,
                    onBack = { navController.popBackStack() },
                    onRestoreBackup = { record ->
                        restoreViewModel.selectBackup(record)
                        navController.navigate("restore")
                    },
                    onDeleteBackup = { record -> dashboardViewModel.deleteBackup(record) },
                )
            }

            // 6. Active Operation Progress Screen (WorkManager Execution)
            composable("active_operation") {
                ActiveOperationScreen(
                    state = backupState,
                    onStartBackup = backupViewModel::startBackup,
                    onCancel = {
                        backupViewModel.cancelBackup()
                        navController.popBackStack()
                    },
                    onDone = {
                        dashboardViewModel.refreshCounts()
                        navController.navigate("dashboard") {
                            popUpTo("dashboard") { inclusive = true }
                        }
                    },
                )
            }

            // 7. Settings Screen
            composable("settings") {
                SettingsScreen(
                    userEmail = dashboardState.userEmail,
                    state = settingsState,
                    onToggleTheme = settingsViewModel::toggleTheme,
                    onToggleAes = settingsViewModel::setAesEnabled,
                    onToggleCharging = settingsViewModel::setRequireCharging,
                    onToggleWifi = settingsViewModel::setWifiOnly,
                    onSignOut = {
                        authViewModel.signOut()
                        navController.navigate("auth") {
                            popUpTo(0) { inclusive = true }
                        }
                    },
                    onBack = { navController.popBackStack() },
                    onOpenCloudIntegrations = { navController.navigate("cloud_integrations") },
                )
            }

            // 8. Cloud Integrations Screen
            composable("cloud_integrations") {
                CloudIntegrationScreen(viewModel = cloudIntegrationViewModel,
                    onBack = { navController.popBackStack() },
                )
            }

            // 9. P2P Direct Transfer Screen
            composable("transfer") {
                TransferScreen(
                    onBack = { navController.popBackStack() },
                    
                )
            }
        }
    }
}

fun Context.findActivity(): Activity? = when (this) {
    is Activity -> this
    is ContextWrapper -> baseContext.findActivity()
    else -> null
}
