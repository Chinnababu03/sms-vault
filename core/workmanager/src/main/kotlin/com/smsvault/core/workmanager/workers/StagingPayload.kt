package com.smsvault.core.workmanager.workers

import com.smsvault.core.domain.model.CallLogEntry
import com.smsvault.core.domain.model.SmsMessage
import kotlinx.serialization.Serializable

@Serializable
data class StagingPayload(
    val smsList: List<SmsMessage>,
    val callList: List<CallLogEntry>,
)
