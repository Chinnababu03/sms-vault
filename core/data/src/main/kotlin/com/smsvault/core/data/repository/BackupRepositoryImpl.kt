package com.smsvault.core.data.repository

import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.smsvault.core.data.db.dao.BackupRecordDao
import com.smsvault.core.data.db.entities.toDomain
import com.smsvault.core.data.db.entities.toEntity
import com.smsvault.core.domain.model.BackupId
import com.smsvault.core.domain.model.BackupLocation
import com.smsvault.core.domain.model.BackupRecord
import com.smsvault.core.domain.model.ContentType
import com.smsvault.core.domain.model.ProviderId
import com.smsvault.core.domain.repository.BackupRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.tasks.await
import java.io.File
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class BackupRepositoryImpl @Inject constructor(
    private val dao: BackupRecordDao,
) : BackupRepository {

    override fun observeBackups(location: BackupLocation): Flow<List<BackupRecord>> =
        dao.observeByProvider(location.provider.name).map { list -> list.map { it.toDomain() } }

    override fun observeAllBackups(): Flow<List<BackupRecord>> =
        dao.observeAll().map { list -> list.map { it.toDomain() } }

    override suspend fun getBackupById(id: BackupId): BackupRecord? =
        dao.getById(id.value)?.toDomain()

    override suspend fun saveBackupRecord(record: BackupRecord): Result<Unit> = runCatching {
        dao.insert(record.toEntity())
    }

    override suspend fun deleteBackup(id: BackupId, location: BackupLocation): Result<Unit> = runCatching {
        val existing = dao.getById(id.value)
        existing?.localPath?.let { path ->
            runCatching { File(path).delete() }
        }
        dao.deleteById(id.value)

        val uid = FirebaseAuth.getInstance().currentUser?.uid
        if (!uid.isNullOrEmpty()) {
            runCatching {
                FirebaseFirestore.getInstance()
                    .collection("users")
                    .document(uid)
                    .collection("backups")
                    .document(id.value)
                    .delete()
                    .await()
            }
        }
        Unit
    }

    override suspend fun syncFromFirestore(): Result<Unit> = runCatching {
        val uid = FirebaseAuth.getInstance().currentUser?.uid ?: return@runCatching Unit
        val snapshot = FirebaseFirestore.getInstance()
            .collection("users")
            .document(uid)
            .collection("backups")
            .get()
            .await()

        for (doc in snapshot.documents) {
            val docId = doc.getString("id") ?: doc.id
            val providerStr = doc.getString("provider") ?: ProviderId.LOCAL.name
            val contentTypeStr = doc.getString("contentType") ?: ContentType.COMBINED.name

            val record = BackupRecord(
                id = docId,
                provider = runCatching { ProviderId.valueOf(providerStr) }.getOrDefault(ProviderId.LOCAL),
                remoteFileId = doc.getString("remoteFileId"),
                localPath = doc.getString("localPath"),
                fileName = doc.getString("fileName") ?: "",
                contentType = runCatching { ContentType.valueOf(contentTypeStr) }.getOrDefault(ContentType.COMBINED),
                itemCount = (doc.getLong("itemCount") ?: 0L).toInt(),
                sizeBytes = doc.getLong("sizeBytes") ?: 0L,
                encrypted = doc.getBoolean("encrypted") ?: true,
                createdAtEpochMs = doc.getLong("createdAtEpochMs") ?: System.currentTimeMillis(),
                checksumSha256 = doc.getString("checksumSha256") ?: "",
            )
            dao.insert(record.toEntity())
        }
        Unit
    }
}
