package com.smsvault.core.domain.repository

import com.smsvault.core.domain.model.ScheduleConfig
import kotlinx.coroutines.flow.Flow

interface ScheduleRepository {
    fun observeSchedule(): Flow<ScheduleConfig?>
    suspend fun saveSchedule(config: ScheduleConfig): Result<Unit>
    suspend fun deleteSchedule(id: String): Result<Unit>
}
