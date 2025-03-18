import { type NextRequest, NextResponse } from "next/server"
import { getMetrics, getAggregatedMetrics } from "@/lib/performance-monitor"
import { getComponentLoadInfo, getAggregatedComponentInfo } from "@/lib/component-analyzer"
import { createClient } from "@/lib/supabase/server"

// Проверка прав администратора
async function isAdmin(req: NextRequest) {
  const supabase = createClient()

  // Получаем токен из заголовка
  const authHeader = req.headers.get("authorization")
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return false
  }

  const token = authHeader.substring(7)

  // Проверяем токен
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token)

  if (error || !user) {
    return false
  }

  // Проверяем, является ли пользователь администратором
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  return profile?.role === "admin"
}

export async function GET(req: NextRequest) {
  // Проверяем права администратора
  const admin = await isAdmin(req)
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  const searchParams = req.nextUrl.searchParams
  const type = searchParams.get("type") || "all"

  // Параметры фильтрации
  const route = searchParams.get("route") || undefined
  const method = searchParams.get("method") || undefined
  const startDateStr = searchParams.get("startDate") || undefined
  const endDateStr = searchParams.get("endDate") || undefined

  const startDate = startDateStr ? new Date(startDateStr) : undefined
  const endDate = endDateStr ? new Date(endDateStr) : undefined

  const filterOptions = {
    route,
    method,
    startDate,
    endDate,
  }

  const responseData: any = {}

  // Возвращаем запрошенные данные диагностики
  if (type === "all" || type === "metrics") {
    responseData.metrics = getMetrics(filterOptions)
    responseData.aggregatedMetrics = getAggregatedMetrics(filterOptions)
  }

  if (type === "all" || type === "components") {
    const componentName = searchParams.get("component") || undefined
    responseData.componentInfo = componentName ? getComponentLoadInfo(componentName) : getAggregatedComponentInfo()
  }

  // Добавляем информацию о системе
  if (type === "all" || type === "system") {
    responseData.system = {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
    }
  }

  return NextResponse.json(responseData)
}

