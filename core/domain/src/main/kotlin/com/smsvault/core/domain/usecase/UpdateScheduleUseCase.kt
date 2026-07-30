package com.smsvault.core.domain.usecase

import com.smsvault.core.domain.model.AppError
import com.smsvault.core.domain.model.Outcome
import com.smsvault.core.domain.model.ScheduleConfig
import com.smsvault.core.domain.repository.ScheduleRepository

class UpdateScheduleUseCase(
    private val repository: ScheduleRepository,
) {
    suspend operator fun invoke(config: ScheduleConfig): Outcome<Unit> {
        return repository.saveSchedule(config).fold(
            onSuccess = { Outcome.Success(Unit) },
            onFailure = { Outcome.Failure(AppError.Unknown(it)) }
        )
    }
}
