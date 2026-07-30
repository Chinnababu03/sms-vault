package com.smsvault.telephony

import android.app.Service
import android.content.Intent
import android.os.IBinder

/**
 * Required component for ROLE_SMS compliance (respond-via-message).
 */
class HeadlessSmsSendService : Service() {
    override fun onBind(intent: Intent?): IBinder? = null
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        stopSelf()
        return START_NOT_STICKY
    }
}
