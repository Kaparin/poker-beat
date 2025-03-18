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

    // Получение последних зарегистрированных пользователей
    const { data: recentUsers, error: recentUsersError } = await supabase
      .from("users")
      .select("id, username, telegram_id, avatar_url, created_at")
      .order("created_at", { ascending: false })
      .limit(5)

    if (recentUsersError) {
      console.error("Error fetching recent users:", recentUsersError)
      return NextResponse.json({ error: "Failed to fetch recent users" }, { status: 500 })
    }

    // Преобразование данных в нужный формат
    const formattedUsers = recentUsers.map((user) => ({
      id: user.id,
      username: user.username,
      telegramId: user.telegram_id,
      avatarUrl: user.avatar_url,
      createdAt: user.created_at,
    }))

    return NextResponse.json(formattedUsers)
  } catch (error) {
    console.error("Recent users API error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

