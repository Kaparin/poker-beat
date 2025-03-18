import type { NextRequest } from "next/server"
import jwt from "jsonwebtoken"
import { cookies } from "next/headers"
import { getUserById } from "./db-schema"

// Типы для аутентификации
export type Session = {
  user: {
    id: string
    username: string
    isAdmin: boolean
  }
}

// Функция для проверки аутентификации
export async function auth(): Promise<Session | null> {
  const cookieStore = cookies()
  const token = cookieStore.get("token")?.value

  if (!token) {
    return null
  }

  try {
    // Проверяем JWT токен
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string
      username: string
      isAdmin?: boolean
    }

    // Проверяем, существует ли пользователь в базе данных
    const user = await getUserById(decoded.userId)

    if (!user) {
      return null
    }

    // Проверяем, не заблокирован ли пользователь
    if (user.status !== "active") {
      return null
    }

    return {
      user: {
        id: user.id,
        username: user.username,
        isAdmin: user.is_admin || false,
      },
    }
  } catch (error) {
    console.error("Auth error:", error)
    return null
  }
}

// Функция для проверки аутентификации в API-маршрутах
export async function apiAuth(request: NextRequest): Promise<Session | null> {
  // Получаем токен из заголовка Authorization или из cookie
  const authHeader = request.headers.get("authorization")
  const token = authHeader?.split(" ")[1] || request.cookies.get("token")?.value

  if (!token) {
    return null
  }

  try {
    // Проверяем JWT токен
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string
      username: string
      isAdmin?: boolean
    }

    // Проверяем, существует ли пользователь в базе данных
    const user = await getUserById(decoded.userId)

    if (!user) {
      return null
    }

    // Проверяем, не заблокирован ли пользователь
    if (user.status !== "active") {
      return null
    }

    return {
      user: {
        id: user.id,
        username: user.username,
        isAdmin: user.is_admin || false,
      },
    }
  } catch (error) {
    console.error("API auth error:", error)
    return null
  }
}

// Функция для создания JWT токена
export function createToken(userId: string, username: string, isAdmin = false): string {
  return jwt.sign(
    {
      userId,
      username,
      isAdmin,
    },
    process.env.JWT_SECRET!,
    {
      expiresIn: "7d", // Токен действителен 7 дней
      audience: process.env.JWT_AUDIENCE,
      issuer: process.env.JWT_ISSUER,
    },
  )
}

