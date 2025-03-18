import { NextResponse } from "next/server"
import { supabase } from "@/lib/api-client"
import { auth } from "@/lib/auth"
import { createClient } from "@supabase/supabase-js"

// Инициализация Supabase клиента
const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!
const supabaseService = createClient(supabaseUrl, supabaseKey)

export async function GET(request: Request, { params }: { params: { id: string } }) {
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

    const userId = params.id

    // Получение данных пользователя
    const { data: user, error: userDataError } = await supabase
      .from("users")
      .select(`
        id,
        username,
        telegram_id,
        avatar_url,
        role,
        status,
        balance,
        created_at,
        last_login
      `)
      .eq("id", userId)
      .single()

    if (userDataError) {
      console.error("Error fetching user data:", userDataError)
      return NextResponse.json({ error: "Failed to fetch user data" }, { status: 500 })
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Получение статистики игр пользователя
    const { data: gamesStats, error: gamesStatsError } = await supabase.rpc("get_user_games_stats", {
      user_id_param: userId,
    })

    if (gamesStatsError) {
      console.error("Error fetching games stats:", gamesStatsError)
      // Продолжаем выполнение, так как это не критическая ошибка
    }

    // Получение финансовой статистики пользователя
    const { data: financialStats, error: financialStatsError } = await supabase.rpc("get_user_financial_stats", {
      user_id_param: userId,
    })

    if (financialStatsError) {
      console.error("Error fetching financial stats:", financialStatsError)
      // Продолжаем выполнение, так как это не критическая ошибка
    }

    // Форматирование ответа
    const formattedUser = {
      id: user.id,
      username: user.username,
      telegramId: user.telegram_id,
      avatarUrl: user.avatar_url,
      role: user.role,
      status: user.status,
      balance: user.balance,
      createdAt: user.created_at,
      lastLogin: user.last_login,
      gamesStats: gamesStats || {
        totalGames: 0,
        wins: 0,
        winRate: 0,
      },
      financialStats: financialStats || {
        totalDeposits: 0,
        totalWithdrawals: 0,
        profitLoss: 0,
      },
    }

    return NextResponse.json(formattedUser)
  } catch (error) {
    console.error("User details API error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
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

    const userId = params.id

    // Получение данных из запроса
    const requestData = await request.json()

    // Проверка существования пользователя
    const { data: existingUser, error: existingUserError } = await supabase
      .from("users")
      .select("id")
      .eq("id", userId)
      .single()

    if (existingUserError || !existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Подготовка данных для обновления
    const updateData: any = {}

    if (requestData.username) {
      updateData.username = requestData.username
    }

    if (requestData.role) {
      // Проверка, что только ADMIN может назначать роль ADMIN
      if (requestData.role === "ADMIN" && userData.role !== "ADMIN") {
        return NextResponse.json({ error: "Only admins can assign admin role" }, { status: 403 })
      }
      updateData.role = requestData.role
    }

    if (requestData.status) {
      updateData.status = requestData.status
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No data to update" }, { status: 400 })
    }

    // Обновление данных пользователя
    const { data: updatedUser, error: updateError } = await supabase
      .from("users")
      .update(updateData)
      .eq("id", userId)
      .select()
      .single()

    if (updateError) {
      console.error("Error updating user:", updateError)
      return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
    }

    // Форматирование ответа
    const formattedUser = {
      id: updatedUser.id,
      username: updatedUser.username,
      telegramId: updatedUser.telegram_id,
      avatarUrl: updatedUser.avatar_url,
      role: updatedUser.role,
      status: updatedUser.status,
      balance: updatedUser.balance,
      createdAt: updatedUser.created_at,
      lastLogin: updatedUser.last_login,
    }

    return NextResponse.json(formattedUser)
  } catch (error) {
    console.error("Update user API error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const body = await request.json()

    // Проверяем, что обновляются только разрешенные поля
    const allowedFields = ["username", "role", "vip_status"]
    const updateData: Record<string, any> = {}

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    const { data, error } = await supabaseService.from("users").update(updateData).eq("id", id).select().single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error("Ошибка обновления пользователя:", error)
    return NextResponse.json({ message: "Внутренняя ошибка сервера" }, { status: 500 })
  }
}

