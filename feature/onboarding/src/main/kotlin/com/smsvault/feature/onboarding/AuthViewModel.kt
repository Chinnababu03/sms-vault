package com.smsvault.feature.onboarding

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.smsvault.core.domain.model.AuthUser
import com.smsvault.core.domain.model.Outcome
import com.smsvault.core.domain.repository.AuthRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class AuthUiState(
    val emailInput: String = "",
    val passwordInput: String = "",
    val usernameInput: String = "",
    val isRegisterMode: Boolean = false,
    val isLoading: Boolean = false,
    val isCheckingAuth: Boolean = true,
    val errorMessage: String? = null,
    val successMessage: String? = null,
    val user: AuthUser? = null,
)

class AuthViewModel(
    private val authRepository: AuthRepository,
) : ViewModel() {

    private val _uiState = MutableStateFlow(AuthUiState())
    val uiState: StateFlow<AuthUiState> = _uiState.asStateFlow()

    private var ignoreAuthEmissions = false

    init {
        viewModelScope.launch {
            authRepository.observeAuthState().collect { user ->
                // Prevent automatic login navigation during sign-up process
                if (!ignoreAuthEmissions) {
                    _uiState.value = _uiState.value.copy(user = user, isLoading = false, isCheckingAuth = false)
                }
            }
        }
    }

    fun onEmailChanged(value: String) {
        _uiState.value = _uiState.value.copy(emailInput = value, errorMessage = null, successMessage = null)
    }

    fun onPasswordChanged(value: String) {
        _uiState.value = _uiState.value.copy(passwordInput = value, errorMessage = null, successMessage = null)
    }

    fun onUsernameChanged(value: String) {
        _uiState.value = _uiState.value.copy(usernameInput = value, errorMessage = null, successMessage = null)
    }

    fun toggleMode(isRegister: Boolean) {
        _uiState.value = _uiState.value.copy(isRegisterMode = isRegister, errorMessage = null, successMessage = null)
    }

    fun signIn() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null, successMessage = null)
            val outcome = authRepository.signInWithEmail(_uiState.value.emailInput, _uiState.value.passwordInput)
            when (outcome) {
                is Outcome.Success -> _uiState.value = _uiState.value.copy(isLoading = false, user = outcome.value)
                is Outcome.Failure -> _uiState.value = _uiState.value.copy(isLoading = false, errorMessage = outcome.error.toString())
                is Outcome.PartialSuccess -> Unit
            }
        }
    }

    fun signUp() {
        viewModelScope.launch {
            ignoreAuthEmissions = true
            _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null, successMessage = null)
            val outcome = authRepository.signUpWithEmail(_uiState.value.usernameInput, _uiState.value.emailInput, _uiState.value.passwordInput)
            when (outcome) {
                is Outcome.Success -> {
                    // Sign out immediately so user lands on Login screen to sign in with their created account
                    authRepository.signOut()
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        isRegisterMode = false, // Switch back to Sign In tab
                        passwordInput = "",
                        user = null,
                        successMessage = "Account created successfully! Please sign in to enter your vault.",
                    )
                    kotlinx.coroutines.delay(1000)
                    ignoreAuthEmissions = false
                }
                is Outcome.Failure -> {
                    _uiState.value = _uiState.value.copy(isLoading = false, errorMessage = outcome.error.toString())
                    ignoreAuthEmissions = false
                }
                is Outcome.PartialSuccess -> {
                    ignoreAuthEmissions = false
                }
            }
        }
    }

    fun signInWithGoogle(idToken: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null, successMessage = null)
            val outcome = authRepository.signInWithGoogle(idToken)
            when (outcome) {
                is Outcome.Success -> _uiState.value = _uiState.value.copy(isLoading = false, user = outcome.value)
                is Outcome.Failure -> _uiState.value = _uiState.value.copy(isLoading = false, errorMessage = outcome.error.toString())
                is Outcome.PartialSuccess -> Unit
            }
        }
    }

    fun signOut() {
        viewModelScope.launch {
            authRepository.signOut()
            _uiState.value = AuthUiState()
        }
    }

    fun clearMessages() {
        _uiState.value = _uiState.value.copy(errorMessage = null, successMessage = null)
    }

    fun setError(msg: String) {
        _uiState.value = _uiState.value.copy(errorMessage = msg, isLoading = false)
    }
}
