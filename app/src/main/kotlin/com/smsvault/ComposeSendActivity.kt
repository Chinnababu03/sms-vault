package com.smsvault

import android.os.Bundle
import androidx.activity.ComponentActivity

/**
 * Required component for ROLE_SMS compliance.
 * Only enabled while the pipeline is running.
 */
class ComposeSendActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        finish() // This activity is required by the OS spec but is intentionally no-op.
    }
}
