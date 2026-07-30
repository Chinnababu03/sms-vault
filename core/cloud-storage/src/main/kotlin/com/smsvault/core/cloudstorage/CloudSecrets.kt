package com.smsvault.core.cloudstorage

import android.content.Context
import dagger.hilt.android.qualifiers.ApplicationContext
import java.util.Properties
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Accessor for cloud provider client IDs and API secrets.
 * Reads from BuildConfig / assets / .env properties safely.
 */
@Singleton
class CloudSecrets @Inject constructor(
    @ApplicationContext private val context: Context,
) {
    private val properties = Properties()

    init {
        runCatching {
            context.assets.open("cloud_secrets.properties").use { stream ->
                properties.load(stream)
            }
        }
    }

    val googleWebClientId: String
        get() = properties.getProperty("GOOGLE_WEB_CLIENT_ID")
            ?: "YOUR_GOOGLE_WEB_CLIENT_ID.apps.googleusercontent.com"
}
