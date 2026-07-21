package com.smsvault

import android.content.ContentResolver
import android.content.ContentValues
import android.provider.Telephony
import android.provider.CallLog
import com.facebook.react.bridge.*
import org.json.JSONArray
import org.json.JSONObject

class RestoreBridgeModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private val contentResolver: ContentResolver = reactContext.contentResolver

    override fun getName() = "RestoreBridge"

    @ReactMethod
    fun writeSms(messagesJson: String, promise: Promise) {
        try {
            val messages = JSONArray(messagesJson)
            var count = 0

            for (i in 0 until messages.length()) {
                val msg = messages.getJSONObject(i)
                val type = msg.optInt("type", 1)

                val uri = when (type) {
                    1 -> Telephony.Sms.Inbox.CONTENT_URI
                    2 -> Telephony.Sms.Sent.CONTENT_URI
                    3 -> Telephony.Sms.Draft.CONTENT_URI
                    4 -> Telephony.Sms.Outbox.CONTENT_URI
                    else -> continue
                }

                val values = ContentValues().apply {
                    put(Telephony.Sms.ADDRESS, msg.optString("address", ""))
                    put(Telephony.Sms.BODY, msg.optString("body", ""))
                    put(Telephony.Sms.DATE, msg.optLong("date", System.currentTimeMillis()))
                    put(Telephony.Sms.DATE_SENT, msg.optLong("dateSent", msg.optLong("date", 0)))
                    put(Telephony.Sms.TYPE, type)
                    put(Telephony.Sms.READ, msg.optInt("read", 1))
                    put(Telephony.Sms.THREAD_ID, msg.optLong("threadId", 0))
                }
                contentResolver.insert(uri, values)
                count++
            }
            promise.resolve(count)
        } catch (e: Exception) {
            promise.reject("SMS_WRITE_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun writeCallLogs(entriesJson: String, promise: Promise) {
        try {
            val entries = JSONArray(entriesJson)
            var count = 0

            for (i in 0 until entries.length()) {
                val entry = entries.getJSONObject(i)
                val values = ContentValues().apply {
                    put(CallLog.Calls.NUMBER, entry.optString("number", ""))
                    put(CallLog.Calls.TYPE, entry.optInt("type", 1))
                    put(CallLog.Calls.DATE, entry.optLong("date", System.currentTimeMillis()))
                    put(CallLog.Calls.DURATION, entry.optLong("duration", 0))
                }
                contentResolver.insert(CallLog.Calls.CONTENT_URI, values)
                count++
            }
            promise.resolve(count)
        } catch (e: Exception) {
            promise.reject("CALLLOG_WRITE_ERROR", e.message, e)
        }
    }
}
