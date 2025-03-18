import { NextResponse } from "next/server"
import { generateToken } from "@/lib/jwt"
import crypto from "crypto"

export async function POST() {
  try {
    // Проверяем, что мы в режиме разработки
    if (process.env.NODE_ENV !== "development") {
      return NextResponse.json({ error: "Not allowed in production" }, { status: 403 })
    }

    // Создаем тестового пользователя
    const user = {
      id: 12345678,
      telegramId: 12345678,
      firstName: "Demo",
      lastName: "User",
      username: "demouser",
      photoUrl: "/placeholder.svg?height=200&width=200",
      balance: 5000,
      tonBalance: 0.5,
      role: "admin", // Для тестирования функций администратора
    }

    // Генерируем токены
    const accessToken = generateToken({
      userId: user.id,
      telegramId: user.telegramId,
    })

    // Генерируем refresh token
    const refreshToken = crypto.randomBytes(64).toString("hex")

    // Возвращаем токены
    return NextResponse.json({
      accessToken,
      refreshToken,
      user,
    })
  } catch (error) {
    console.error("Mock login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

