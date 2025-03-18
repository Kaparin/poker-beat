import { NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { createClient } from "@supabase/supabase-js"
import bcrypt from "bcryptjs"
import { logSecurityEvent } from "@/lib/db-schema"

// Инициализация Supabase клиента
const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// Секретный ключ для JWT
const JWT_SECRET = process.env.JWT_SECRET!

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ message: "Имя пользователя и пароль обязательны" }, { status: 400 })
    }

    // Проверяем пользователя в базе данных
    const { data: user, error } = await supabase.from("users").select("*").eq("username", username).single()

    if (error || !user) {
      // Логируем неудачную попытку входа
      await logSecurityEvent({
        action: "admin_login_failed",
        details: { username, reason: "user_not_found" },
        ip_address: request.headers.get("x-forwarded-for") || "unknown",
      })

      return NextResponse.json({ message: "Неверные учетные данные" }, { status: 401 })
    }

    // Проверяем, является ли пользователь администратором
    if (!user.is_admin) {
      // Логируем неудачную попытку входа
      await logSecurityEvent({
        action: "admin_login_failed",
        user_id: user.id,
        details: { username, reason: "not_admin" },
        ip_address: request.headers.get("x-forwarded-for") || "unknown",
      })

      return NextResponse.json({ message: "Недостаточно прав" }, { status: 403 })
    }

    // Проверяем пароль
    if (user.password_hash && !bcrypt.compareSync(password, user.password_hash)) {
      // Логируем неудачную попытку входа
      await logSecurityEvent({
        action: "admin_login_failed",
        user_id: user.id,
        details: { username, reason: "invalid_password" },
        ip_address: request.headers.get("x-forwarded-for") || "unknown",
      })

      return NextResponse.json({ message: "Неверные учетные данные" }, { status: 401 })
    }

    // Создаем JWT токен
    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        isAdmin: true,
      },
      JWT_SECRET,
      {
        expiresIn: "24h", // Токен действителен 24 часа
        audience: process.env.JWT_AUDIENCE,
        issuer: process.env.JWT_ISSUER,
      },
    )

    // Логируем успешный вход
    await logSecurityEvent({
      action: "admin_login_success",
      user_id: user.id,
      details: { username },
      ip_address: request.headers.get("x-forwarded-for") || "unknown",
    })

    return NextResponse.json({ token })
  } catch (error) {
    console.error("Ошибка входа в админ-панель:", error)
    return NextResponse.json({ message: "Внутренняя ошибка сервера" }, { status: 500 })
  }
}

