package com.smsvault

import android.content.ContentResolver
import android.database.Cursor
import android.provider.Telephony
import com.facebook.react.bridge.*
import org.json.JSONArray
import org.json.JSONObject

class SmsBridgeModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private val contentResolver: ContentResolver = reactContext.contentResolver

    override fun getName() = "SmsBridge"

    @ReactMethod
    fun readSms(sinceTimestamp: Double, promise: Promise) {
        try {
            val uri = Telephony.Sms.CONTENT_URI
            val projection = arrayOf(
                Telephony.Sms._ID,
                Telephony.Sms.ADDRESS,
                Telephony.Sms.BODY,
                Telephony.Sms.DATE,
                Telephony.Sms.DATE_SENT,
                Telephony.Sms.TYPE,
                Telephony.Sms.READ,
                Telephony.Sms.THREAD_ID,
            )
            val selection = if (sinceTimestamp > 0) "${Telephony.Sms.DATE} > ?" else null
            val selectionArgs = if (sinceTimestamp > 0) arrayOf(sinceTimestamp.toLong().toString()) else null
            val sortOrder = "${Telephony.Sms.DATE} ASC"

            val cursor: Cursor? = contentResolver.query(uri, projection, selection, selectionArgs, sortOrder)
            val messages = JSONArray()

            cursor?.use { c ->
                val idCol = c.getColumnIndexOrThrow(Telephony.Sms._ID)
                val addrCol = c.getColumnIndexOrThrow(Telephony.Sms.ADDRESS)
                val bodyCol = c.getColumnIndexOrThrow(Telephony.Sms.BODY)
                val dateCol = c.getColumnIndexOrThrow(Telephony.Sms.DATE)
                val dateSentCol = c.getColumnIndexOrThrow(Telephony.Sms.DATE_SENT)
                val typeCol = c.getColumnIndexOrThrow(Telephony.Sms.TYPE)
                val readCol = c.getColumnIndexOrThrow(Telephony.Sms.READ)
                val threadCol = c.getColumnIndexOrThrow(Telephony.Sms.THREAD_ID)

                while (c.moveToNext()) {
                    val msg = JSONObject()
                    msg.put("id", c.getLong(idCol))
                    msg.put("address", c.getString(addrCol) ?: "")
                    msg.put("body", c.getString(bodyCol) ?: "")
                    msg.put("date", c.getLong(dateCol))
                    msg.put("dateSent", c.getLong(dateSentCol))
                    msg.put("type", c.getInt(typeCol))
                    msg.put("read", c.getInt(readCol))
                    msg.put("threadId", c.getLong(threadCol))
                    messages.put(msg)
                }
            }
            promise.resolve(messages.toString())
        } catch (e: Exception) {
            promise.reject("SMS_READ_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun getSmsCount(promise: Promise) {
        try {
            val cursor = contentResolver.query(
                Telephony.Sms.CONTENT_URI,
                arrayOf("COUNT(*) AS count"),
                null, null, null
            )
            val count = cursor?.use { if (it.moveToFirst()) it.getInt(0) else 0 } ?: 0
            promise.resolve(count)
        } catch (e: Exception) {
            promise.reject("SMS_COUNT_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun readMms(sinceTimestamp: Double, promise: Promise) {
        try {
            val uri = Telephony.Mms.CONTENT_URI
            val projection = arrayOf(
                Telephony.Mms._ID,
                Telephony.Mms.SUBJECT,
                Telephony.Mms.DATE,
                Telephony.Mms.MESSAGE_TYPE,
                Telephony.Mms.READ,
            )
            val selection = if (sinceTimestamp > 0) "${Telephony.Mms.DATE} > ?" else null
            val selectionArgs = if (sinceTimestamp > 0) arrayOf(sinceTimestamp.toLong().toString()) else null
            val sortOrder = "${Telephony.Mms.DATE} ASC"

            val cursor = contentResolver.query(uri, projection, selection, selectionArgs, sortOrder)
            val messages = JSONArray()

            cursor?.use { c ->
                val idCol = c.getColumnIndexOrThrow(Telephony.Mms._ID)
                val subjCol = c.getColumnIndex(Telephony.Mms.SUBJECT)
                val dateCol = c.getColumnIndexOrThrow(Telephony.Mms.DATE)
                val typeCol = c.getColumnIndex(Telephony.Mms.MESSAGE_TYPE)
                val readCol = c.getColumnIndex(Telephony.Mms.READ)

                while (c.moveToNext()) {
                    val msg = JSONObject()
                    msg.put("id", c.getLong(idCol))
                    msg.put("subject", if (subjCol >= 0) c.getString(subjCol) else "")
                    msg.put("date", c.getLong(dateCol))
                    msg.put("type", if (typeCol >= 0) c.getInt(typeCol) else 1)
                    msg.put("read", if (readCol >= 0) c.getInt(readCol) else 1)
                    messages.put(msg)
                }
            }
            promise.resolve(messages.toString())
        } catch (e: Exception) {
            promise.reject("MMS_READ_ERROR", e.message, e)
        }
    }
}
