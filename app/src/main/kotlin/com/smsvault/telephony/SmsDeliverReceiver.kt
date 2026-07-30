package com.smsvault.telephony

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/**
 * Required component for ROLE_SMS compliance.
 * Only active (enabled="true") while the backup/restore pipeline is running.
 * The RoleLifecycleManager disables this component outside of active pipeline runs.
 */
class SmsDeliverReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        // Intentionally minimal — this app is NOT a messaging app.
        // Receipt is required by the OS for ROLE_SMS, but no message handling is done.
    }
}
