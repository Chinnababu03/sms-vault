package com.smsvault.core.domain.repository

import com.smsvault.core.domain.model.AuthUser
import com.smsvault.core.domain.model.Outcome
import kotlinx.coroutines.flow.Flow

interface AuthRepository {
    fun observeAuthState(): Flow<AuthUser?>
    suspend fun getCurrentUser(): AuthUser?
    suspend fun signInWithEmail(email: String, pass: String): Outcome<AuthUser>
    suspend fun signUpWithEmail(username: String, email: String, pass: String): Outcome<AuthUser>
    suspend fun signInWithGoogle(idToken: String): Outcome<AuthUser>
    suspend fun continueAsGuest(): Outcome<AuthUser>
    suspend fun signOut(): Outcome<Unit>
}
