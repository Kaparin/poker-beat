"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function DevLoginPage() {
  const router = useRouter()

  // Проверяем, что мы в режиме разработки
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") {
      router.push("/")
    }
  }, [router])

  const handleTestLogin = () => {
    // Создаем мок-пользователя для локальной разработки
    const mockUser = {
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

    // Сохраняем в localStorage
    localStorage.setItem("auth_token", "mock_token_for_development")
    localStorage.setItem("auth_refresh_token", "mock_refresh_token_for_development")
    localStorage.setItem("auth_user", JSON.stringify(mockUser))
    localStorage.setItem("auth_token_expiry", (Date.now() + 24 * 60 * 60 * 1000).toString())

    // Перенаправляем на главную страницу
    router.push("/")
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="p-6 bg-white rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-6">Тестовый вход для разработки</h1>
        <p className="mb-4 text-gray-600">
          Эта страница доступна только в режиме разработки и позволяет войти в приложение без Telegram.
        </p>
        <Button onClick={handleTestLogin} className="w-full py-2">
          Войти как тестовый пользователь
        </Button>
      </div>
    </div>
  )
}

