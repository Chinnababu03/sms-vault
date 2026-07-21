package com.smsvault

import android.content.ContentResolver
import android.provider.CallLog
import com.facebook.react.bridge.*
import org.json.JSONArray
import org.json.JSONObject

class CallLogBridgeModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private val contentResolver: ContentResolver = reactContext.contentResolver

    override fun getName() = "CallLogBridge"

    @ReactMethod
    fun readCallLogs(sinceTimestamp: Double, promise: Promise) {
        try {
            val projection = arrayOf(
                CallLog.Calls._ID,
                CallLog.Calls.NUMBER,
                CallLog.Calls.CACHED_NAME,
                CallLog.Calls.TYPE,
                CallLog.Calls.DATE,
                CallLog.Calls.DURATION,
            )
            val selection = if (sinceTimestamp > 0) "${CallLog.Calls.DATE} > ?" else null
            val selectionArgs = if (sinceTimestamp > 0) arrayOf(sinceTimestamp.toLong().toString()) else null
            val sortOrder = "${CallLog.Calls.DATE} ASC"

            val cursor = contentResolver.query(
                CallLog.Calls.CONTENT_URI, projection, selection, selectionArgs, sortOrder
            )
            val entries = JSONArray()

            cursor?.use { c ->
                val idCol = c.getColumnIndexOrThrow(CallLog.Calls._ID)
                val numCol = c.getColumnIndexOrThrow(CallLog.Calls.NUMBER)
                val nameCol = c.getColumnIndexOrThrow(CallLog.Calls.CACHED_NAME)
                val typeCol = c.getColumnIndexOrThrow(CallLog.Calls.TYPE)
                val dateCol = c.getColumnIndexOrThrow(CallLog.Calls.DATE)
                val durCol = c.getColumnIndexOrThrow(CallLog.Calls.DURATION)

                while (c.moveToNext()) {
                    val entry = JSONObject()
                    entry.put("id", c.getLong(idCol))
                    entry.put("number", c.getString(numCol) ?: "")
                    entry.put("name", c.getString(nameCol) ?: JSONObject.NULL)
                    entry.put("type", c.getInt(typeCol))
                    entry.put("date", c.getLong(dateCol))
                    entry.put("duration", c.getLong(durCol))
                    entries.put(entry)
                }
            }
            promise.resolve(entries.toString())
        } catch (e: Exception) {
            promise.reject("CALLLOG_READ_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun getCallLogCount(promise: Promise) {
        try {
            val cursor = contentResolver.query(
                CallLog.Calls.CONTENT_URI,
                arrayOf("COUNT(*) AS count"),
                null, null, null
            )
            val count = cursor?.use { if (it.moveToFirst()) it.getInt(0) else 0 } ?: 0
            promise.resolve(count)
        } catch (e: Exception) {
            promise.reject("CALLLOG_COUNT_ERROR", e.message, e)
        }
    }
}
