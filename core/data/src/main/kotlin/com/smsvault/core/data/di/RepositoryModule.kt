package com.smsvault.core.data.di

import com.smsvault.core.data.repository.AuthRepositoryImpl
import com.smsvault.core.data.repository.BackupRepositoryImpl
import com.smsvault.core.data.repository.PreferencesRepositoryImpl
import com.smsvault.core.data.repository.ScheduleRepositoryImpl
import com.smsvault.core.domain.repository.AuthRepository
import com.smsvault.core.domain.repository.BackupRepository
import com.smsvault.core.domain.repository.PreferencesRepository
import com.smsvault.core.domain.repository.ScheduleRepository
import dagger.Binds
import dagger.Module
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
abstract class RepositoryModule {

    @Binds
    @Singleton
    abstract fun bindAuthRepository(impl: AuthRepositoryImpl): AuthRepository

    @Binds
    @Singleton
    abstract fun bindBackupRepository(impl: BackupRepositoryImpl): BackupRepository

    @Binds
    @Singleton
    abstract fun bindScheduleRepository(impl: ScheduleRepositoryImpl): ScheduleRepository

    @Binds
    @Singleton
    abstract fun bindPreferencesRepository(impl: PreferencesRepositoryImpl): PreferencesRepository
}
