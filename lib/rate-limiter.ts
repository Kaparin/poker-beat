import { type NextRequest, NextResponse } from "next/server"
import { getRedisClient } from "./redis"
import { logSecurityEvent } from "./db-schema"

// Конфигурация для различных типов ограничений
type RateLimitConfig = {
  // Максимальное количество запросов
  max: number
  // Период в секундах
  windowSizeInSeconds: number
  // Сообщение об ошибке
  message: string
}

// Предопределенные конфигурации
const rateLimitConfigs: Record<string, RateLimitConfig> = {
  // Для обычных API запросов
  default: {
    max: 100,
    windowSizeInSeconds: 60,
    message: "Слишком много запросов, пожалуйста, попробуйте позже",
  },
  // Для аутентификации
  auth: {
    max: 10,
    windowSizeInSeconds: 60,
    message: "Слишком много попыток входа, пожалуйста, попробуйте позже",
  },
  // Для финансовых операций
  financial: {
    max: 5,
    windowSizeInSeconds: 60,
    message: "Слишком много финансовых операций, пожалуйста, попробуйте позже",
  },
  // Для административных операций
  admin: {
    max: 30,
    windowSizeInSeconds: 60,
    message: "Слишком много административных запросов, пожалуйста, попробуйте позже",
  },
}

// Функция для получения ключа ограничения
function getRateLimitKey(req: NextRequest, type: string): string {
  // Получаем IP-адрес
  const ip = req.headers.get("x-forwarded-for") || "unknown"

  // Для аутентификации используем только IP
  if (type === "auth") {
    return `rate-limit:${type}:${ip}`
  }

  // Для других типов используем IP и путь
  const path = req.nextUrl.pathname
  return `rate-limit:${type}:${ip}:${path}`
}

// Middleware для ограничения частоты запросов
export function withRateLimit(
  handler: (req: NextRequest) => Promise<NextResponse>,
  type: keyof typeof rateLimitConfigs = "default",
) {
  return async (req: NextRequest) => {
    const config = rateLimitConfigs[type]
    const key = getRateLimitKey(req, type)
    const redis = getRedisClient()

    try {
      // Увеличиваем счетчик запросов
      const count = await redis.incr(key)

      // Если это первый запрос, устанавливаем время жизни ключа
      if (count === 1) {
        await redis.expire(key, config.windowSizeInSeconds)
      }

      // Получаем оставшееся время жизни ключа
      const ttl = await redis.ttl(key)

      // Устанавливаем заголовки для клиента
      const headers = new Headers()
      headers.set("X-RateLimit-Limit", config.max.toString())
      headers.set("X-RateLimit-Remaining", Math.max(0, config.max - count).toString())
      headers.set("X-RateLimit-Reset", (Math.floor(Date.now() / 1000) + ttl).toString())

      // Если превышен лимит, возвращаем ошибку
      if (count > config.max) {
        // Логируем событие превышения лимита
        const ip = req.headers.get("x-forwarded-for") || "unknown"
        const userAgent = req.headers.get("user-agent") || "unknown"

        await logSecurityEvent({
          action: "rate_limit_exceeded",
          ip_address: ip,
          user_agent: userAgent,
          details: {
            type,
            path: req.nextUrl.pathname,
            method: req.method,
            count,
          },
        })

        return new NextResponse(JSON.stringify({ error: config.message }), {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            ...Object.fromEntries(headers.entries()),
          },
        })
      }

      // Выполняем оригинальный обработчик
      const response = await handler(req)

      // Добавляем заголовки к ответу
      Object.entries(Object.fromEntries(headers.entries())).forEach(([name, value]) => {
        response.headers.set(name, value)
      })

      return response
    } catch (error) {
      console.error("Rate limit error:", error)

      // В случае ошибки Redis, пропускаем запрос
      return handler(req)
    }
  }
}

