package com.smsvault.core.data.di

import android.content.Context
import androidx.room.Room
import com.smsvault.core.data.db.SmsVaultDatabase
import com.smsvault.core.data.db.dao.BackupRecordDao
import com.smsvault.core.data.db.dao.ProviderAccountDao
import com.smsvault.core.data.db.dao.ScheduleDao
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object DatabaseModule {

    @Provides
    @Singleton
    fun provideDatabase(@ApplicationContext context: Context): SmsVaultDatabase =
        Room.databaseBuilder(
            context,
            SmsVaultDatabase::class.java,
            "smsvault.db"
        )
        .fallbackToDestructiveMigrationOnDowngrade()
        .build()

    @Provides
    fun provideBackupRecordDao(db: SmsVaultDatabase): BackupRecordDao = db.backupRecordDao()

    @Provides
    fun provideScheduleDao(db: SmsVaultDatabase): ScheduleDao = db.scheduleDao()

    @Provides
    fun provideProviderAccountDao(db: SmsVaultDatabase): ProviderAccountDao = db.providerAccountDao()
}
