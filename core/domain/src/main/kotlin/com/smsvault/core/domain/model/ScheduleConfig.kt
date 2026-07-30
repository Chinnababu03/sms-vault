package com.smsvault.core.domain.model

import kotlinx.serialization.Serializable

@Serializable
data class ScheduleConfig(
    val id: String,
    val cadence: Cadence,
    val requiresCharging: Boolean,
    val requiresUnmeteredNetwork: Boolean,
    val includeMessages: Boolean,
    val includeCallLogs: Boolean,
    val targetProviders: List<ProviderId>,
    val isEnabled: Boolean,
)

@Serializable
enum class Cadence { DAILY, WEEKLY, MONTHLY }
