package com.smsvault.core.domain.model

import kotlinx.serialization.Serializable

@Serializable
data class AuthUser(
    val uid: String,
    val email: String,
    val displayName: String = "",
    val photoUrl: String? = null,
    val isAnonymous: Boolean = false,
    val createdAtEpochMs: Long = System.currentTimeMillis(),
    val lastLoginEpochMs: Long = System.currentTimeMillis(),
)

sealed interface ValidationResult {
    data object Valid : ValidationResult
    data class Invalid(val reason: String) : ValidationResult
}

object AuthValidation {
    private val EMAIL_REGEX = Regex("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}\$")

    fun validateEmail(email: String): ValidationResult {
        val trimmed = email.trim()
        return when {
            trimmed.isEmpty() -> ValidationResult.Invalid("Email address cannot be empty.")
            !EMAIL_REGEX.matches(trimmed) -> ValidationResult.Invalid("Please enter a valid email address.")
            else -> ValidationResult.Valid
        }
    }

    fun validatePassword(password: String): ValidationResult {
        return when {
            password.isEmpty() -> ValidationResult.Invalid("Master Password cannot be empty.")
            password.length < 8 -> ValidationResult.Invalid("Password must be at least 8 characters long.")
            !password.any { it.isUpperCase() } -> ValidationResult.Invalid("Password must contain at least one uppercase letter.")
            !password.any { it.isDigit() } -> ValidationResult.Invalid("Password must contain at least one numeric digit.")
            !password.any { !it.isLetterOrDigit() } -> ValidationResult.Invalid("Password must contain at least one special character.")
            else -> ValidationResult.Valid
        }
    }

    fun validateUsername(username: String): ValidationResult {
        val trimmed = username.trim()
        return when {
            trimmed.isEmpty() -> ValidationResult.Invalid("Username cannot be empty.")
            trimmed.length < 2 -> ValidationResult.Invalid("Username must be at least 2 characters long.")
            else -> ValidationResult.Valid
        }
    }
}
