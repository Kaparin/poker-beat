import type { NextRequest, NextResponse } from "next/server"
import { logSecurityEvent } from "./db-schema"

// Типы для мониторинга
export type PerformanceMetrics = {
  requestId: string
  path: string
  method: string
  statusCode: number
  duration: number
  timestamp: string
  userAgent?: string
  ipAddress?: string
  userId?: string
}

// Функция для логирования метрик производительности
export async function logPerformanceMetrics(metrics: PerformanceMetrics): Promise<void> {
  try {
    // В продакшене здесь можно отправлять метрики в систему мониторинга
    // Например, Prometheus, Datadog, New Relic и т.д.

    // Для простоты просто логируем в консоль
    console.log("Performance metrics:", metrics)

    // Если запрос был слишком долгим, логируем его в журнал безопасности
    if (metrics.duration > 1000) {
      await logSecurityEvent({
        action: "slow_request",
        user_id: metrics.userId,
        ip_address: metrics.ipAddress,
        details: {
          path: metrics.path,
          method: metrics.method,
          duration: metrics.duration,
          statusCode: metrics.statusCode,
        },
      })
    }
  } catch (error) {
    console.error("Error logging performance metrics:", error)
  }
}

// Middleware для мониторинга производительности API
export function withPerformanceMonitoring(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (req: NextRequest) => {
    const requestId = crypto.randomUUID()
    const startTime = performance.now()
    const path = req.nextUrl.pathname
    const method = req.method
    const userAgent = req.headers.get("user-agent") || undefined
    const ipAddress = req.headers.get("x-forwarded-for") || undefined

    // Извлекаем userId из токена, если он есть
    let userId: string | undefined
    const authHeader = req.headers.get("authorization")
    const token = authHeader?.split(" ")[1] || req.cookies.get("token")?.value

    if (token) {
      try {
        // Здесь можно декодировать JWT токен для получения userId
        // Для простоты опустим эту часть
      } catch (error) {
        console.error("Error extracting userId from token:", error)
      }
    }

    try {
      // Выполняем оригинальный обработчик
      const response = await handler(req)

      // Вычисляем длительность запроса
      const endTime = performance.now()
      const duration = endTime - startTime

      // Логируем метрики
      await logPerformanceMetrics({
        requestId,
        path,
        method,
        statusCode: response.status,
        duration,
        timestamp: new Date().toISOString(),
        userAgent,
        ipAddress,
        userId,
      })

      return response
    } catch (error) {
      // Вычисляем длительность запроса в случае ошибки
      const endTime = performance.now()
      const duration = endTime - startTime

      // Логируем метрики с ошибкой
      await logPerformanceMetrics({
        requestId,
        path,
        method,
        statusCode: 500,
        duration,
        timestamp: new Date().toISOString(),
        userAgent,
        ipAddress,
        userId,
      })

      // Логируем ошибку в журнал безопасности
      await logSecurityEvent({
        action: "api_error",
        user_id: userId,
        ip_address: ipAddress,
        details: {
          path,
          method,
          error: error instanceof Error ? error.message : String(error),
        },
      })

      // Перебрасываем ошибку дальше
      throw error
    }
  }
}

// Функция для мониторинга состояния приложения
export async function checkAppHealth(): Promise<{
  status: "healthy" | "degraded" | "unhealthy"
  checks: Record<string, { status: "up" | "down"; latency?: number }>
}> {
  const checks: Record<string, { status: "up" | "down"; latency?: number }> = {}

  // Проверка базы данных
  try {
    const dbStartTime = performance.now()
    // Здесь можно выполнить простой запрос к базе данных
    // Например, SELECT 1 FROM users LIMIT 1
    const dbEndTime = performance.now()

    checks.database = {
      status: "up",
      latency: dbEndTime - dbStartTime,
    }
  } catch (error) {
    console.error("Database health check failed:", error)
    checks.database = { status: "down" }
  }

  // Проверка Redis
  try {
    const redisStartTime = performance.now()
    // Здесь можно выполнить простую операцию с Redis
    // Например, PING
    const redisEndTime = performance.now()

    checks.redis = {
      status: "up",
      latency: redisEndTime - redisStartTime,
    }
  } catch (error) {
    console.error("Redis health check failed:", error)
    checks.redis = { status: "down" }
  }

  // Определяем общий статус
  const allUp = Object.values(checks).every((check) => check.status === "up")
  const allDown = Object.values(checks).every((check) => check.status === "down")

  let status: "healthy" | "degraded" | "unhealthy"

  if (allUp) {
    status = "healthy"
  } else if (allDown) {
    status = "unhealthy"
  } else {
    status = "degraded"
  }

  return { status, checks }
}

