package com.smsvault.core.telephony

import android.content.Context
import android.database.Cursor
import android.os.Build
import android.os.Bundle
import android.provider.CallLog
import android.provider.Telephony
import com.smsvault.core.domain.model.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.flowOn
import kotlinx.coroutines.withContext

class TelephonyReader(
    private val context: Context,
) {
    companion object {
        private const val PAGE_SIZE = 500
        private val SMS_URI = Telephony.Sms.CONTENT_URI
        private val CALL_LOG_URI = CallLog.Calls.CONTENT_URI
    }

    suspend fun readAllSms(): List<SmsMessage> = withContext(Dispatchers.IO) {
        runCatching {
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
            val cursor = context.contentResolver.query(
                SMS_URI,
                projection,
                null,
                null,
                "${Telephony.Sms.DATE} DESC"
            )
            cursor?.use { parseSms(it) } ?: emptyList()
        }.onFailure { it.printStackTrace() }.getOrDefault(emptyList())
    }

    private fun parseSms(cursor: Cursor): List<SmsMessage> {
        val list = mutableListOf<SmsMessage>()
        val idIdx = cursor.getColumnIndex(Telephony.Sms._ID)
        val addrIdx = cursor.getColumnIndex(Telephony.Sms.ADDRESS)
        val bodyIdx = cursor.getColumnIndex(Telephony.Sms.BODY)
        val dateIdx = cursor.getColumnIndex(Telephony.Sms.DATE)
        val dateSentIdx = cursor.getColumnIndex(Telephony.Sms.DATE_SENT)
        val typeIdx = cursor.getColumnIndex(Telephony.Sms.TYPE)
        val readIdx = cursor.getColumnIndex(Telephony.Sms.READ)
        val threadIdx = cursor.getColumnIndex(Telephony.Sms.THREAD_ID)

        while (cursor.moveToNext()) {
            val rawType = if (typeIdx >= 0) cursor.getInt(typeIdx) else 1
            list.add(
                SmsMessage(
                    id = if (idIdx >= 0) cursor.getLong(idIdx) else 0L,
                    address = if (addrIdx >= 0) cursor.getString(addrIdx) ?: "" else "",
                    body = if (bodyIdx >= 0) cursor.getString(bodyIdx) ?: "" else "",
                    dateMs = if (dateIdx >= 0) cursor.getLong(dateIdx) else 0L,
                    dateSentMs = if (dateSentIdx >= 0) cursor.getLong(dateSentIdx) else 0L,
                    type = rawType.toSmsType(),
                    read = (if (readIdx >= 0) cursor.getInt(readIdx) else 1) == 1,
                    threadId = if (threadIdx >= 0) cursor.getLong(threadIdx) else 0L,
                )
            )
        }
        return list
    }

    suspend fun readAllCallLogs(): List<CallLogEntry> = withContext(Dispatchers.IO) {
        runCatching {
            val projection = arrayOf(
                CallLog.Calls._ID,
                CallLog.Calls.NUMBER,
                CallLog.Calls.TYPE,
                CallLog.Calls.DATE,
                CallLog.Calls.DURATION,
                CallLog.Calls.CACHED_NAME,
            )
            val cursor = context.contentResolver.query(
                CALL_LOG_URI,
                projection,
                null,
                null,
                "${CallLog.Calls.DATE} DESC"
            )
            cursor?.use { parseCallLog(it) } ?: emptyList()
        }.onFailure { it.printStackTrace() }.getOrDefault(emptyList())
    }

    private fun parseCallLog(cursor: Cursor): List<CallLogEntry> {
        val list = mutableListOf<CallLogEntry>()
        val idIdx = cursor.getColumnIndex(CallLog.Calls._ID)
        val numIdx = cursor.getColumnIndex(CallLog.Calls.NUMBER)
        val typeIdx = cursor.getColumnIndex(CallLog.Calls.TYPE)
        val dateIdx = cursor.getColumnIndex(CallLog.Calls.DATE)
        val durIdx = cursor.getColumnIndex(CallLog.Calls.DURATION)
        val nameIdx = cursor.getColumnIndex(CallLog.Calls.CACHED_NAME)

        while (cursor.moveToNext()) {
            val rawType = if (typeIdx >= 0) cursor.getInt(typeIdx) else 1
            list.add(
                CallLogEntry(
                    id = if (idIdx >= 0) cursor.getLong(idIdx) else 0L,
                    number = if (numIdx >= 0) cursor.getString(numIdx) ?: "" else "",
                    type = rawType.toCallType(),
                    dateMs = if (dateIdx >= 0) cursor.getLong(dateIdx) else 0L,
                    durationSeconds = if (durIdx >= 0) cursor.getLong(durIdx) else 0L,
                    cachedName = if (nameIdx >= 0) cursor.getString(nameIdx) else null,
                )
            )
        }
        return list
    }

    fun getSmsCount(): Int {
        return runCatching {
            context.contentResolver.query(SMS_URI, arrayOf(Telephony.Sms._ID), null, null, null)?.use { it.count } ?: 0
        }.getOrDefault(0)
    }

    fun getCallLogCount(): Int {
        return runCatching {
            context.contentResolver.query(CALL_LOG_URI, arrayOf(CallLog.Calls._ID), null, null, null)?.use { it.count } ?: 0
        }.getOrDefault(0)
    }

    private fun Int.toSmsType(): SmsType = when (this) {
        1 -> SmsType.INBOX
        2 -> SmsType.SENT
        3 -> SmsType.DRAFT
        4 -> SmsType.OUTBOX
        5 -> SmsType.FAILED
        else -> SmsType.INBOX
    }

    private fun Int.toCallType(): CallType = when (this) {
        CallLog.Calls.INCOMING_TYPE -> CallType.INCOMING
        CallLog.Calls.OUTGOING_TYPE -> CallType.OUTGOING
        CallLog.Calls.MISSED_TYPE -> CallType.MISSED
        CallLog.Calls.REJECTED_TYPE -> CallType.REJECTED
        CallLog.Calls.BLOCKED_TYPE -> CallType.BLOCKED
        else -> CallType.INCOMING
    }
}
