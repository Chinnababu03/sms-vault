package com.smsvault.core.telephony

import android.app.role.RoleManager
import android.content.Context
import android.content.Intent
import android.os.Build
import android.provider.Telephony
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Manages the ROLE_SMS lifecycle strictly per Play Console policy:
 * - Role is requested only after explicit user acknowledgment on the Priming screen
 * - Role is held ONLY for the duration of an active backup/restore run
 * - Role MUST be relinquished immediately on pipeline completion (success, partial failure, or cancel)
 */
@Singleton
class RoleLifecycleManager @Inject constructor(
    @ApplicationContext private val context: Context,
) {
    fun isDefaultSmsApp(): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            val roleManager = context.getSystemService(RoleManager::class.java)
            roleManager?.isRoleHeld(RoleManager.ROLE_SMS) == true
        } else {
            @Suppress("DEPRECATION")
            Telephony.Sms.getDefaultSmsPackage(context) == context.packageName
        }
    }

    /**
     * Returns an Intent to launch the OS role request dialog.
     * This must be called from an Activity — never from a Worker or Service.
     * Only call this after the Permission Priming screen has been acknowledged.
     */
    fun buildRoleRequestIntent(): Intent? {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            val roleManager = context.getSystemService(RoleManager::class.java)
            roleManager?.createRequestRoleIntent(RoleManager.ROLE_SMS)
        } else {
            null
        }
    }

    /**
     * Returns an Intent the user can use to change their default SMS app back.
     * This is the relinquishment prompt — it MUST be shown unconditionally on
     * pipeline completion. There is no code path that completes a run and skips this.
     */
    fun buildRelinquishmentIntent(): Intent {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            Intent(android.provider.Settings.ACTION_MANAGE_DEFAULT_APPS_SETTINGS)
        } else {
            Intent(android.provider.Settings.ACTION_WIRELESS_SETTINGS)
        }
    }

    /**
     * Called mid-pipeline to verify the role is still held.
     * If not held (user changed default app mid-run), the pipeline MUST halt.
     */
    fun verifyRoleStillHeld(): Boolean = isDefaultSmsApp()
}
