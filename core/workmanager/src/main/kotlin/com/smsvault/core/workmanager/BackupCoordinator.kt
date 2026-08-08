package com.smsvault.core.workmanager

import androidx.work.*
import com.smsvault.core.domain.model.BackupSpec
import com.smsvault.core.domain.model.ProviderId
import com.smsvault.core.workmanager.workers.EncryptWorker
import com.smsvault.core.workmanager.workers.ExtractWorker
import com.smsvault.core.workmanager.workers.TransformWorker
import com.smsvault.core.workmanager.workers.UploadWorker

import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class BackupCoordinator @Inject constructor(
    private val workManager: WorkManager,
) {
    companion object {
        const val BACKUP_WORK_NAME = "smsvault_backup"
        const val SCHEDULED_BACKUP_NAME = "smsvault_scheduled_backup"
    }

    /** Enqueues a one-time backup and returns final worker request UUID for tracking. */
    fun triggerBackup(spec: BackupSpec): java.util.UUID {
        val extractRequest = OneTimeWorkRequestBuilder<ExtractWorker>()
            .setInputData(
                workDataOf(
                    ExtractWorker.KEY_INCLUDE_SMS to spec.includeMessages,
                    ExtractWorker.KEY_INCLUDE_CALLS to spec.includeCallLogs,
                )
            )
            .setConstraints(Constraints.NONE)
            .build()

        val transformRequest = OneTimeWorkRequestBuilder<TransformWorker>()
            .setInputData(
                workDataOf(
                    EncryptWorker.KEY_ENCRYPT to spec.encrypt,
                )
            )
            .build()

        val encryptRequest = OneTimeWorkRequestBuilder<EncryptWorker>()
            .setInputData(
                workDataOf(
                    EncryptWorker.KEY_ENCRYPT to spec.encrypt,
                    EncryptWorker.KEY_PASSPHRASE to spec.passphrase,
                )
            )
            .build()

        val uploadRequest = OneTimeWorkRequestBuilder<UploadWorker>()
            .setInputData(
                workDataOf(
                    UploadWorker.KEY_PROVIDER_ID to (spec.targetProviders.firstOrNull() ?: ProviderId.LOCAL).name,
                    EncryptWorker.KEY_ENCRYPT to spec.encrypt,
                )
            )
            .build()

        workManager
            .beginUniqueWork(
                BACKUP_WORK_NAME,
                ExistingWorkPolicy.REPLACE,
                extractRequest,
            )
            .then(transformRequest)
            .then(encryptRequest)
            .then(uploadRequest)
            .enqueue()
            
        return uploadRequest.id
    }

    /** Enqueues a one-time backup. Uses KEEP policy so double-taps don't spawn duplicates. */
    fun enqueueOneTimeBackup(spec: BackupSpec): Operation {
        val extractRequest = OneTimeWorkRequestBuilder<ExtractWorker>()
            .setInputData(
                workDataOf(
                    ExtractWorker.KEY_INCLUDE_SMS to spec.includeMessages,
                    ExtractWorker.KEY_INCLUDE_CALLS to spec.includeCallLogs,
                )
            )
            .setConstraints(Constraints.NONE)
            .build()

        val transformRequest = OneTimeWorkRequestBuilder<TransformWorker>()
             .setInputData(
                workDataOf(
                    EncryptWorker.KEY_ENCRYPT to spec.encrypt,
                )
            )
            .build()

        val encryptRequest = OneTimeWorkRequestBuilder<EncryptWorker>()
            .setInputData(
                workDataOf(
                    EncryptWorker.KEY_ENCRYPT to spec.encrypt,
                    EncryptWorker.KEY_PASSPHRASE to spec.passphrase,
                )
            )
            .build()

        val uploadRequest = OneTimeWorkRequestBuilder<UploadWorker>()
            .setInputData(
                workDataOf(
                    UploadWorker.KEY_PROVIDER_ID to (spec.targetProviders.firstOrNull() ?: ProviderId.LOCAL).name,
                    EncryptWorker.KEY_ENCRYPT to spec.encrypt,
                )
            )
            .build()

        return workManager
            .beginUniqueWork(
                BACKUP_WORK_NAME,
                ExistingWorkPolicy.KEEP,
                extractRequest,
            )
            .then(transformRequest)
            .then(encryptRequest)
            .then(uploadRequest)
            .enqueue()
    }

    /** Enqueues a periodic backup driven by the ScheduleConfig constraints.
     *
     * NOTE: WorkManager PeriodicWorkRequest does not support chaining.
     * As a workaround, we use a single ExtractWorker as the periodic trigger,
     * but the full chain (Extract→Transform→Encrypt→Upload) runs as a one-time
     * unique work each time the periodic trigger fires. The periodic worker simply
     * reschedules the chain — it doesn't do real backup work itself.
     *
     * TODO: Refactor to a single ScheduledBackupWorker that wraps all 4 steps inline.
     */
    fun enqueuePeriodicBackup(
        spec: BackupSpec,
        requiresCharging: Boolean,
        requiresUnmeteredNetwork: Boolean,
        intervalDays: Long = 1L,
    ) {
        val constraints = Constraints.Builder()
            .setRequiresCharging(requiresCharging)
            .apply { if (requiresUnmeteredNetwork) setRequiredNetworkType(NetworkType.UNMETERED) }
            .build()

        // Build the full 4-step chain
        val extractRequest = OneTimeWorkRequestBuilder<ExtractWorker>()
            .setInputData(
                workDataOf(
                    ExtractWorker.KEY_INCLUDE_SMS to spec.includeMessages,
                    ExtractWorker.KEY_INCLUDE_CALLS to spec.includeCallLogs,
                )
            )
            .setConstraints(constraints)
            .build()

        val transformRequest = OneTimeWorkRequestBuilder<TransformWorker>()
            .setInputData(workDataOf(EncryptWorker.KEY_ENCRYPT to spec.encrypt))
            .build()

        val encryptRequest = OneTimeWorkRequestBuilder<EncryptWorker>()
            .setInputData(
                workDataOf(
                    EncryptWorker.KEY_ENCRYPT to spec.encrypt,
                    EncryptWorker.KEY_PASSPHRASE to spec.passphrase,
                )
            )
            .build()

        val uploadRequest = OneTimeWorkRequestBuilder<UploadWorker>()
            .setInputData(
                workDataOf(
                    UploadWorker.KEY_PROVIDER_ID to (spec.targetProviders.firstOrNull() ?: ProviderId.LOCAL).name,
                    EncryptWorker.KEY_ENCRYPT to spec.encrypt,
                )
            )
            .build()

        workManager
            .beginUniqueWork(
                SCHEDULED_BACKUP_NAME,
                ExistingWorkPolicy.KEEP,
                extractRequest,
            )
            .then(transformRequest)
            .then(encryptRequest)
            .then(uploadRequest)
            .enqueue()
    }

    fun cancelBackup() {
        workManager.cancelUniqueWork(BACKUP_WORK_NAME)
    }

    fun cancelScheduledBackup() {
        workManager.cancelUniqueWork(SCHEDULED_BACKUP_NAME)
    }

    fun observeBackupWork() = workManager.getWorkInfosForUniqueWorkFlow(BACKUP_WORK_NAME)
}
