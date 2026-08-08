# Project specific ProGuard / R8 rules for SMS Vault

# Strip logging statements in release builds
-assumenosideeffects class android.util.Log {
    public static *** d(...);
    public static *** v(...);
    public static *** i(...);
}

# Preserve Room entities & DAOs
-keep class * extends androidx.room.RoomDatabase
-dontwarn androidx.room.paging.**

# Preserve Firebase & Cloud Storage serialization classes
-keepattributes *Annotation*,Signature,InnerClasses,EnclosingMethod

# Obfuscate line numbers & source attributes in release
-renamesourcefileattribute SourceFile
-keepattributes SourceFile,LineNumberTable
