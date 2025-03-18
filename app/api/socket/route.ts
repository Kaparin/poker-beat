import type { NextRequest } from "next/server"
import { Server as SocketIOServer } from "socket.io"
import { createServer } from "http"
import { verifyToken } from "@/lib/jwt"
import prisma from "@/lib/prisma"

// Глобальная переменная для хранения экземпляра Socket.IO
let io: SocketIOServer | null = null
let httpServer: any = null

// Конфигурация для Next.js Edge Runtime
export const config = {
  api: {
    bodyParser: false,
  },
  runtime: "nodejs", // Явно указываем nodejs runtime
}

export async function GET(req: NextRequest) {
  try {
    // Для режима разработки используем имитационный ответ
    if (process.env.NODE_ENV === "development") {
      return new Response("WebSocket сервер работает в режиме имитации для разработки", {
        status: 200,
        headers: {
          "Content-Type": "text/plain",
        },
      })
    }

    // Инициализируем Socket.IO сервер, если он еще не создан
    if (!io) {
      console.log("Инициализация Socket.IO сервера...")

      // Создаем HTTP сервер
      httpServer = createServer()

      // Создаем Socket.IO сервер
      io = new SocketIOServer(httpServer, {
        cors: {
          origin: process.env.FRONTEND_URL || "http://localhost:3000",
          methods: ["GET", "POST"],
          credentials: true,
        },
        path: "/api/socket",
        pingTimeout: 30000,
        pingInterval: 10000,
      })

      // Настраиваем middleware для аутентификации
      io.use(async (socket, next) => {
        try {
          const token = socket.handshake.auth.token

          if (!token) {
            return next(new Error("Ошибка аутентификации: Токен не предоставлен"))
          }

          // Проверяем токен
          const payload = verifyToken(token)

          if (!payload) {
            return next(new Error("Ошибка аутентификации: Недействительный токен"))
          }

          // Получаем пользователя из базы данных
          const user = await prisma.user.findUnique({
            where: { id: payload.userId },
          })

          if (!user) {
            return next(new Error("Ошибка аутентификации: Пользователь не найден"))
          }

          // Проверяем, не забанен ли пользователь
          if (user.banned) {
            return next(new Error("Ошибка аутентификации: Пользователь забанен"))
          }

          // Прикрепляем пользователя к сокету
          socket.data.user = user

          next()
        } catch (error) {
          console.error("Ошибка аутентификации сокета:", error)
          next(new Error("Ошибка аутентификации"))
        }
      })

      // Настраиваем обработчики событий
      io.on("connection", (socket) => {
        console.log("Клиент подключен:", socket.id)

        // Здесь будут обработчики событий из server/index.ts
        // Для полной реализации скопируйте обработчики из server/index.ts

        socket.on("disconnect", () => {
          console.log("Клиент отключен:", socket.id)
        })
      })

      // Запускаем сервер на указанном порту
      const port = process.env.PORT || 3001
      httpServer.listen(port, () => {
        console.log(`WebSocket сервер запущен на порту ${port}`)
      })
    }

    return new Response("WebSocket сервер запущен", {
      status: 200,
      headers: {
        "Content-Type": "text/plain",
      },
    })
  } catch (error) {
    console.error("Ошибка WebSocket:", error)
    return new Response("Внутренняя ошибка сервера", { status: 500 })
  }
}

