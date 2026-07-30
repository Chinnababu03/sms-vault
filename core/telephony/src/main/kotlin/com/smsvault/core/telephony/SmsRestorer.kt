package com.smsvault.core.telephony

import android.content.ContentValues
import android.content.Context
import android.net.Uri
import android.provider.CallLog
import android.provider.Telephony
import com.smsvault.core.domain.model.CallLogEntry
import com.smsvault.core.domain.model.CallType
import com.smsvault.core.domain.model.SmsMessage
import com.smsvault.core.domain.model.SmsType
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class SmsRestorer @Inject constructor(
    @ApplicationContext private val context: Context,
) {
    /**
     * Writes SMS to device. Requires ROLE_SMS to be held.
     * @return count of successfully written messages
     */
    suspend fun restoreSmsBatch(smsList: List<SmsMessage>): Int = withContext(Dispatchers.IO) {
        var written = 0
        for (sms in smsList) {
            val uri = when (sms.type) {
                SmsType.INBOX -> Uri.parse("content://sms/inbox")
                SmsType.SENT -> Uri.parse("content://sms/sent")
                SmsType.DRAFT -> Uri.parse("content://sms/draft")
                else -> Telephony.Sms.CONTENT_URI
            }
            val values = ContentValues().apply {
                put(Telephony.Sms.ADDRESS, sms.address)
                put(Telephony.Sms.BODY, sms.body)
                put(Telephony.Sms.DATE, sms.dateMs)
                put(Telephony.Sms.DATE_SENT, sms.dateSentMs)
                put(Telephony.Sms.TYPE, sms.type.toRawType())
                put(Telephony.Sms.READ, if (sms.read) 1 else 0)
                put(Telephony.Sms.THREAD_ID, sms.threadId)
            }
            runCatching { context.contentResolver.insert(uri, values) }
                .onSuccess { written++ }
        }
        written
    }

    /**
     * Writes Call Logs to device.
     * @return count of successfully written call logs
     */
    suspend fun restoreCallLogBatch(callList: List<CallLogEntry>): Int = withContext(Dispatchers.IO) {
        var written = 0
        val uri = CallLog.Calls.CONTENT_URI
        for (call in callList) {
            val values = ContentValues().apply {
                put(CallLog.Calls.NUMBER, call.number)
                put(CallLog.Calls.TYPE, call.type.toRawType())
                put(CallLog.Calls.DATE, call.dateMs)
                put(CallLog.Calls.DURATION, call.durationSeconds)
                if (!call.cachedName.isNullOrBlank()) {
                    put(CallLog.Calls.CACHED_NAME, call.cachedName)
                }
            }
            runCatching { context.contentResolver.insert(uri, values) }
                .onSuccess { written++ }
        }
        written
    }

    private fun SmsType.toRawType(): Int = when (this) {
        SmsType.INBOX -> 1
        SmsType.SENT -> 2
        SmsType.DRAFT -> 3
        SmsType.OUTBOX -> 4
        SmsType.FAILED -> 5
    }

    private fun CallType.toRawType(): Int = when (this) {
        CallType.INCOMING -> CallLog.Calls.INCOMING_TYPE
        CallType.OUTGOING -> CallLog.Calls.OUTGOING_TYPE
        CallType.MISSED -> CallLog.Calls.MISSED_TYPE
        CallType.REJECTED -> CallLog.Calls.REJECTED_TYPE
        CallType.BLOCKED -> CallLog.Calls.BLOCKED_TYPE
    }
}
