import { type NextRequest, NextResponse } from "next/server"
import { analyzeDependencies, findUnusedDependencies, findMostUsedDependencies } from "@/lib/dependency-analyzer"
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
  const action = searchParams.get("action") || "all"

  const responseData: any = {}

  try {
    // Анализируем зависимости
    const dependencies = await analyzeDependencies()

    switch (action) {
      case "all":
        // Возвращаем все зависимости
        responseData.dependencies = dependencies
        break

      case "unused":
        // Возвращаем неиспользуемые зависимости
        responseData.dependencies = findUnusedDependencies(dependencies)
        break

      case "most-used":
        // Возвращаем наиболее используемые зависимости
        const limit = Number.parseInt(searchParams.get("limit") || "10", 10)
        responseData.dependencies = findMostUsedDependencies(dependencies, limit)
        break

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    return NextResponse.json(responseData)
  } catch (error) {
    console.error("Error in dependency analysis:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

