import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { supabase } from "@/lib/db-schema"
import { withErrorHandler } from "@/lib/error-handler"
import { withRateLimit } from "@/lib/rate-limiter"
import { withPerformanceMonitoring } from "@/lib/monitoring"
import { ForbiddenError } from "@/lib/error-handler"
import { getWithCache } from "@/lib/redis"

async function handler(request: Request) {
  // Проверка аутентификации и прав доступа
  const session = await auth()

  if (!session || !session.user.isAdmin) {
    throw new ForbiddenError()
  }

  // Получаем данные для дашборда с использованием кэширования
  const securityStats = await getWithCache(
    "admin:security:dashboard",
    async () => {
      // Получаем количество заблокированных пользователей
      const { count: bannedUsersCount, error: bannedError } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true })
        .eq("status", "banned")

      if (bannedError) {
        console.error("Error fetching banned users count:", bannedError)
        throw bannedError
      }

      // Получаем количество неудачных попыток входа за последние 24 часа
      const oneDayAgo = new Date()
      oneDayAgo.setDate(oneDayAgo.getDate() - 1)

      const { count: failedLoginsCount, error: failedLoginsError } = await supabase
        .from("security_logs")
        .select("*", { count: "exact", head: true })
        .eq("action", "admin_login_failed")
        .gte("created_at", oneDayAgo.toISOString())

      if (failedLoginsError) {
        console.error("Error fetching failed logins count:", failedLoginsError)
        throw failedLoginsError
      }

      // Получаем количество превышений лимита запросов за последние 24 часа
      const { count: rateLimitCount, error: rateLimitError } = await supabase
        .from("security_logs")
        .select("*", { count: "exact", head: true })
        .eq("action", "rate_limit_exceeded")
        .gte("created_at", oneDayAgo.toISOString())

      if (rateLimitError) {
        console.error("Error fetching rate limit count:", rateLimitError)
        throw rateLimitError
      }

      // Получаем количество подозрительных действий за последние 24 часа
      const { count: suspiciousActionsCount, error: suspiciousError } = await supabase
        .from("security_logs")
        .select("*", { count: "exact", head: true })
        .in("action", ["suspicious_activity", "api_error", "slow_request"])
        .gte("created_at", oneDayAgo.toISOString())

      if (suspiciousError) {
        console.error("Error fetching suspicious actions count:", suspiciousError)
        throw suspiciousError
      }

      // Получаем последние 5 событий безопасности
      const { data: recentEvents, error: recentEventsError } = await supabase
        .from("security_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5)

      if (recentEventsError) {
        console.error("Error fetching recent events:", recentEventsError)
        throw recentEventsError
      }

      return {
        bannedUsersCount: bannedUsersCount || 0,
        failedLoginsCount: failedLoginsCount || 0,
        rateLimitCount: rateLimitCount || 0,
        suspiciousActionsCount: suspiciousActionsCount || 0,
        recentEvents: recentEvents || [],
      }
    },
    300, // Кэшируем на 5 минут
  )

  return NextResponse.json(securityStats)
}

// Оборачиваем обработчик в middleware
export const GET = withErrorHandler(withRateLimit(withPerformanceMonitoring(handler), "admin"))

