import type { NextRequest } from "next/server"
import fs from "fs"
import path from "path"

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
 * Сканирование директории app для поиска маршрутов API
 */
export async function scanRoutes(appDir = "./app"): Promise<RouteInfo[]> {
  const routes: RouteInfo[] = []

  // Рекурсивная функция для сканирования директорий
  async function scanDir(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)

      if (entry.isDirectory()) {
        // Проверяем, является ли директория маршрутом API
        if (entry.name === "api") {
          await scanApiDir(fullPath)
        } else {
          // Продолжаем сканирование вложенных директорий
          await scanDir(fullPath)
        }
      }
    }
  }

  // Сканирование директории API
  async function scanApiDir(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)

      if (entry.isDirectory()) {
        // Рекурсивно сканируем вложенные API директории
        await scanApiDir(fullPath)
      } else if (entry.name === "route.ts" || entry.name === "route.js") {
        // Нашли файл маршрута
        const relativePath = fullPath.replace(/\\/g, "/").replace("./app", "")
        const apiPath = relativePath.replace(/\/route\.(ts|js)$/, "")

        // Анализируем файл для определения методов
        const content = fs.readFileSync(fullPath, "utf-8")
        const methods = extractMethods(content)

        // Определяем middleware
        const middleware = extractMiddleware(content)

        routes.push({
          path: apiPath,
          methods,
          handler: relativePath,
          middleware,
          accessCount: routeStore[apiPath]?.accessCount || 0,
        })

        // Обновляем хранилище
        routeStore[apiPath] = routes[routes.length - 1]
      }
    }
  }

  await scanDir(appDir)
  return routes
}

/**
 * Извлечение HTTP методов из содержимого файла
 */
function extractMethods(content: string): string[] {
  const methods: string[] = []
  const methodRegex = /export\s+(?:async\s+)?function\s+(GET|POST|PUT|DELETE|PATCH|OPTIONS|HEAD)\s*\(/g

  let match
  while ((match = methodRegex.exec(content)) !== null) {
    methods.push(match[1])
  }

  return methods
}

/**
 * Извлечение middleware из содержимого файла
 */
function extractMiddleware(content: string): string[] {
  const middleware: string[] = []
  const middlewareRegex = /with([A-Za-z]+)\(/g

  let match
  while ((match = middlewareRegex.exec(content)) !== null) {
    middleware.push(match[1])
  }

  return middleware
}

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

```typescriptreact file="app/api/diagnostics/routes/route.ts"
import { NextRequest, NextResponse } from 'next/server';
import { scanRoutes, getRouteInfo, getUnusedRoutes, getMostUsedRoutes } from '@/lib/route-analyzer';
import { createClient } from '@/lib/supabase/server';

// Проверка прав администратора
async function isAdmin(req: NextRequest) {
  const supabase = createClient();
  
  // Получаем токен из заголовка
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }
  
  const token = authHeader.substring(7);
  
  // Проверяем токен
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    return false;
  }
  
  // Проверяем, является ли пользователь администратором
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  
  return profile?.role === 'admin';
}

export async function GET(req: NextRequest) {
  // Проверяем права администратора
  const admin = await isAdmin(req);
  if (!admin) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 403 }
    );
  }
  
  const searchParams = req.nextUrl.searchParams;
  const action = searchParams.get('action') || 'info';
  
  let responseData: any = {};
  
  try {
    switch (action) {
      case 'scan':
        // Сканируем маршруты приложения
        responseData.routes = await scanRoutes();
        break;
        
      case 'info':
        // Получаем информацию о всех маршрутах
        responseData.routes = getRouteInfo();
        break;
        
      case 'unused':
        // Получаем неиспользуемые маршруты
        const minDays = parseInt(searchParams.get('minDays') || '30', 10);
        responseData.routes = getUnusedRoutes(minDays);
        break;
        
      case 'most-used':
        // Получаем наиболее используемые маршруты
        const limit = parseInt(searchParams.get('limit') || '10', 10);
        responseData.routes = getMostUsedRoutes(limit);
        break;
        
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
    
    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error in route analysis:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

