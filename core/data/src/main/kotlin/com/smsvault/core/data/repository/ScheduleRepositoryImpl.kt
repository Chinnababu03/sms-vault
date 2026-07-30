package com.smsvault.core.data.repository

import com.smsvault.core.data.db.dao.ScheduleDao
import com.smsvault.core.data.db.entities.toDomain
import com.smsvault.core.data.db.entities.toEntity
import com.smsvault.core.domain.model.ScheduleConfig
import com.smsvault.core.domain.repository.ScheduleRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class ScheduleRepositoryImpl @Inject constructor(
    private val dao: ScheduleDao,
) : ScheduleRepository {

    override fun observeSchedule(): Flow<ScheduleConfig?> =
        dao.observe().map { it?.toDomain() }

    override suspend fun saveSchedule(config: ScheduleConfig): Result<Unit> = runCatching {
        dao.insert(config.toEntity())
    }

    override suspend fun deleteSchedule(id: String): Result<Unit> = runCatching {
        dao.deleteById(id)
    }
}
