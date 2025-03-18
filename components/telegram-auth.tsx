"use client"

import { useEffect, useCallback } from "react"
import { ProfileDisplay } from "./profile-display"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { User, Wallet, PlayCircle } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { isTelegramWebApp, getTelegramUserSafely } from "@/lib/telegram-utils"

export function TelegramAuth() {
  const { user, loading, error, login } = useAuth()

  // Оптимизированная функция для инициализации Telegram WebApp
  const initTelegramWebApp = useCallback(() => {
    if (isTelegramWebApp()) {
      window.Telegram.WebApp.ready()
      window.Telegram.WebApp.expand()

      // Добавляем обработчик для кнопки "Назад" в Telegram
      window.Telegram.WebApp.BackButton.onClick(() => {
        // Проверяем, находимся ли мы на главной странице
        if (window.location.pathname === "/") {
          window.Telegram.WebApp.close()
        } else {
          window.history.back()
        }
      })
    }
  }, [])

  // Оптимизированная функция для автоматического входа
  const attemptAutoLogin = useCallback(() => {
    if (!user && !loading && !error) {
      const { isValid } = getTelegramUserSafely()
      if (isValid) {
        login()
      }
    }
  }, [user, loading, error, login])

  useEffect(() => {
    initTelegramWebApp()
    attemptAutoLogin()

    // Добавляем обработчик для изменения темы Telegram
    const handleThemeChange = () => {
      if (isTelegramWebApp() && window.Telegram.WebApp.colorScheme) {
        document.documentElement.classList.toggle("dark", window.Telegram.WebApp.colorScheme === "dark")
      }
    }

    if (isTelegramWebApp()) {
      window.Telegram.WebApp.onEvent("themeChanged", handleThemeChange)
      // Применяем текущую тему
      handleThemeChange()
    }

    return () => {
      if (isTelegramWebApp()) {
        window.Telegram.WebApp.offEvent("themeChanged", handleThemeChange)
      }
    }
  }, [initTelegramWebApp, attemptAutoLogin])

  // Функция для тестового входа (только в режиме разработки)
  const handleTestLogin = useCallback(() => {
    console.log("Нажата кнопка тестового входа")

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

    // Перезагружаем страницу
    window.location.href = "/"
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="w-16 h-16 border-t-4 border-b-4 border-blue-500 rounded-full animate-spin"></div>
        <p className="mt-4 text-lg">Подключение к Telegram...</p>

        {/* Кнопка для тестового входа */}
        {process.env.NODE_ENV === "development" && (
          <Button onClick={handleTestLogin} className="mt-4" variant="outline">
            Тестовый вход (только для разработки)
          </Button>
        )}
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="p-4 text-white bg-red-500 rounded-lg">
          <p className="text-lg font-bold">Ошибка</p>
          <p>{error}</p>
          <div className="flex mt-4 space-x-2">
            <Button onClick={login}>Попробовать снова</Button>

            {/* Кнопка для тестового входа */}
            {process.env.NODE_ENV === "development" && (
              <Button onClick={handleTestLogin} variant="outline">
                Тестовый вход
              </Button>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="p-4 bg-blue-100 text-blue-700 rounded-lg">
          <p className="text-lg font-bold">Добро пожаловать в Poker Beat</p>
          <p>Пожалуйста, войдите, чтобы продолжить</p>
          <div className="flex flex-col space-y-2 mt-4">
            <Button onClick={login}>Войти через Telegram</Button>

            {/* Кнопка для тестового входа */}
            {process.env.NODE_ENV === "development" && (
              <Button onClick={handleTestLogin} variant="outline">
                Тестовый вход (только для разработки)
              </Button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Convert user data to TelegramUser format for ProfileDisplay
  const telegramUser = {
    id: user.telegramId,
    first_name: user.firstName,
    last_name: user.lastName,
    username: user.username,
    photo_url: user.photoUrl,
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-blue-600">Poker Beat</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">Добро пожаловать в покер-приложение Telegram!</p>
        </div>

        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold">Привет, {user.firstName}!</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-300">Вы успешно вошли через Telegram.</p>
        </div>

        <ProfileDisplay user={telegramUser} balance={user.balance} />

        <div className="mt-8 flex justify-center space-x-4">
          <Link href="/profile">
            <Button className="px-6 py-2 flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span>Профиль</span>
            </Button>
          </Link>
          <Link href="/wallet">
            <Button className="px-6 py-2 flex items-center space-x-2" variant="outline">
              <Wallet className="h-4 w-4" />
              <span>Кошелек</span>
            </Button>
          </Link>
          <Link href="/lobby">
            <Button className="px-6 py-2 flex items-center space-x-2" variant="secondary">
              <PlayCircle className="h-4 w-4" />
              <span>Играть</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

