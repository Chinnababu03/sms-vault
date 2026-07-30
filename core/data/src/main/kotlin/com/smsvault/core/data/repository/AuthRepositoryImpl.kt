package com.smsvault.core.data.repository

import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.GoogleAuthProvider
import com.smsvault.core.data.firestore.FirestoreSyncManager
import com.smsvault.core.domain.model.AppError
import com.smsvault.core.domain.model.AuthUser
import com.smsvault.core.domain.model.AuthValidation
import com.smsvault.core.domain.model.Outcome
import com.smsvault.core.domain.model.ValidationResult
import com.smsvault.core.domain.repository.AuthRepository
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.tasks.await
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AuthRepositoryImpl @Inject constructor(
    private val firestoreSync: FirestoreSyncManager,
) : AuthRepository {

    private val auth: FirebaseAuth by lazy { FirebaseAuth.getInstance() }

    override fun observeAuthState(): Flow<AuthUser?> = callbackFlow {
        val listener = FirebaseAuth.AuthStateListener { firebaseAuth ->
            val user = firebaseAuth.currentUser?.toDomain()
            trySend(user)
        }
        auth.addAuthStateListener(listener)
        awaitClose { auth.removeAuthStateListener(listener) }
    }

    override suspend fun getCurrentUser(): AuthUser? {
        return auth.currentUser?.toDomain()
    }

    override suspend fun signInWithEmail(email: String, pass: String): Outcome<AuthUser> {
        val emailValidation = AuthValidation.validateEmail(email)
        if (emailValidation is ValidationResult.Invalid) {
            return Outcome.Failure(AppError.Permission(emailValidation.reason))
        }

        val passValidation = AuthValidation.validatePassword(pass)
        if (passValidation is ValidationResult.Invalid) {
            return Outcome.Failure(AppError.Permission(passValidation.reason))
        }

        return try {
            val result = auth.signInWithEmailAndPassword(email.trim(), pass).await()
            val user = result.user?.toDomain()
                ?: return Outcome.Failure(AppError.Permission("Sign in returned empty user."))
            firestoreSync.syncUserProfile(user)
            firestoreSync.syncDeviceRegistration(user.uid)
            Outcome.Success(user)
        } catch (e: Exception) {
            Outcome.Failure(AppError.Permission(e.localizedMessage ?: "Sign in failed."))
        }
    }

    override suspend fun signUpWithEmail(username: String, email: String, pass: String): Outcome<AuthUser> {
        val usernameVal = AuthValidation.validateUsername(username)
        if (usernameVal is ValidationResult.Invalid) {
            return Outcome.Failure(AppError.Permission(usernameVal.reason))
        }

        val emailVal = AuthValidation.validateEmail(email)
        if (emailVal is ValidationResult.Invalid) {
            return Outcome.Failure(AppError.Permission(emailVal.reason))
        }

        val passVal = AuthValidation.validatePassword(pass)
        if (passVal is ValidationResult.Invalid) {
            return Outcome.Failure(AppError.Permission(passVal.reason))
        }

        return try {
            val result = auth.createUserWithEmailAndPassword(email.trim(), pass).await()
            val user = result.user?.toDomain()?.copy(displayName = username.trim())
                ?: return Outcome.Failure(AppError.Permission("Registration returned empty user."))
            firestoreSync.syncUserProfile(user)
            firestoreSync.syncDeviceRegistration(user.uid)
            Outcome.Success(user)
        } catch (e: Exception) {
            Outcome.Failure(AppError.Permission(e.localizedMessage ?: "Registration failed."))
        }
    }

    override suspend fun signInWithGoogle(idToken: String): Outcome<AuthUser> {
        return try {
            val credential = GoogleAuthProvider.getCredential(idToken, null)
            val result = auth.signInWithCredential(credential).await()
            val user = result.user?.toDomain()
                ?: return Outcome.Failure(AppError.Permission("Google Sign-In returned empty user."))
            firestoreSync.syncUserProfile(user)
            firestoreSync.syncDeviceRegistration(user.uid)
            Outcome.Success(user)
        } catch (e: Exception) {
            Outcome.Failure(AppError.Permission(e.localizedMessage ?: "Google Sign-In failed."))
        }
    }

    override suspend fun continueAsGuest(): Outcome<AuthUser> {
        return try {
            val result = auth.signInAnonymously().await()
            val user = result.user?.toDomain()
                ?: return Outcome.Failure(AppError.Permission("Guest sign-in failed."))
            Outcome.Success(user)
        } catch (e: Exception) {
            // Local offline fallback guest user if network unavailable
            val guestUser = AuthUser(
                uid = "guest_local_${System.currentTimeMillis()}",
                email = "guest.vault@local",
                displayName = "Local Vault Guest",
                isAnonymous = true,
            )
            Outcome.Success(guestUser)
        }
    }

    override suspend fun signOut(): Outcome<Unit> {
        return try {
            auth.signOut()
            Outcome.Success(Unit)
        } catch (e: Exception) {
            Outcome.Failure(AppError.Permission(e.localizedMessage ?: "Sign out failed."))
        }
    }

    private fun com.google.firebase.auth.FirebaseUser.toDomain(): AuthUser {
        return AuthUser(
            uid = uid,
            email = email ?: "user.vault@cloud.org",
            displayName = displayName ?: email?.substringBefore("@") ?: "Vault User",
            photoUrl = photoUrl?.toString(),
            isAnonymous = isAnonymous,
            createdAtEpochMs = metadata?.creationTimestamp ?: System.currentTimeMillis(),
            lastLoginEpochMs = metadata?.lastSignInTimestamp ?: System.currentTimeMillis(),
        )
    }
}
