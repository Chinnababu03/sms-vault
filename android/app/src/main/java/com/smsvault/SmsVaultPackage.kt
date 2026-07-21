package com.smsvault

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

class SmsVaultPackage : ReactPackage {
    override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> =
        listOf(
            SmsBridgeModule(reactContext),
            CallLogBridgeModule(reactContext),
            RestoreBridgeModule(reactContext),
            SmsDefaultAppModule(reactContext),
            PermissionBridgeModule(reactContext),
        )

    override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> =
        emptyList()
}
