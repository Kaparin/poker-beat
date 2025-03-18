import crypto from "crypto"

// Get encryption key from environment variables
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "default-encryption-key-32-characters"

// If no key is provided in production, log a warning
if (process.env.NODE_ENV === "production" && ENCRYPTION_KEY === "default-encryption-key-32-characters") {
  console.warn("WARNING: Using default encryption key in production environment!")
}

// Ensure the key is 32 bytes (256 bits)
const key = Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32))

/**
 * Encrypts a string using AES-256-GCM
 */
export function encrypt(text: string): string {
  try {
    // Generate a random initialization vector
    const iv = crypto.randomBytes(16)

    // Create cipher
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv)

    // Encrypt the text
    let encrypted = cipher.update(text, "utf8", "hex")
    encrypted += cipher.final("hex")

    // Get the authentication tag
    const authTag = cipher.getAuthTag().toString("hex")

    // Return IV + Auth Tag + Encrypted data
    return iv.toString("hex") + ":" + authTag + ":" + encrypted
  } catch (error) {
    console.error("Encryption error:", error)
    // Return a safe fallback in case of error
    return "ENCRYPTION_ERROR"
  }
}

/**
 * Decrypts a string encrypted with AES-256-GCM
 */
export function decrypt(encryptedText: string): string {
  try {
    // Split the encrypted text into IV, Auth Tag, and data
    const parts = encryptedText.split(":")
    if (parts.length !== 3) {
      throw new Error("Invalid encrypted text format")
    }

    const iv = Buffer.from(parts[0], "hex")
    const authTag = Buffer.from(parts[1], "hex")
    const encryptedData = parts[2]

    // Create decipher
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv)
    decipher.setAuthTag(authTag)

    // Decrypt the data
    let decrypted = decipher.update(encryptedData, "hex", "utf8")
    decrypted += decipher.final("utf8")

    return decrypted
  } catch (error) {
    console.error("Decryption error:", error)
    throw new Error("Failed to decrypt data")
  }
}

/**
 * Hashes a string using SHA-256
 */
export function hash(text: string): string {
  try {
    return crypto.createHash("sha256").update(text).digest("hex")
  } catch (error) {
    console.error("Hashing error:", error)
    return "HASH_ERROR"
  }
}

/**
 * Generates a secure random string
 */
export function generateSecureRandomString(length = 32): string {
  try {
    return crypto
      .randomBytes(Math.ceil(length / 2))
      .toString("hex")
      .slice(0, length)
  } catch (error) {
    console.error("Random string generation error:", error)
    // Fallback to less secure but still usable random string
    return Math.random()
      .toString(36)
      .substring(2, 2 + length)
  }
}

