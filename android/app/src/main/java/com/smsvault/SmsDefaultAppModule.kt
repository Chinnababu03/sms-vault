package com.smsvault

import android.content.Intent
import android.provider.Telephony
import com.facebook.react.bridge.*

class SmsDefaultAppModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "SmsDefaultAppBridge"

    @ReactMethod
    fun isDefaultSmsApp(promise: Promise) {
        val packageName = reactApplicationContext.packageName
        promise.resolve(
            Telephony.Sms.getDefaultSmsPackage(reactApplicationContext) == packageName
        )
    }

    @ReactMethod
    fun requestDefaultSmsApp(promise: Promise) {
        val intent = Intent(Telephony.Sms.Intents.ACTION_CHANGE_DEFAULT)
        intent.putExtra(
            Telephony.Sms.Intents.EXTRA_PACKAGE_NAME,
            reactApplicationContext.packageName
        )
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        reactApplicationContext.startActivity(intent)
        promise.resolve(true)
    }
}
