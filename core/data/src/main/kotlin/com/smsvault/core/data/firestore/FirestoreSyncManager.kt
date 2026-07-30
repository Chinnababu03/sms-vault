package com.smsvault.core.data.firestore

import android.os.Build
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.SetOptions
import com.smsvault.core.domain.model.AuthUser
import com.smsvault.core.domain.model.BackupRecord
import com.smsvault.core.domain.model.ContentType
import com.smsvault.core.domain.model.ProviderId
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.tasks.await
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class FirestoreSyncManager @Inject constructor() {

    private val firestore: FirebaseFirestore by lazy {
        FirebaseFirestore.getInstance()
    }

    suspend fun syncUserProfile(user: AuthUser): Result<Unit> = runCatching {
        if (user.isAnonymous) return@runCatching
        val docData = mapOf(
            "uid" to user.uid,
            "email" to user.email,
            "displayName" to user.displayName,
            "lastLoginEpochMs" to user.lastLoginEpochMs,
            "updatedAt" to System.currentTimeMillis(),
        )
        firestore.collection("users")
            .document(user.uid)
            .set(docData, SetOptions.merge())
            .await()
        Unit
    }

    suspend fun syncDeviceRegistration(userId: String): Result<Unit> = runCatching {
        val deviceId = Build.FINGERPRINT.take(30).replace("/", "_")
        val deviceData = mapOf(
            "deviceId" to deviceId,
            "model" to Build.MODEL,
            "manufacturer" to Build.MANUFACTURER,
            "sdkVersion" to Build.VERSION.SDK_INT,
            "lastActiveEpochMs" to System.currentTimeMillis(),
        )
        firestore.collection("users")
            .document(userId)
            .collection("devices")
            .document(deviceId)
            .set(deviceData, SetOptions.merge())
            .await()
        Unit
    }

    suspend fun syncCurrentBackupMetadata(record: BackupRecord): Result<Unit> = runCatching {
        val userId = com.google.firebase.auth.FirebaseAuth.getInstance().currentUser?.uid ?: return@runCatching Unit
        syncBackupMetadata(userId, record)
    }

    suspend fun syncBackupMetadata(userId: String, record: BackupRecord): Result<Unit> = runCatching {
        val backupData = mapOf(
            "id" to record.id,
            "provider" to record.provider.name,
            "remoteFileId" to record.remoteFileId,
            "fileName" to record.fileName,
            "contentType" to record.contentType.name,
            "itemCount" to record.itemCount,
            "sizeBytes" to record.sizeBytes,
            "encrypted" to record.encrypted,
            "createdAtEpochMs" to record.createdAtEpochMs,
            "checksumSha256" to record.checksumSha256,
            "deviceName" to "${Build.MANUFACTURER} ${Build.MODEL}",
        )
        firestore.collection("users")
            .document(userId)
            .collection("backups")
            .document(record.id)
            .set(backupData, SetOptions.merge())
            .await()
        Unit
    }

    fun observeRemoteBackups(userId: String): Flow<List<BackupRecord>> = callbackFlow {
        val listener = firestore.collection("users")
            .document(userId)
            .collection("backups")
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    close(error)
                    return@addSnapshotListener
                }
                val records = snapshot?.documents?.mapNotNull { doc ->
                    val id = doc.getString("id") ?: doc.id
                    val providerStr = doc.getString("provider") ?: ProviderId.LOCAL.name
                    val contentTypeStr = doc.getString("contentType") ?: ContentType.COMBINED.name
                    BackupRecord(
                        id = id,
                        provider = runCatching { ProviderId.valueOf(providerStr) }.getOrDefault(ProviderId.LOCAL),
                        remoteFileId = doc.getString("remoteFileId"),
                        localPath = doc.getString("localPath"),
                        fileName = doc.getString("fileName") ?: "",
                        contentType = runCatching { ContentType.valueOf(contentTypeStr) }.getOrDefault(ContentType.COMBINED),
                        itemCount = (doc.getLong("itemCount") ?: 0L).toInt(),
                        sizeBytes = doc.getLong("sizeBytes") ?: 0L,
                        encrypted = doc.getBoolean("encrypted") ?: true,
                        createdAtEpochMs = doc.getLong("createdAtEpochMs") ?: 0L,
                        checksumSha256 = doc.getString("checksumSha256") ?: "",
                    )
                } ?: emptyList()
                trySend(records)
            }
        awaitClose { listener.remove() }
    }
}
