package com.smsvault.core.data.db

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import com.smsvault.core.data.db.dao.BackupRecordDao
import com.smsvault.core.data.db.dao.ProviderAccountDao
import com.smsvault.core.data.db.dao.ScheduleDao
import com.smsvault.core.data.db.entities.BackupRecordEntity
import com.smsvault.core.data.db.entities.ProviderAccountEntity
import com.smsvault.core.data.db.entities.ScheduleEntity

@Database(
    entities = [
        BackupRecordEntity::class,
        ScheduleEntity::class,
        ProviderAccountEntity::class,
    ],
    version = 1,
    exportSchema = true,
)
abstract class SmsVaultDatabase : RoomDatabase() {
    abstract fun backupRecordDao(): BackupRecordDao
    abstract fun scheduleDao(): ScheduleDao
    abstract fun providerAccountDao(): ProviderAccountDao

    companion object {
        @Volatile
        private var INSTANCE: SmsVaultDatabase? = null

        fun getInstance(context: Context): SmsVaultDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    SmsVaultDatabase::class.java,
                    "smsvault.db"
                ).build()
                INSTANCE = instance
                instance
            }
        }
    }
}
