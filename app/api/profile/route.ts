import { NextResponse } from "next/server"
import { supabase } from "@/lib/api-client"
import { auth } from "@/lib/auth"

export async function GET(request: Request) {
  try {
    // Проверка аутентификации
    const session = await auth()
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Получение данных пользователя
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select(`
        id,
        username,
        telegram_id,
        avatar_url,
        status,
        role,
        created_at,
        last_login,
        vip_status,
        vip_points,
        referral_code,
        referred_by
      `)
      .eq("id", session.user.id)
      .single()

    if (userError) {
      console.error("Error fetching user data:", userError)
      return NextResponse.json({ error: "Failed to fetch user data" }, { status: 500 })
    }

    // Получение данных кошелька
    const { data: walletData, error: walletError } = await supabase
      .from("wallets")
      .select("balance")
      .eq("user_id", session.user.id)
      .single()

    if (walletError) {
      console.error("Error fetching wallet data:", walletError)
      return NextResponse.json({ error: "Failed to fetch wallet data" }, { status: 500 })
    }

    // Получение данных о настройках пользователя
    const { data: settingsData, error: settingsError } = await supabase
      .from("user_settings")
      .select("theme, notifications_enabled, sound_enabled")
      .eq("user_id", session.user.id)
      .single()

    if (settingsError && settingsError.code !== "PGRST116") {
      console.error("Error fetching user settings:", settingsError)
      return NextResponse.json({ error: "Failed to fetch user settings" }, { status: 500 })
    }

    // Получение количества непрочитанных уведомлений
    const { count: unreadCount, error: unreadError } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", session.user.id)
      .eq("read", false)

    if (unreadError) {
      console.error("Error counting unread notifications:", unreadError)
      return NextResponse.json({ error: "Failed to count unread notifications" }, { status: 500 })
    }

    // Формирование ответа
    const profile = {
      id: userData.id,
      username: userData.username,
      telegramId: userData.telegram_id,
      avatarUrl: userData.avatar_url,
      status: userData.status,
      role: userData.role,
      createdAt: userData.created_at,
      lastLogin: userData.last_login,
      vipStatus: userData.vip_status,
      vipPoints: userData.vip_points,
      referralCode: userData.referral_code,
      referredBy: userData.referred_by,
      balance: walletData.balance,
      settings: settingsData || {
        theme: "light",
        notificationsEnabled: true,
        soundEnabled: true,
      },
      unreadNotifications: unreadCount,
    }

    return NextResponse.json(profile)
  } catch (error) {
    console.error("Profile API error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    // Проверка аутентификации
    const session = await auth()
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Получение данных из запроса
    const body = await request.json()
    const { username, avatarUrl } = body

    const updateData: any = {}

    if (username !== undefined) {
      // Проверка, что имя пользователя не занято
      const { data: existingUser, error: existingUserError } = await supabase
        .from("users")
        .select("id")
        .eq("username", username)
        .neq("id", session.user.id)

      if (existingUserError) {
        console.error("Error checking username availability:", existingUserError)
        return NextResponse.json({ error: "Failed to check username availability" }, { status: 500 })
      }

      if (existingUser.length > 0) {
        return NextResponse.json({ error: "Username is already taken" }, { status: 400 })
      }

      updateData.username = username
    }

    if (avatarUrl !== undefined) {
      updateData.avatar_url = avatarUrl
    }

    // Обновление данных пользователя
    const { data, error } = await supabase
      .from("users")
      .update(updateData)
      .eq("id", session.user.id)
      .select(`
        id,
        username,
        telegram_id,
        avatar_url,
        status,
        role,
        created_at,
        last_login,
        vip_status,
        vip_points,
        referral_code,
        referred_by
      `)
      .single()

    if (error) {
      console.error("Error updating user data:", error)
      return NextResponse.json({ error: "Failed to update user data" }, { status: 500 })
    }

    // Получение данных кошелька
    const { data: walletData, error: walletError } = await supabase
      .from("wallets")
      .select("balance")
      .eq("user_id", session.user.id)
      .single()

    if (walletError) {
      console.error("Error fetching wallet data:", walletError)
      return NextResponse.json({ error: "Failed to fetch wallet data" }, { status: 500 })
    }

    // Получение данных о настройках пользователя
    const { data: settingsData, error: settingsError } = await supabase
      .from("user_settings")
      .select("theme, notifications_enabled, sound_enabled")
      .eq("user_id", session.user.id)
      .single()

    if (settingsError && settingsError.code !== "PGRST116") {
      console.error("Error fetching user settings:", settingsError)
      return NextResponse.json({ error: "Failed to fetch user settings" }, { status: 500 })
    }

    // Формирование ответа
    const profile = {
      id: data.id,
      username: data.username,
      telegramId: data.telegram_id,
      avatarUrl: data.avatar_url,
      status: data.status,
      role: data.role,
      createdAt: data.created_at,
      lastLogin: data.last_login,
      vipStatus: data.vip_status,
      vipPoints: data.vip_points,
      referralCode: data.referral_code,
      referredBy: data.referred_by,
      balance: walletData.balance,
      settings: settingsData || {
        theme: "light",
        notificationsEnabled: true,
        soundEnabled: true,
      },
    }

    return NextResponse.json(profile)
  } catch (error) {
    console.error("Profile API error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

