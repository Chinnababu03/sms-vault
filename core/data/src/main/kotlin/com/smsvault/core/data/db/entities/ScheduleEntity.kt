package com.smsvault.core.data.db.entities

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.smsvault.core.domain.model.Cadence
import com.smsvault.core.domain.model.ProviderId
import com.smsvault.core.domain.model.ScheduleConfig

@Entity(tableName = "schedules")
data class ScheduleEntity(
    @PrimaryKey val id: String,
    val cadence: String,                    // Cadence.name()
    val requiresCharging: Boolean,
    val requiresUnmeteredNetwork: Boolean,
    val includeMessages: Boolean,
    val includeCallLogs: Boolean,
    val targetProviders: String,            // comma-separated ProviderId list
    val isEnabled: Boolean,
)

fun ScheduleEntity.toDomain() = ScheduleConfig(
    id = id,
    cadence = Cadence.valueOf(cadence),
    requiresCharging = requiresCharging,
    requiresUnmeteredNetwork = requiresUnmeteredNetwork,
    includeMessages = includeMessages,
    includeCallLogs = includeCallLogs,
    targetProviders = targetProviders.split(",").filter { it.isNotBlank() }.map { ProviderId.valueOf(it.trim()) },
    isEnabled = isEnabled,
)

fun ScheduleConfig.toEntity() = ScheduleEntity(
    id = id,
    cadence = cadence.name,
    requiresCharging = requiresCharging,
    requiresUnmeteredNetwork = requiresUnmeteredNetwork,
    includeMessages = includeMessages,
    includeCallLogs = includeCallLogs,
    targetProviders = targetProviders.joinToString(",") { it.name },
    isEnabled = isEnabled,
)
