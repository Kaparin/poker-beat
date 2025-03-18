import type { NextRequest } from "next/server"

// Типы для мониторинга производительности
export type PerformanceMetric = {
  route: string
  method: string
  duration: number
  timestamp: Date
  status: number
  userAgent?: string
  ip?: string
}

// Хранилище метрик в памяти (в продакшене лучше использовать внешнее хранилище)
const metricsStore: PerformanceMetric[] = []

// Максимальное количество метрик для хранения в памяти
const MAX_METRICS = 1000

/**
 * Middleware для мониторинга производительности API
 */
export function withPerformanceMonitoring(handler: Function) {
  return async (req: NextRequest, ...args: any[]) => {
    const start = performance.now()
    const route = req.nextUrl.pathname
    const method = req.method

    try {
      const response = await handler(req, ...args)
      const duration = performance.now() - start

      // Сохраняем метрику
      const metric: PerformanceMetric = {
        route,
        method,
        duration,
        timestamp: new Date(),
        status: response.status,
        userAgent: req.headers.get("user-agent") || undefined,
        ip: req.headers.get("x-forwarded-for") || undefined,
      }

      storeMetric(metric)

      return response
    } catch (error) {
      const duration = performance.now() - start

      // Сохраняем метрику с ошибкой
      const metric: PerformanceMetric = {
        route,
        method,
        duration,
        timestamp: new Date(),
        status: 500,
        userAgent: req.headers.get("user-agent") || undefined,
        ip: req.headers.get("x-forwarded-for") || undefined,
      }

      storeMetric(metric)

      // Пробрасываем ошибку дальше
      throw error
    }
  }
}

/**
 * Сохранение метрики в хранилище
 */
function storeMetric(metric: PerformanceMetric) {
  metricsStore.push(metric)

  // Ограничиваем размер хранилища
  if (metricsStore.length > MAX_METRICS) {
    metricsStore.shift()
  }
}

/**
 * Получение всех метрик
 */
export function getMetrics(options?: {
  route?: string
  method?: string
  startDate?: Date
  endDate?: Date
}): PerformanceMetric[] {
  let filteredMetrics = [...metricsStore]

  if (options?.route) {
    filteredMetrics = filteredMetrics.filter((m) => m.route === options.route)
  }

  if (options?.method) {
    filteredMetrics = filteredMetrics.filter((m) => m.method === options.method)
  }

  if (options?.startDate) {
    filteredMetrics = filteredMetrics.filter((m) => m.timestamp >= options.startDate)
  }

  if (options?.endDate) {
    filteredMetrics = filteredMetrics.filter((m) => m.timestamp <= options.endDate)
  }

  return filteredMetrics
}

/**
 * Получение агрегированных метрик
 */
export function getAggregatedMetrics(options?: {
  route?: string
  method?: string
  startDate?: Date
  endDate?: Date
}) {
  const metrics = getMetrics(options)

  if (metrics.length === 0) {
    return {
      count: 0,
      avgDuration: 0,
      minDuration: 0,
      maxDuration: 0,
      p95Duration: 0,
      errorRate: 0,
    }
  }

  // Сортируем по длительности для расчета перцентилей
  const sortedDurations = metrics.map((m) => m.duration).sort((a, b) => a - b)

  const count = metrics.length
  const avgDuration = metrics.reduce((sum, m) => sum + m.duration, 0) / count
  const minDuration = sortedDurations[0]
  const maxDuration = sortedDurations[sortedDurations.length - 1]

  // Расчет 95-го перцентиля
  const p95Index = Math.floor(sortedDurations.length * 0.95)
  const p95Duration = sortedDurations[p95Index]

  // Расчет процента ошибок (статусы 4xx и 5xx)
  const errorCount = metrics.filter((m) => m.status >= 400).length
  const errorRate = (errorCount / count) * 100

  return {
    count,
    avgDuration,
    minDuration,
    maxDuration,
    p95Duration,
    errorRate,
  }
}

/**
 * Очистка метрик
 */
export function clearMetrics() {
  metricsStore.length = 0
}

