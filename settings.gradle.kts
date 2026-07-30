pluginManagement {
  repositories {
    google {
      content {
        includeGroupByRegex("com\\.android.*")
        includeGroupByRegex("com\\.google.*")
        includeGroupByRegex("androidx.*")
      }
    }
    mavenCentral()
    gradlePluginPortal()
  }
}

plugins { id("org.gradle.toolchains.foojay-resolver-convention") version "1.0.0" }

dependencyResolutionManagement {
  repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
  repositories {
    google()
    mavenCentral()
  }
}

rootProject.name = "SMS Vault"

include(":app")

// Core modules
include(":core:domain")
include(":core:data")
include(":core:telephony")
include(":core:crypto")
include(":core:cloud-storage")
include(":core:workmanager")
include(":core:ui")

// Feature modules
include(":feature:onboarding")
include(":feature:dashboard")
include(":feature:vault")
include(":feature:backup")
include(":feature:restore")
include(":feature:transfer")
include(":feature:settings")
