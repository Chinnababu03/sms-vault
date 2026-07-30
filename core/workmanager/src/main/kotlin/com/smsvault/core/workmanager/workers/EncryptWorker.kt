package com.smsvault.core.workmanager.workers

import android.content.Context
import androidx.work.*
import com.smsvault.core.crypto.CryptoEngine
import com.smsvault.core.domain.model.Outcome
import java.io.File
import java.util.UUID

/**
 * Step 3: Encrypts the transform output using CryptoEngine (AES-256-GCM, SVLT format).
 * If encryption is disabled, passes the file through unchanged.
 */
class EncryptWorker(
    context: Context,
    params: WorkerParameters,
) : CoroutineWorker(context, params) {

    companion object {
        const val KEY_ENCRYPT = "encrypt"
        const val KEY_PASSPHRASE = "passphrase"
        
        const val KEY_ENCRYPTED_FILE_PATHS = "encrypted_file_paths"
        const val KEY_FILE_SIZES = "file_sizes"
    }

    override suspend fun doWork(): Result {
        val cryptoEngine = CryptoEngine()
        val transformPaths = inputData.getStringArray(TransformWorker.KEY_TRANSFORM_FILE_PATHS)
            ?: return Result.failure(workDataOf("error" to "Missing transform file paths"))
        val checksums = inputData.getStringArray(TransformWorker.KEY_CHECKSUMS) ?: emptyArray()
        val itemCounts = inputData.getIntArray(TransformWorker.KEY_ITEM_COUNTS) ?: intArrayOf()
        val contentTypes = inputData.getStringArray(TransformWorker.KEY_CONTENT_TYPES) ?: emptyArray()
        
        val encrypt = inputData.getBoolean(KEY_ENCRYPT, true)
        val passphrase = inputData.getString(KEY_PASSPHRASE)

        setProgress(workDataOf("STEP" to "ENCRYPTING", ExtractWorker.PROGRESS_STAGE to "Encrypting payload"))

        val encryptedPaths = mutableListOf<String>()
        val fileSizes = mutableListOf<Long>()

        for (i in transformPaths.indices) {
            val transformPath = transformPaths[i]
            val transformFile = File(transformPath)
            val plaintext = transformFile.readBytes()
            transformFile.delete()

            val outputData: ByteArray = if (encrypt) {
                val outcome = if (passphrase != null) {
                    cryptoEngine.encryptWithPassphrase(plaintext, passphrase)
                } else {
                    cryptoEngine.encrypt(plaintext)
                }
                when (outcome) {
                    is Outcome.Success -> outcome.value
                    is Outcome.Failure -> return Result.failure(workDataOf("error" to "Encryption failed: ${outcome.error}"))
                    is Outcome.PartialSuccess -> return Result.failure(workDataOf("error" to "Unexpected partial outcome during encryption"))
                }
            } else {
                plaintext
            }

            val ext = if (encrypt) ".enc" else ".xml"
            val encFile = File(applicationContext.cacheDir, "encrypted_${UUID.randomUUID()}$ext")
            encFile.writeBytes(outputData)
            
            encryptedPaths.add(encFile.absolutePath)
            fileSizes.add(encFile.length())
        }

        return Result.success(
            workDataOf(
                KEY_ENCRYPTED_FILE_PATHS to encryptedPaths.toTypedArray(),
                KEY_FILE_SIZES to fileSizes.toLongArray(),
                TransformWorker.KEY_CHECKSUMS to checksums,
                TransformWorker.KEY_ITEM_COUNTS to itemCounts,
                TransformWorker.KEY_CONTENT_TYPES to contentTypes,
                KEY_ENCRYPT to encrypt,
            )
        )
    }
}
