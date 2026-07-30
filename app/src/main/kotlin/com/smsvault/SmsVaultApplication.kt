package com.smsvault

import android.app.Application
import androidx.work.Configuration
import com.smsvault.core.data.db.SmsVaultDatabase
import com.smsvault.core.workmanager.BackupCoordinator
import com.smsvault.core.data.datastore.SmsVaultPreferences
import dagger.hilt.android.HiltAndroidApp

/**
 * SMS Vault Application entry point.
 */
class SmsVaultApplication : Application(), Configuration.Provider {
    lateinit var appContainer: AppContainer
        private set

    override fun onCreate() {
        super.onCreate()
        appContainer = AppContainer(this)
    }

    override val workManagerConfiguration: Configuration
        get() = Configuration.Builder()
            .build()
}

/**
 * AppContainer provides dependencies across the application.
 */
class AppContainer(val context: Application) {
    val database: SmsVaultDatabase by lazy {
        SmsVaultDatabase.getInstance(context)
    }

    val backupCoordinator: BackupCoordinator by lazy {
        BackupCoordinator(androidx.work.WorkManager.getInstance(context))
    }
    
    val prefs: SmsVaultPreferences by lazy {
        SmsVaultPreferences(context)
    }
}
