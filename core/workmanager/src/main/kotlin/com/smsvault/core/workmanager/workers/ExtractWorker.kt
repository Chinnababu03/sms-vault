package com.smsvault.core.workmanager.workers

import android.content.Context
import androidx.work.*
import com.smsvault.core.domain.model.ContentType
import com.smsvault.core.telephony.TelephonyReader
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import java.io.File
import java.util.UUID

/**
 * Step 1 of the backup chain.
 * Reads SMS and Call Logs via paginated ContentResolver queries.
 * Writes raw JSON payload to a staging file and passes the URI to the next worker.
 */
class ExtractWorker(
    context: Context,
    params: WorkerParameters,
) : CoroutineWorker(context, params) {

    companion object {
        const val KEY_INCLUDE_SMS = "include_sms"
        const val KEY_INCLUDE_CALLS = "include_calls"
        const val KEY_STAGING_FILE_PATH = "staging_file_path"
        const val KEY_SMS_COUNT = "sms_count"
        const val KEY_CALL_COUNT = "call_count"
        const val PROGRESS_STAGE = "stage"
        const val PROGRESS_PROCESSED = "processed"
        const val PROGRESS_TOTAL = "total"
    }

    override suspend fun doWork(): Result {
        val telephonyReader = TelephonyReader(applicationContext)

        val includeSms = inputData.getBoolean(KEY_INCLUDE_SMS, true)
        val includeCalls = inputData.getBoolean(KEY_INCLUDE_CALLS, true)

        val smsCount = if (includeSms) telephonyReader.getSmsCount() else 0
        val callCount = if (includeCalls) telephonyReader.getCallLogCount() else 0
        val total = smsCount + callCount

        setProgress(workDataOf("STEP" to "EXTRACTING", PROGRESS_STAGE to "Extracting messages", "PROCESSED_ITEMS" to 0, "TOTAL_ITEMS" to total, PROGRESS_PROCESSED to 0, PROGRESS_TOTAL to total))

        val smsList = if (includeSms) {
            telephonyReader.readAllSms().also { list ->
                setProgress(workDataOf("STEP" to "EXTRACTING", PROGRESS_STAGE to "Extracting messages", "PROCESSED_ITEMS" to list.size, "TOTAL_ITEMS" to total, PROGRESS_PROCESSED to list.size, PROGRESS_TOTAL to total))
            }
        } else emptyList()

        val callList = if (includeCalls) {
            telephonyReader.readAllCallLogs().also {
                setProgress(workDataOf("STEP" to "EXTRACTING", PROGRESS_STAGE to "Extracting call logs", "PROCESSED_ITEMS" to (smsList.size + it.size), "TOTAL_ITEMS" to total, PROGRESS_PROCESSED to (smsList.size + it.size), PROGRESS_TOTAL to total))
            }
        } else emptyList()

        // Write staging file
        val stagingFile = File(applicationContext.cacheDir, "staging_${UUID.randomUUID()}.json")
        val payload = StagingPayload(smsList = smsList, callList = callList)
        stagingFile.writeText(Json.encodeToString(payload))

        return Result.success(
            workDataOf(
                KEY_STAGING_FILE_PATH to stagingFile.absolutePath,
                KEY_SMS_COUNT to smsList.size,
                KEY_CALL_COUNT to callList.size,
            )
        )
    }
}
