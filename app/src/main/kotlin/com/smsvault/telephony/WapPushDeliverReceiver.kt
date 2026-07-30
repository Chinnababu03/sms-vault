package com.smsvault.telephony

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/**
 * Required component for ROLE_SMS compliance (MMS support).
 * Only active while the pipeline is running.
 */
class WapPushDeliverReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        // Intentionally minimal — required by OS role specification.
    }
}
