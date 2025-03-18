import jwt from "jsonwebtoken"
import { v4 as uuidv4 } from "uuid"
import Redis from "ioredis"

// Получаем JWT секрет из переменных окружения
const JWT_SECRET = process.env.JWT_SECRET

// Если секрет не предоставлен, выдаем ошибку в production
if (process.env.NODE_ENV === "production" && !JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required in production mode!")
}

// Токен истекает через 24 часа
const JWT_EXPIRES_IN = "24h"

// Аудитория и издатель токена для дополнительной безопасности
const JWT_AUDIENCE = process.env.JWT_AUDIENCE || "poker-beat-users"
const JWT_ISSUER = process.env.JWT_ISSUER || "poker-beat-api"

export interface JwtPayload {
  userId: number
  telegramId: number
  jti?: string // JWT ID для отзыва токена
  iat?: number // Issued at
  exp?: number // Expiration time
  aud?: string // Audience
  iss?: string // Issuer
}

// Инициализируем Redis клиент, если есть URL
let redis: Redis | null = null
if (process.env.REDIS_URL) {
  redis = new Redis(process.env.REDIS_URL)
  redis.on("error", (err) => {
    console.error("Redis connection error:", err)
  })
}

// Для локальной разработки или если Redis недоступен, используем Set в памяти
const localRevokedTokens = new Set<string>()

export function generateToken(payload: Omit<JwtPayload, "jti" | "iat" | "exp" | "aud" | "iss">): string {
  // Добавляем уникальный ID токена для возможного отзыва
  const tokenId = uuidv4()

  return jwt.sign(
    {
      ...payload,
      jti: tokenId,
    },
    JWT_SECRET || "temporary-secret-for-development",
    {
      expiresIn: JWT_EXPIRES_IN,
      audience: JWT_AUDIENCE,
      issuer: JWT_ISSUER,
    },
  )
}

// Улучшаем функцию проверки токена
export async function verifyToken(token: string): Promise<JwtPayload | null> {
  try {
    // Проверяем токен со всеми опциями
    const payload = jwt.verify(token, JWT_SECRET || "temporary-secret-for-development", {
      audience: JWT_AUDIENCE,
      issuer: JWT_ISSUER,
    }) as JwtPayload

    // Проверяем, не был ли токен отозван
    if (payload.jti) {
      const isRevoked = await isTokenRevoked(payload.jti)
      if (isRevoked) {
        console.warn(`Token ${payload.jti} has been revoked`)
        return null
      }
    }

    // Дополнительная проверка срока действия
    const now = Math.floor(Date.now() / 1000)
    if (payload.exp && payload.exp < now) {
      console.warn(`Token expired at ${new Date(payload.exp * 1000).toISOString()}`)
      return null
    }

    return payload
  } catch (error) {
    console.error("JWT verification error:", error)
    return null
  }
}

// Улучшаем функцию отзыва токена
export async function revokeToken(token: string): Promise<boolean> {
  try {
    // Декодируем без проверки, чтобы получить ID токена
    const decoded = jwt.decode(token) as JwtPayload

    if (!decoded || !decoded.jti) {
      console.warn("Cannot revoke token: missing jti claim")
      return false
    }

    // Если есть Redis, используем его
    if (redis) {
      // Вычисляем, сколько времени осталось до истечения срока действия токена
      const now = Math.floor(Date.now() / 1000)
      const expiryTime = decoded.exp ? decoded.exp - now : 24 * 60 * 60 // 24 часа по умолчанию

      // Сохраняем в Redis с истечением срока, соответствующим токену
      await redis.set(`revoked:${decoded.jti}`, "1", "EX", expiryTime)
      console.log(`Token ${decoded.jti} revoked until ${new Date((now + expiryTime) * 1000).toISOString()}`)
    } else {
      // Иначе используем локальное хранилище
      localRevokedTokens.add(decoded.jti)
      console.log(`Token ${decoded.jti} revoked (stored in memory)`)
    }

    return true
  } catch (error) {
    console.error("Token revocation error:", error)
    return false
  }
}

// Проверяем, был ли токен отозван
async function isTokenRevoked(jti: string): Promise<boolean> {
  // Если есть Redis, используем его
  if (redis) {
    const result = await redis.get(`revoked:${jti}`)
    return result === "1"
  }

  // Иначе используем локальное хранилище
  return localRevokedTokens.has(jti)
}

export function extractTokenFromHeader(authHeader?: string): string | null {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null
  }

  return authHeader.substring(7) // Удаляем префикс 'Bearer '
}

// Очистка истекших токенов из набора отозванных токенов
// Это должно вызываться периодически в production-окружении
export async function cleanupRevokedTokens(): Promise<void> {
  try {
    // Если используем Redis, он автоматически очищает истекшие ключи
    if (redis) {
      return
    }

    const now = Math.floor(Date.now() / 1000)

    // Перебираем отозванные токены и удаляем истекшие
    for (const tokenId of localRevokedTokens) {
      try {
        // Пытаемся декодировать токен, чтобы получить время истечения
        const decoded = jwt.decode(tokenId) as JwtPayload
        if (decoded && decoded.exp && decoded.exp < now) {
          localRevokedTokens.delete(tokenId)
        }
      } catch {
        // Если мы не можем декодировать токен, оставляем его в наборе
      }
    }
  } catch (error) {
    console.error("Error cleaning up revoked tokens:", error)
  }
}

