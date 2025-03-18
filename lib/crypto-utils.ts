import crypto from "crypto"

// Generate a secure random string
export function generateRandomString(length = 32): string {
  return crypto.randomBytes(length).toString("hex")
}

// Hash a password with a random salt
export async function hashPassword(password: string): Promise<{ hash: string; salt: string }> {
  const salt = generateRandomString(16)
  const hash = await pbkdf2(password, salt, 10000, 64, "sha512")
  return { hash, salt }
}

// Verify a password against a hash and salt
export async function verifyPassword(password: string, hash: string, salt: string): Promise<boolean> {
  const candidateHash = await pbkdf2(password, salt, 10000, 64, "sha512")
  return candidateHash === hash
}

// PBKDF2 implementation
function pbkdf2(password: string, salt: string, iterations: number, keylen: number, digest: string): Promise<string> {
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(password, salt, iterations, keylen, digest, (err, derivedKey) => {
      if (err) reject(err)
      else resolve(derivedKey.toString("hex"))
    })
  })
}

// Encrypt data with AES-256-GCM
export function encrypt(text: string, secretKey: string): { encrypted: string; iv: string; authTag: string } {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv("aes-256-gcm", Buffer.from(secretKey, "hex"), iv)

  let encrypted = cipher.update(text, "utf8", "hex")
  encrypted += cipher.final("hex")

  const authTag = cipher.getAuthTag().toString("hex")

  return {
    encrypted,
    iv: iv.toString("hex"),
    authTag,
  }
}

// Decrypt data with AES-256-GCM
export function decrypt(encrypted: string, iv: string, authTag: string, secretKey: string): string {
  const decipher = crypto.createDecipheriv("aes-256-gcm", Buffer.from(secretKey, "hex"), Buffer.from(iv, "hex"))

  decipher.setAuthTag(Buffer.from(authTag, "hex"))

  let decrypted = decipher.update(encrypted, "hex", "utf8")
  decrypted += decipher.final("utf8")

  return decrypted
}

