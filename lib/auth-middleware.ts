import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "./jwt"
import { prisma } from "./prisma"

export type AuthenticatedRequest = NextRequest & {
  user: {
    id: number
    telegramId: number
    firstName: string
    lastName?: string
    username?: string
    role?: string
  }
}

export function withAuth(handler: (req: NextRequest, user: any, token?: string) => Promise<NextResponse>) {
  return async (req: NextRequest) => {
    try {
      // Получаем токен из заголовка Authorization
      const authHeader = req.headers.get("Authorization")
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }

      const token = authHeader.split(" ")[1]

      // Проверка на мок-токен в режиме разработки
      if (process.env.NODE_ENV === "development" && token === "mock_token_for_development") {
        // Используем мок-пользователя для разработки
        const mockUser = {
          id: 12345678,
          telegramId: 12345678,
          firstName: "Demo",
          lastName: "User",
          username: "demouser",
          role: "admin",
        }

        // Вызываем обработчик с мок-пользователем
        return handler(req, mockUser, token)
      }

      // Верифицируем JWT токен
      const payload = verifyToken(token)

      if (!payload) {
        return NextResponse.json({ error: "Invalid token" }, { status: 401 })
      }

      // Получаем пользователя из базы данных
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
      })

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 401 })
      }

      // Проверяем, не забанен ли пользователь
      if (user.banned) {
        return NextResponse.json({ error: "User is banned" }, { status: 403 })
      }

      // Вызываем обработчик с аутентифицированным пользователем
      return handler(req, user, token)
    } catch (error) {
      console.error("Authentication error:", error)
      return NextResponse.json({ error: "Authentication failed" }, { status: 401 })
    }
  }
}

