import type { NextRequest } from "next/server"

// Типы для анализа маршрутов
export type RouteInfo = {
  path: string
  methods: string[]
  handler: string
  middleware: string[]
  lastAccessed?: Date
  accessCount: number
}

// Хранилище информации о маршрутах
const routeStore: Record<string, RouteInfo> = {}

/**
 * Middleware для отслеживания доступа к маршрутам
 */
export function withRouteTracking(handler: Function) {
  return async (req: NextRequest, ...args: any[]) => {
    const path = req.nextUrl.pathname

    // Обновляем информацию о доступе к маршруту
    if (routeStore[path]) {
      routeStore[path].lastAccessed = new Date()
      routeStore[path].accessCount++
    } else {
      // Если маршрут не найден в хранилище, добавляем его
      routeStore[path] = {
        path,
        methods: [req.method],
        handler: "unknown",
        middleware: [],
        lastAccessed: new Date(),
        accessCount: 1,
      }
    }

    return handler(req, ...args)
  }
}

/**
 * Получение информации о маршрутах
 */
export function getRouteInfo(): RouteInfo[] {
  return Object.values(routeStore)
}

/**
 * Получение информации о неиспользуемых маршрутах
 */
export function getUnusedRoutes(minDays = 30): RouteInfo[] {
  const now = new Date()
  const minDate = new Date(now.getTime() - minDays * 24 * 60 * 60 * 1000)

  return Object.values(routeStore).filter((route) => {
    // Маршрут считается неиспользуемым, если он никогда не был доступен
    // или последний доступ был более minDays дней назад
    return !route.lastAccessed || route.lastAccessed < minDate
  })
}

/**
 * Получение информации о наиболее используемых маршрутах
 */
export function getMostUsedRoutes(limit = 10): RouteInfo[] {
  return Object.values(routeStore)
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, limit)
}

/**
 * Очистка информации о маршрутах
 */
export function clearRouteInfo() {
  Object.keys(routeStore).forEach((key) => {
    delete routeStore[key]
  })
}

/**
 * Сканирование директории app для поиска маршрутов API
 * Упрощенная версия для совместимости
 */
export async function scanRoutes(): Promise<RouteInfo[]> {
  return Object.values(routeStore)
}

