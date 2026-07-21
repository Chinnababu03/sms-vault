package com.smsvault

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import android.provider.Settings
import android.provider.Telephony
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.PermissionAwareActivity
import com.facebook.react.modules.core.PermissionListener

class PermissionBridgeModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext), PermissionListener {

    companion object {
        private const val SMS_PERMISSION_CODE = 1001
        private const val CALL_LOG_PERMISSION_CODE = 1002
        private const val WRITE_SMS_PERMISSION_CODE = 1003
        private const val NOTIFICATION_PERMISSION_CODE = 1004
    }

    override fun getName() = "PermissionBridge"

    // === SMS Permission ===

    @ReactMethod
    fun hasSmsPermission(promise: Promise) {
        try {
            val permission = Manifest.permission.READ_SMS
            val granted = ContextCompat.checkSelfPermission(
                reactApplicationContext,
                permission
            ) == PackageManager.PERMISSION_GRANTED
            promise.resolve(granted)
        } catch (e: Exception) {
            promise.reject("SMS_PERMISSION_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun requestSmsPermission(promise: Promise) {
        try {
            val permission = Manifest.permission.READ_SMS
            if (ContextCompat.checkSelfPermission(reactApplicationContext, permission) ==
                PackageManager.PERMISSION_GRANTED
            ) {
                promise.resolve(true)
                return
            }

            val currentActivity = currentActivity
            if (currentActivity is PermissionAwareActivity) {
                currentActivity.requestPermissions(
                    arrayOf(permission),
                    SMS_PERMISSION_CODE,
                    this
                )
                // Store promise to resolve in onRequestPermissionsResult
                pendingPermissionPromises[SMS_PERMISSION_CODE] = promise
            } else {
                promise.reject("ACTIVITY_ERROR", "Current activity is not PermissionAwareActivity")
            }
        } catch (e: Exception) {
            promise.reject("SMS_PERMISSION_REQUEST_ERROR", e.message, e)
        }
    }

    // === Call Log Permission ===

    @ReactMethod
    fun hasCallLogPermission(promise: Promise) {
        try {
            val permission = Manifest.permission.READ_CALL_LOG
            val granted = ContextCompat.checkSelfPermission(
                reactApplicationContext,
                permission
            ) == PackageManager.PERMISSION_GRANTED
            promise.resolve(granted)
        } catch (e: Exception) {
            promise.reject("CALL_LOG_PERMISSION_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun requestCallLogPermission(promise: Promise) {
        try {
            val permission = Manifest.permission.READ_CALL_LOG
            if (ContextCompat.checkSelfPermission(reactApplicationContext, permission) ==
                PackageManager.PERMISSION_GRANTED
            ) {
                promise.resolve(true)
                return
            }

            val currentActivity = currentActivity
            if (currentActivity is PermissionAwareActivity) {
                currentActivity.requestPermissions(
                    arrayOf(permission),
                    CALL_LOG_PERMISSION_CODE,
                    this
                )
                pendingPermissionPromises[CALL_LOG_PERMISSION_CODE] = promise
            } else {
                promise.reject("ACTIVITY_ERROR", "Current activity is not PermissionAwareActivity")
            }
        } catch (e: Exception) {
            promise.reject("CALL_LOG_PERMISSION_REQUEST_ERROR", e.message, e)
        }
    }

    // === Write SMS Permission ===

    @ReactMethod
    fun hasWriteSmsPermission(promise: Promise) {
        try {
            val permission = "android.permission.WRITE_SMS"
            val granted = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                // WRITE_SMS is deprecated in Android 10+, check via Settings
                Settings.Secure.getString(
                    reactApplicationContext.contentResolver,
                    "sms_default_application"
                ) == reactApplicationContext.packageName
            } else {
                ContextCompat.checkSelfPermission(
                    reactApplicationContext,
                    permission
                ) == PackageManager.PERMISSION_GRANTED
            }
            promise.resolve(granted)
        } catch (e: Exception) {
            promise.reject("WRITE_SMS_PERMISSION_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun requestWriteSmsPermission(promise: Promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                // On Android 10+, WRITE_SMS is not a runtime permission
                // User needs to set app as default SMS handler
                promise.resolve(false)
                return
            }

            val permission = "android.permission.WRITE_SMS"
            if (ContextCompat.checkSelfPermission(reactApplicationContext, permission) ==
                PackageManager.PERMISSION_GRANTED
            ) {
                promise.resolve(true)
                return
            }

            val currentActivity = currentActivity
            if (currentActivity is PermissionAwareActivity) {
                currentActivity.requestPermissions(
                    arrayOf(permission),
                    WRITE_SMS_PERMISSION_CODE,
                    this
                )
                pendingPermissionPromises[WRITE_SMS_PERMISSION_CODE] = promise
            } else {
                promise.reject("ACTIVITY_ERROR", "Current activity is not PermissionAwareActivity")
            }
        } catch (e: Exception) {
            promise.reject("WRITE_SMS_PERMISSION_REQUEST_ERROR", e.message, e)
        }
    }

    // === Notification Permission (Android 13+) ===

    @ReactMethod
    fun hasNotificationPermission(promise: Promise) {
        try {
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
                // Notification permission not required before Android 13
                promise.resolve(true)
                return
            }
            val permission = Manifest.permission.POST_NOTIFICATIONS
            val granted = ContextCompat.checkSelfPermission(
                reactApplicationContext,
                permission
            ) == PackageManager.PERMISSION_GRANTED
            promise.resolve(granted)
        } catch (e: Exception) {
            promise.reject("NOTIFICATION_PERMISSION_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun requestNotificationPermission(promise: Promise) {
        try {
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
                // Notification permission not required before Android 13
                promise.resolve(true)
                return
            }

            val permission = Manifest.permission.POST_NOTIFICATIONS
            if (ContextCompat.checkSelfPermission(reactApplicationContext, permission) ==
                PackageManager.PERMISSION_GRANTED
            ) {
                promise.resolve(true)
                return
            }

            val currentActivity = currentActivity
            if (currentActivity is PermissionAwareActivity) {
                currentActivity.requestPermissions(
                    arrayOf(permission),
                    NOTIFICATION_PERMISSION_CODE,
                    this
                )
                pendingPermissionPromises[NOTIFICATION_PERMISSION_CODE] = promise
            } else {
                promise.reject("ACTIVITY_ERROR", "Current activity is not PermissionAwareActivity")
            }
        } catch (e: Exception) {
            promise.reject("NOTIFICATION_PERMISSION_REQUEST_ERROR", e.message, e)
        }
    }

    // === Device Info ===

    @ReactMethod
    fun getDeviceInfo(promise: Promise) {
        try {
            val deviceInfo = Arguments.createMap()
            deviceInfo.putString("manufacturer", Build.MANUFACTURER)
            deviceInfo.putString("model", Build.MODEL)
            deviceInfo.putString("osVersion", Build.VERSION.RELEASE)
            deviceInfo.putInt("sdkVersion", Build.VERSION.SDK_INT)
            deviceInfo.putString("appVersion", getAppVersion())
            deviceInfo.putString("uniqueId", getUniqueId())
            promise.resolve(deviceInfo)
        } catch (e: Exception) {
            promise.reject("DEVICE_INFO_ERROR", e.message, e)
        }
    }

    // === Default SMS App ===

    @ReactMethod
    fun isDefaultSmsApp(promise: Promise) {
        try {
            val isDefault = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                Settings.Secure.getString(
                    reactApplicationContext.contentResolver,
                    "sms_default_application"
                ) == reactApplicationContext.packageName
            } else {
                @Suppress("DEPRECATION")
                Telephony.Sms.getDefaultSmsPackage(reactApplicationContext) ==
                    reactApplicationContext.packageName
            }
            promise.resolve(isDefault)
        } catch (e: Exception) {
            promise.reject("DEFAULT_SMS_APP_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun requestDefaultSmsApp(promise: Promise) {
        try {
            val intent = android.content.Intent(Settings.ACTION_MANAGE_DEFAULT_APPS_SETTINGS)
            intent.addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK)
            reactApplicationContext.startActivity(intent)
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("DEFAULT_SMS_APP_REQUEST_ERROR", e.message, e)
        }
    }

    // === PermissionListener Implementation ===

    private val pendingPermissionPromises = mutableMapOf<Int, Promise>()

    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<String>,
        grantResults: IntArray
    ): Boolean {
        val promise = pendingPermissionPromises.remove(requestCode) ?: return false
        if (grantResults.isNotEmpty() && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
            promise.resolve(true)
        } else {
            promise.resolve(false)
        }
        return true
    }

    // === Helper Methods ===

    private fun getAppVersion(): String {
        return try {
            val packageInfo = reactApplicationContext.packageManager
                .getPackageInfo(reactApplicationContext.packageName, 0)
            packageInfo.versionName ?: "1.0.0"
        } catch (e: Exception) {
            "1.0.0"
        }
    }

    private fun getUniqueId(): String {
        val prefs = reactApplicationContext.getSharedPreferences("sms_vault_prefs", 0)
        var uniqueId = prefs.getString("device_unique_id", null)
        if (uniqueId == null) {
            uniqueId = "${Build.MANUFACTURER}_${Build.MODEL}_${System.currentTimeMillis()}"
            prefs.edit().putString("device_unique_id", uniqueId).apply()
        }
        return uniqueId
    }
}
