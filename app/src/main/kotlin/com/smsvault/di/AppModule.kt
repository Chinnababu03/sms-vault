package com.smsvault.di

import android.content.Context
import com.smsvault.core.cloudstorage.CloudSecrets
import com.smsvault.core.cloudstorage.CloudStorageProvider
import com.smsvault.core.cloudstorage.impl.GoogleDriveProvider
import com.smsvault.core.cloudstorage.impl.LocalStorageProvider
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import dagger.multibindings.IntoSet
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object AppModule {

    @Provides
    @Singleton
    @IntoSet
    fun provideLocalStorageProvider(
        @ApplicationContext context: Context,
    ): CloudStorageProvider = LocalStorageProvider(context)

    @Provides
    @Singleton
    @IntoSet
    fun provideGoogleDriveProvider(
        @ApplicationContext context: Context,
    ): CloudStorageProvider = GoogleDriveProvider(context)
}
