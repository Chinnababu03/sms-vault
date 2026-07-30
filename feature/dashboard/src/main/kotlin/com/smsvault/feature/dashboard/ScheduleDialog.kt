package com.smsvault.feature.dashboard

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.smsvault.core.domain.model.Cadence

@Composable
fun ScheduleDialog(
    currentCadence: Cadence?,
    onDismiss: () -> Unit,
    onSave: (Cadence?) -> Unit,
) {
    var selectedCadence by remember { mutableStateOf(currentCadence) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Auto-Backup Schedule") },
        text = {
            Column {
                Cadence.entries.forEach { cadence ->
                    Row(
                        verticalAlignment = androidx.compose.ui.Alignment.CenterVertically,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        RadioButton(
                            selected = selectedCadence == cadence,
                            onClick = { selectedCadence = cadence }
                        )
                        Text(text = cadence.name, modifier = Modifier.padding(start = 8.dp))
                    }
                }
                Row(
                    verticalAlignment = androidx.compose.ui.Alignment.CenterVertically,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    RadioButton(
                        selected = selectedCadence == null,
                        onClick = { selectedCadence = null }
                    )
                    Text(text = "NONE (Manual only)", modifier = Modifier.padding(start = 8.dp))
                }
            }
        },
        confirmButton = {
            TextButton(onClick = { onSave(selectedCadence) }) {
                Text("Save")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}
