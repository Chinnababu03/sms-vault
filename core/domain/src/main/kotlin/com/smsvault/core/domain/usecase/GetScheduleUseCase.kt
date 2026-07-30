package com.smsvault.core.domain.usecase

import com.smsvault.core.domain.model.ScheduleConfig
import com.smsvault.core.domain.repository.ScheduleRepository
import kotlinx.coroutines.flow.Flow

class GetScheduleUseCase(
    private val repository: ScheduleRepository,
) {
    operator fun invoke(): Flow<ScheduleConfig?> = repository.observeSchedule()
}
