import { Redis } from "ioredis"
import { logSecurityEvent } from "./db-schema"

// Создаем Redis клиент с поддержкой повторного подключения
const createRedisClient = () => {
  const client = new Redis(process.env.REDIS_URL!, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      const delay = Math.min(times * 50, 2000)
      return delay
    },
    reconnectOnError(err) {
      const targetError = "READONLY"
      if (err.message.includes(targetError)) {
        // Только повторное подключение при ошибке READONLY
        return true
      }
      return false
    },
  })

  // Обработка событий подключения
  client.on("connect", () => {
    console.log("Redis client connected")
  })

  client.on("error", (err) => {
    console.error("Redis client error:", err)
    // Логируем ошибку Redis в журнал безопасности
    logSecurityEvent({
      action: "redis_error",
      details: { error: err.message },
    }).catch(console.error)
  })

  client.on("reconnecting", () => {
    console.log("Redis client reconnecting")
  })

  return client
}

// Экспортируем Redis клиент как синглтон
let redisClient: Redis | null = null

export function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = createRedisClient()
  }
  return redisClient
}

// Функция для получения данных из Redis с кэшированием
export async function getWithCache<T>(key: string, fetchFn: () => Promise<T>, expirationInSeconds = 3600): Promise<T> {
  const redis = getRedisClient()

  try {
    // Пытаемся получить данные из кэша
    const cachedData = await redis.get(key)

    if (cachedData) {
      return JSON.parse(cachedData) as T
    }

    // Если данных нет в кэше, получаем их и сохраняем
    const data = await fetchFn()

    // Сохраняем данные в кэш
    await redis.set(key, JSON.stringify(data), "EX", expirationInSeconds)

    return data
  } catch (error) {
    console.error(`Error in getWithCache for key ${key}:`, error)
    // В случае ошибки кэша, просто получаем данные напрямую
    return fetchFn()
  }
}

// Функция для инвалидации кэша
export async function invalidateCache(key: string): Promise<void> {
  const redis = getRedisClient()

  try {
    await redis.del(key)
  } catch (error) {
    console.error(`Error invalidating cache for key ${key}:`, error)
  }
}

// Функция для инвалидации кэша по шаблону
export async function invalidateCachePattern(pattern: string): Promise<void> {
  const redis = getRedisClient()

  try {
    const keys = await redis.keys(pattern)

    if (keys.length > 0) {
      await redis.del(...keys)
    }
  } catch (error) {
    console.error(`Error invalidating cache for pattern ${pattern}:`, error)
  }
}

// Функция для блокировки ресурса (для предотвращения race conditions)
export async function acquireLock(resource: string, ttlInSeconds = 30): Promise<boolean> {
  const redis = getRedisClient()
  const lockKey = `lock:${resource}`

  // Используем SET с опцией NX (установить, только если не существует)
  const result = await redis.set(lockKey, "1", "EX", ttlInSeconds, "NX")

  return result === "OK"
}

// Функция для освобождения блокировки
export async function releaseLock(resource: string): Promise<void> {
  const redis = getRedisClient()
  const lockKey = `lock:${resource}`

  await redis.del(lockKey)
}

// Функция для выполнения операции с блокировкой
export async function withLock<T>(
  resource: string,
  fn: () => Promise<T>,
  ttlInSeconds = 30,
  maxRetries = 5,
  retryDelayMs = 200,
): Promise<T> {
  let retries = 0

  while (retries < maxRetries) {
    const locked = await acquireLock(resource, ttlInSeconds)

    if (locked) {
      try {
        return await fn()
      } finally {
        await releaseLock(resource)
      }
    }

    // Если не удалось получить блокировку, ждем и пробуем снова
    await new Promise((resolve) => setTimeout(resolve, retryDelayMs))
    retries++
  }

  throw new Error(`Failed to acquire lock for resource ${resource} after ${maxRetries} retries`)
}

