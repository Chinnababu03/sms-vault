package com.smsvault.core.workmanager.workers

import android.content.Context
import androidx.work.*
import com.smsvault.core.domain.model.BackupPayload
import com.smsvault.core.domain.model.ContentType
import com.smsvault.core.domain.model.SmsMessage
import com.smsvault.core.domain.model.CallLogEntry
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import java.io.File
import java.security.MessageDigest
import java.util.UUID

/**
 * Step 2: Reads staging JSON, builds the versioned BackupPayload,
 * computes SHA-256 checksum, writes the final plaintext payload file.
 * If encryption is disabled, generates standard XML files for SMS/Calls.
 */
class TransformWorker(
    context: Context,
    params: WorkerParameters,
) : CoroutineWorker(context, params) {

    companion object {
        const val KEY_TRANSFORM_FILE_PATHS = "transform_file_paths"
        const val KEY_CHECKSUMS = "checksums"
        const val KEY_ITEM_COUNTS = "item_counts"
        const val KEY_CONTENT_TYPES = "content_types"
    }

    override suspend fun doWork(): Result {
        val stagingPath = inputData.getString(ExtractWorker.KEY_STAGING_FILE_PATH)
            ?: return Result.failure(workDataOf("error" to "Missing staging file path"))
        val stagingFile = File(stagingPath)
        if (!stagingFile.exists()) return Result.failure(workDataOf("error" to "Staging file not found"))

        val staging = Json.decodeFromString<StagingPayload>(stagingFile.readText())
        stagingFile.delete() // Clean up staging file immediately

        val encrypt = inputData.getBoolean(EncryptWorker.KEY_ENCRYPT, true)
        val itemCount = staging.smsList.size + staging.callList.size
        setProgress(workDataOf("STEP" to "TRANSFORMING", "PROCESSED_ITEMS" to itemCount, "TOTAL_ITEMS" to itemCount))

        val transformPaths = mutableListOf<String>()
        val checksums = mutableListOf<String>()
        val itemCounts = mutableListOf<Int>()
        val contentTypes = mutableListOf<String>()

        if (!encrypt) {
            // Unencrypted XML paths
            if (staging.smsList.isNotEmpty()) {
                val xmlStr = generateSmsXml(staging.smsList)
                val file = File(applicationContext.cacheDir, "transform_${UUID.randomUUID()}.xml")
                file.writeText(xmlStr)
                transformPaths.add(file.absolutePath)
                checksums.add(sha256Hex(xmlStr.toByteArray()))
                itemCounts.add(staging.smsList.size)
                contentTypes.add(ContentType.SMS.name)
            }
            if (staging.callList.isNotEmpty()) {
                val xmlStr = generateCallsXml(staging.callList)
                val file = File(applicationContext.cacheDir, "transform_${UUID.randomUUID()}.xml")
                file.writeText(xmlStr)
                transformPaths.add(file.absolutePath)
                checksums.add(sha256Hex(xmlStr.toByteArray()))
                itemCounts.add(staging.callList.size)
                contentTypes.add(ContentType.CALL_LOG.name)
            }
        } else {
            // Encrypted SVLT JSON paths
            val contentType = when {
                staging.smsList.isNotEmpty() && staging.callList.isNotEmpty() -> ContentType.COMBINED
                staging.smsList.isNotEmpty() -> ContentType.SMS
                else -> ContentType.CALL_LOG
            }
            val timestamp = System.currentTimeMillis()
            val payload = BackupPayload(
                schemaVersion = 1,
                generatedBy = "SMS Vault 1.0.0",
                contentType = contentType,
                itemCount = itemCount,
                checksumSha256 = "",
                createdAtEpochMs = timestamp,
                smsList = staging.smsList,
                callLogList = staging.callList,
            )
            val payloadJson = Json.encodeToString(payload)
            val checksum = sha256Hex(payloadJson.toByteArray())
            val finalPayload = payload.copy(checksumSha256 = checksum)
            val finalJson = Json.encodeToString(finalPayload)
            val transformFile = File(applicationContext.cacheDir, "transform_${UUID.randomUUID()}.json")
            transformFile.writeText(finalJson)
            
            transformPaths.add(transformFile.absolutePath)
            checksums.add(checksum)
            itemCounts.add(itemCount)
            contentTypes.add(contentType.name)
        }

        return Result.success(
            workDataOf(
                KEY_TRANSFORM_FILE_PATHS to transformPaths.toTypedArray(),
                KEY_CHECKSUMS to checksums.toTypedArray(),
                KEY_ITEM_COUNTS to itemCounts.toTypedArray(),
                KEY_CONTENT_TYPES to contentTypes.toTypedArray(),
            )
        )
    }

    private fun generateSmsXml(list: List<SmsMessage>): String {
        val sb = StringBuilder()
        sb.append("<?xml version='1.0' encoding='UTF-8' standalone='yes' ?>\n")
        sb.append("<!--File Created By SMS Vault-->\n")
        sb.append("<smses count=\"${list.size}\">\n")
        for (sms in list) {
            val body = sms.body.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;").replace("'", "&apos;")
            val address = sms.address.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;").replace("'", "&apos;")
            
            val typeStr = when (sms.type.name) {
                "INBOX" -> "1"
                "SENT" -> "2"
                "DRAFT" -> "3"
                "OUTBOX" -> "4"
                "FAILED" -> "5"
                else -> "1"
            }
            val readStr = if (sms.read) "1" else "0"
            sb.append("  <sms protocol=\"0\" address=\"$address\" date=\"${sms.dateMs}\" type=\"$typeStr\" subject=\"null\" body=\"$body\" toa=\"null\" sc_toa=\"null\" service_center=\"null\" read=\"$readStr\" status=\"-1\" locked=\"0\" date_sent=\"${sms.dateSentMs}\" sub_id=\"-1\" readable_date=\"\" contact_name=\"(Unknown)\" />\n")
        }
        sb.append("</smses>\n")
        return sb.toString()
    }

    private fun generateCallsXml(list: List<CallLogEntry>): String {
        val sb = StringBuilder()
        sb.append("<?xml version='1.0' encoding='UTF-8' standalone='yes' ?>\n")
        sb.append("<!--File Created By SMS Vault-->\n")
        sb.append("<calls count=\"${list.size}\">\n")
        for (call in list) {
            val number = call.number.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;").replace("'", "&apos;")
            val name = (call.cachedName ?: "").replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;").replace("'", "&apos;")
            val typeStr = when (call.type.name) {
                "INCOMING" -> "1"
                "OUTGOING" -> "2"
                "MISSED" -> "3"
                "REJECTED" -> "5"
                "BLOCKED" -> "6"
                else -> "1"
            }
            sb.append("  <call number=\"$number\" duration=\"${call.durationSeconds}\" date=\"${call.dateMs}\" type=\"$typeStr\" presentation=\"1\" subscription_component_name=\"null\" subscription_id=\"null\" post_dial_digits=\"\" default_sim=\"0\" contact_name=\"$name\" />\n")
        }
        sb.append("</calls>\n")
        return sb.toString()
    }

    private fun sha256Hex(data: ByteArray): String {
        val digest = MessageDigest.getInstance("SHA-256")
        return digest.digest(data).joinToString("") { "%02x".format(it) }
    }
}
