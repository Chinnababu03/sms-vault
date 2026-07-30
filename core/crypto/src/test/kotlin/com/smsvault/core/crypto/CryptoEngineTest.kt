package com.smsvault.core.crypto

import org.junit.Assert.assertArrayEquals
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import javax.crypto.KeyGenerator

class CryptoEngineTest {

    private fun generateTestKey(): javax.crypto.SecretKey {
        val keyGen = KeyGenerator.getInstance("AES")
        keyGen.init(256)
        return keyGen.generateKey()
    }

    @Test
    fun testEncryptionAndDecryptionRoundtrip() {
        val key = generateTestKey()
        val originalData = "SMS Vault Top Secret Payload 2026".toByteArray(Charsets.UTF_8)

        val encrypted = CryptoEngine.encryptData(originalData, key)
        assertTrue("Encrypted payload should contain SVLT header", encrypted.size > 20)

        val decrypted = CryptoEngine.decryptData(encrypted, key)
        assertArrayEquals("Decrypted data must match original", originalData, decrypted)
    }

    @Test
    fun testPassphraseDerivationAndDecryption() {
        val passphrase = "MasterPassphrase123!"
        val originalData = "Encrypted Backup Payload Data".toByteArray(Charsets.UTF_8)

        val encrypted = CryptoEngine.encryptWithPassphrase(originalData, passphrase)
        val decrypted = CryptoEngine.decryptWithPassphrase(encrypted, passphrase)

        assertArrayEquals("Passphrase decrypted data must match original", originalData, decrypted)
    }
}
