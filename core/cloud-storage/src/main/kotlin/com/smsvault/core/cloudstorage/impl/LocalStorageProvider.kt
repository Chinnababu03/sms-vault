package com.smsvault.core.cloudstorage.impl

import android.content.Context
import com.smsvault.core.cloudstorage.BackupPayloadFile
import com.smsvault.core.cloudstorage.CloudStorageProvider
import com.smsvault.core.cloudstorage.RemoteFileHandle
import com.smsvault.core.domain.model.ProviderId
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class LocalStorageProvider @Inject constructor(
    @ApplicationContext private val context: Context,
) : CloudStorageProvider {

    override val id: ProviderId = ProviderId.LOCAL

    private val backupDir: File
        get() = File(context.getExternalFilesDir(null), "backups").also { it.mkdirs() }

    override suspend fun isAuthorized(): Boolean = true // Local storage is always available

    override suspend fun list(): Result<List<RemoteFileHandle>> = withContext(Dispatchers.IO) {
        runCatching {
            backupDir.listFiles { f -> f.extension in listOf("enc", "xml", "json") }
                ?.map { file ->
                    RemoteFileHandle(
                        id = file.absolutePath,
                        name = file.name,
                        sizeBytes = file.length(),
                        createdAtMs = file.lastModified(),
                        provider = ProviderId.LOCAL,
                    )
                } ?: emptyList()
        }
    }

    override suspend fun upload(file: BackupPayloadFile): Result<RemoteFileHandle> = withContext(Dispatchers.IO) {
        runCatching {
            val dest = File(backupDir, file.fileName)
            dest.writeBytes(file.data)
            RemoteFileHandle(
                id = dest.absolutePath,
                name = dest.name,
                sizeBytes = dest.length(),
                createdAtMs = dest.lastModified(),
                provider = ProviderId.LOCAL,
            )
        }
    }

    override suspend fun download(handle: RemoteFileHandle): Result<BackupPayloadFile> = withContext(Dispatchers.IO) {
        runCatching {
            val file = File(handle.id)
            BackupPayloadFile(
                fileName = file.name,
                data = file.readBytes(),
                sizeBytes = file.length(),
            )
        }
    }

    override suspend fun delete(handle: RemoteFileHandle): Result<Unit> = withContext(Dispatchers.IO) {
        runCatching {
            File(handle.id).delete()
            Unit
        }
    }
}
