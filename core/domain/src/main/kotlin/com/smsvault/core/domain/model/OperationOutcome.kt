package com.smsvault.core.domain.model

sealed interface Outcome<out T> {
    data class Success<T>(val value: T) : Outcome<T>
    data class PartialSuccess<T>(val value: T, val failedCount: Int, val totalCount: Int, val reason: String) : Outcome<T>
    data class Failure(val error: AppError) : Outcome<Nothing>
}

sealed interface AppError {
    data class Network(val message: String) : AppError
    data class Storage(val message: String) : AppError
    data class Crypto(val message: String) : AppError
    data class Permission(val message: String) : AppError
    data class Telephony(val message: String) : AppError
    data object RoleNotHeld : AppError
    data object Cancelled : AppError
    data class Unknown(val throwable: Throwable) : AppError
}

sealed interface OperationStatus {
    data object Idle : OperationStatus
    data class Running(
        val step: OperationStep,
        val processedItems: Int,
        val totalItems: Int,
    ) : OperationStatus
    data class Success(val record: BackupRecord) : OperationStatus
    data class PartialSuccess(val record: BackupRecord, val failedCount: Int) : OperationStatus
    data class Failed(val error: AppError) : OperationStatus
}

enum class OperationStep {
    REQUESTING_ROLE,
    EXTRACTING,
    TRANSFORMING,
    ENCRYPTING,
    UPLOADING,
    RELINQUISHING_ROLE,
}
