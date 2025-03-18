import { NextResponse } from "next/server"
import { supabase } from "@/lib/api-client"
import { auth } from "@/lib/auth"

export async function GET(request: Request) {
  try {
    // Проверка аутентификации и прав доступа
    const session = await auth()
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Проверка прав администратора
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("role")
      .eq("id", session.user.id)
      .single()

    if (userError || !userData || (userData.role !== "ADMIN" && userData.role !== "MODERATOR")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Получение статистики пользователей
    const { data: usersData, error: usersError } = await supabase
      .from("users")
      .select("id, created_at, last_login, status")

    if (usersError) {
      console.error("Error fetching users data:", usersError)
      return NextResponse.json({ error: "Failed to fetch users data" }, { status: 500 })
    }

    const totalUsers = usersData.length
    const activeUsers = usersData.filter((user) => user.status === "ACTIVE").length

    // Пользователи, зарегистрированные сегодня
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const newUsersToday = usersData.filter((user) => {
      const createdAt = new Date(user.created_at)
      return createdAt >= today
    }).length

    // Пользователи онлайн (последний вход в течение последних 15 минут)
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000)
    const onlineUsers = usersData.filter((user) => {
      if (!user.last_login) return false
      const lastLogin = new Date(user.last_login)
      return lastLogin >= fifteenMinutesAgo
    }).length

    return NextResponse.json({
      totalUsers,
      activeUsers,
      newUsersToday,
      onlineUsers,
    })
  } catch (error) {
    console.error("User stats API error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

