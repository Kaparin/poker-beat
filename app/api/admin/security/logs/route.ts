import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { supabase } from "@/lib/db-schema"
import { withErrorHandler } from "@/lib/error-handler"
import { withRateLimit } from "@/lib/rate-limiter"
import { withPerformanceMonitoring } from "@/lib/monitoring"
import { ForbiddenError } from "@/lib/error-handler"

async function handler(request: Request) {
  // Проверка аутентификации и прав доступа
  const session = await auth()

  if (!session || !session.user.isAdmin) {
    throw new ForbiddenError()
  }

  // Получаем параметры запроса
  const url = new URL(request.url)
  const page = Number.parseInt(url.searchParams.get("page") || "1")
  const limit = Number.parseInt(url.searchParams.get("limit") || "20")
  const action = url.searchParams.get("action") || undefined
  const userId = url.searchParams.get("userId") || undefined
  const startDate = url.searchParams.get("startDate") || undefined
  const endDate = url.searchParams.get("endDate") || undefined

  // Проверяем валидность параметров
  if (page < 1 || limit < 1 || limit > 100) {
    return NextResponse.json({ error: "Некорректные параметры пагинации" }, { status: 400 })
  }

  // Вычисляем смещение
  const offset = (page - 1) * limit

  // Строим запрос
  let query = supabase
    .from("security_logs")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  // Добавляем фильтры, если они указаны
  if (action) {
    query = query.eq("action", action)
  }

  if (userId) {
    query = query.eq("user_id", userId)
  }

  if (startDate) {
    query = query.gte("created_at", startDate)
  }

  if (endDate) {
    query = query.lte("created_at", endDate)
  }

  // Выполняем запрос
  const { data, count, error } = await query

  if (error) {
    console.error("Error fetching security logs:", error)
    throw new Error("Ошибка при получении журнала безопасности")
  }

  // Если данных нет, возвращаем пустой массив
  if (!data) {
    return NextResponse.json({
      logs: [],
      total: 0,
      page,
      limit,
    })
  }

  // Возвращаем результаты
  return NextResponse.json({
    logs: data,
    total: count || 0,
    page,
    limit,
  })
}

// Оборачиваем обработчик в middleware для обработки ошибок, ограничения частоты запросов и мониторинга
export const GET = withErrorHandler(withRateLimit(withPerformanceMonitoring(handler), "admin"))

