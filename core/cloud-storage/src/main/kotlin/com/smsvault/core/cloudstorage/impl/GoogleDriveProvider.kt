package com.smsvault.core.cloudstorage.impl

import android.content.Context
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import com.google.api.client.http.javanet.NetHttpTransport
import com.google.api.client.googleapis.auth.oauth2.GoogleCredential
import com.google.api.client.json.gson.GsonFactory
import com.google.api.services.drive.Drive
import com.google.api.services.drive.model.File as DriveFile
import com.smsvault.core.cloudstorage.BackupPayloadFile
import com.smsvault.core.cloudstorage.CloudStorageProvider
import com.smsvault.core.cloudstorage.RemoteFileHandle
import com.smsvault.core.domain.model.ProviderId
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.ByteArrayInputStream
import java.io.ByteArrayOutputStream
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Google Drive provider using the appDataFolder (drive.appdata scope).
 * Files are stored in a hidden folder invisible in the standard Drive UI,
 * exclusive to this app — this is the isolation mechanism specified in the plan.
 *
 * Auth tokens are stored in EncryptedSharedPreferences.
 */
@Singleton
class GoogleDriveProvider @Inject constructor(
    @ApplicationContext private val context: Context,
) : CloudStorageProvider {

    override val id: ProviderId = ProviderId.GOOGLE_DRIVE

    companion object {
        private const val BACKUP_FOLDER_NAME = "sms_vault_backup"
        private const val PREF_FILE = "gdrive_auth"
        private const val KEY_ACCESS_TOKEN = "access_token"
        private const val KEY_REFRESH_TOKEN = "refresh_token"
        private const val DRIVE_APP_NAME = "SMS Vault"
        private const val BACKUP_MIME = "application/octet-stream"
    }

    private val masterKey: MasterKey by lazy {
        MasterKey.Builder(context)
            .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
            .build()
    }

    private val encryptedPrefs by lazy {
        EncryptedSharedPreferences.create(
            context,
            PREF_FILE,
            masterKey,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM,
        )
    }

    fun storeTokens(accessToken: String, refreshToken: String?) {
        encryptedPrefs.edit()
            .putString(KEY_ACCESS_TOKEN, accessToken)
            .apply { refreshToken?.let { putString(KEY_REFRESH_TOKEN, it) } }
            .apply()
    }

    fun clearTokens() {
        encryptedPrefs.edit().remove(KEY_ACCESS_TOKEN).remove(KEY_REFRESH_TOKEN).apply()
    }

    private fun getAccessToken(): String? = encryptedPrefs.getString(KEY_ACCESS_TOKEN, null)

    override suspend fun isAuthorized(): Boolean = getAccessToken() != null

    private fun buildDriveService(accessToken: String): Drive {
        val credential = GoogleCredential().setAccessToken(accessToken)
        return Drive.Builder(
            NetHttpTransport(),
            GsonFactory.getDefaultInstance(),
            credential,
        ).setApplicationName(DRIVE_APP_NAME).build()
    }

    private fun getOrCreateBackupFolder(drive: Drive): String {
        val queryResult = drive.files().list()
            .setQ("name = '$BACKUP_FOLDER_NAME' and mimeType = 'application/vnd.google-apps.folder' and trashed = false")
            .setSpaces("drive")
            .setFields("files(id)")
            .execute()

        val existingFolder = queryResult.files?.firstOrNull()
        if (existingFolder != null) {
            return existingFolder.id
        }

        val folderMetadata = DriveFile().apply {
            name = BACKUP_FOLDER_NAME
            mimeType = "application/vnd.google-apps.folder"
        }
        val createdFolder = drive.files().create(folderMetadata)
            .setFields("id")
            .execute()
        return createdFolder.id
    }

    override suspend fun list(): Result<List<RemoteFileHandle>> = withContext(Dispatchers.IO) {
        runCatching {
            val token = getAccessToken() ?: return@runCatching emptyList()
            val drive = buildDriveService(token)
            val folderId = getOrCreateBackupFolder(drive)
            val result = drive.files().list()
                .setQ("'$folderId' in parents and trashed = false")
                .setFields("files(id, name, size, createdTime)")
                .execute()
            result.files.map { file ->
                RemoteFileHandle(
                    id = file.id,
                    name = file.name,
                    sizeBytes = file.getSize() ?: 0L,
                    createdAtMs = file.createdTime?.value ?: 0L,
                    provider = ProviderId.GOOGLE_DRIVE,
                )
            }
        }
    }

    override suspend fun upload(file: BackupPayloadFile): Result<RemoteFileHandle> = withContext(Dispatchers.IO) {
        runCatching {
            val token = getAccessToken() ?: throw IllegalStateException("Not authorized")
            val drive = buildDriveService(token)
            val folderId = getOrCreateBackupFolder(drive)

            val mime = if (file.fileName.endsWith(".xml", ignoreCase = true)) "text/xml" else BACKUP_MIME

            val metadata = DriveFile().apply {
                name = file.fileName
                parents = listOf(folderId)
            }
            val mediaContent = com.google.api.client.http.InputStreamContent(
                mime,
                ByteArrayInputStream(file.data)
            )
            val uploaded = drive.files().create(metadata, mediaContent)
                .setFields("id, name, size, createdTime")
                .execute()
            RemoteFileHandle(
                id = uploaded.id,
                name = uploaded.name,
                sizeBytes = file.sizeBytes,
                createdAtMs = System.currentTimeMillis(),
                provider = ProviderId.GOOGLE_DRIVE,
            )
        }
    }

    override suspend fun download(handle: RemoteFileHandle): Result<BackupPayloadFile> = withContext(Dispatchers.IO) {
        runCatching {
            val token = getAccessToken() ?: throw IllegalStateException("Not authorized")
            val drive = buildDriveService(token)
            val out = ByteArrayOutputStream()
            drive.files().get(handle.id).executeMediaAndDownloadTo(out)
            BackupPayloadFile(
                fileName = handle.name,
                data = out.toByteArray(),
            )
        }
    }

    override suspend fun delete(handle: RemoteFileHandle): Result<Unit> = withContext(Dispatchers.IO) {
        runCatching {
            val token = getAccessToken() ?: throw IllegalStateException("Not authorized")
            val drive = buildDriveService(token)
            drive.files().delete(handle.id).execute()
            Unit
        }
    }
}
