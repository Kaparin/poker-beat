"use client"

import { createContext, useContext, useState, useEffect, type ReactNode, useCallback, useMemo } from "react"
import { getInitData, isTelegramWebApp } from "@/lib/telegram-utils"
import { setRefreshTokenCallback } from "@/lib/secure-socket-client"
import { injectMockTelegramData } from "../lib/mock-telegram-data"
import { toast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

interface User {
  id: number
  telegramId: number
  firstName: string
  lastName?: string
  username?: string
  photoUrl?: string
  inGameName?: string
  balance: number
  tonBalance: number
  role?: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  refreshToken: string | null
  loading: boolean
  error: string | null
  login: () => Promise<void>
  logout: () => Promise<void>
  refreshAccessToken: () => Promise<boolean>
  updateUserData: (userData: Partial<User>) => void
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  refreshToken: null,
  loading: true,
  error: null,
  login: async () => {},
  logout: async () => {},
  refreshAccessToken: async () => false,
  updateUserData: () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [refreshToken, setRefreshToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tokenExpiryTime, setTokenExpiryTime] = useState<number | null>(null)
  const [refreshAttempts, setRefreshAttempts] = useState(0)
  const [lastRefreshTime, setLastRefreshTime] = useState(0)

  // Update user data (e.g., after balance changes)
  const updateUserData = useCallback((userData: Partial<User>) => {
    setUser((currentUser) => {
      if (!currentUser) return null
      return { ...currentUser, ...userData }
    })
  }, [])

  const logout = useCallback(async () => {
    try {
      if (token && refreshToken) {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ refreshToken }),
        }).catch((err) => console.error("Logout API error:", err))
      }
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      setUser(null)
      setToken(null)
      setRefreshToken(null)
      setTokenExpiryTime(null)
      localStorage.removeItem("auth_token")
      localStorage.removeItem("auth_refresh_token")
      localStorage.removeItem("auth_user")
      localStorage.removeItem("auth_token_expiry")

      // Перенаправляем на главную страницу
      router.push("/")
    }
  }, [token, refreshToken, router])

  const refreshAccessToken = useCallback(async () => {
    if (!refreshToken) return false

    // Предотвращаем слишком частые запросы на обновление токена
    const now = Date.now()
    if (now - lastRefreshTime < 10000) {
      // Не чаще чем раз в 10 секунд
      console.log("Throttling token refresh requests")
      return false
    }

    // Ограничиваем количество попыток обновления токена
    if (refreshAttempts >= 5) {
      console.error("Too many refresh attempts, forcing logout")
      logout()
      return false
    }

    setLastRefreshTime(now)
    setRefreshAttempts((prev) => prev + 1)

    try {
      const response = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to refresh token")
      }

      // Сбрасываем счетчик попыток при успешном обновлении
      setRefreshAttempts(0)

      // Update the token
      setToken(data.token)

      // Set token expiry time (24 hours from now)
      const newExpiryTime = Date.now() + 24 * 60 * 60 * 1000
      setTokenExpiryTime(newExpiryTime)
      localStorage.setItem("auth_token", data.token)
      localStorage.setItem("auth_token_expiry", newExpiryTime.toString())

      return true
    } catch (error) {
      console.error("Token refresh error:", error)

      // Если ошибка связана с недействительным refresh token, выполняем logout
      if (
        error instanceof Error &&
        (error.message.includes("Invalid refresh token") ||
          error.message.includes("Refresh token expired") ||
          error.message.includes("Refresh token revoked"))
      ) {
        logout()
      }

      return false
    }
  }, [refreshToken, logout, refreshAttempts, lastRefreshTime])

  // Check for existing token on mount
  useEffect(() => {
    // Set up the refresh token callback for the socket client
    setRefreshTokenCallback(async () => {
      if (refreshToken) {
        try {
          const success = await refreshAccessToken()
          if (success && token) {
            return token
          }
        } catch (error) {
          console.error("Failed to refresh token for socket:", error)
        }
      }
      return null
    })

    const storedToken = localStorage.getItem("auth_token")
    const storedRefreshToken = localStorage.getItem("auth_refresh_token")
    const storedUser = localStorage.getItem("auth_user")
    const storedTokenExpiry = localStorage.getItem("auth_token_expiry")

    if (storedToken && storedRefreshToken && storedUser && storedTokenExpiry) {
      const expiryTime = Number.parseInt(storedTokenExpiry, 10)

      // If token is expired, try to refresh it
      if (Date.now() > expiryTime) {
        setRefreshToken(storedRefreshToken)
        refreshAccessToken().then((success) => {
          if (!success) {
            setLoading(false)
          }
        })
      } else {
        try {
          setToken(storedToken)
          setRefreshToken(storedRefreshToken)
          setUser(JSON.parse(storedUser))
          setTokenExpiryTime(expiryTime)
        } catch (error) {
          console.error("Error parsing stored user data:", error)
          localStorage.removeItem("auth_user")
        } finally {
          setLoading(false)
        }
      }
    } else {
      setLoading(false)
    }
  }, [refreshAccessToken, refreshToken, token])

  // Set up token refresh timer
  useEffect(() => {
    // Функция для проверки и обновления токена
    const checkAndRefreshToken = async () => {
      // Проверяем, истекает ли токен в ближайшие 5 минут
      if (token && tokenExpiryTime && Date.now() > tokenExpiryTime - 5 * 60 * 1000) {
        console.log("Token is about to expire, refreshing...")
        await refreshAccessToken()
      }
    }

    // Проверяем при монтировании компонента
    checkAndRefreshToken()

    // Устанавливаем интервал для периодической проверки
    const timer = setInterval(checkAndRefreshToken, 60 * 1000) // Проверяем каждую минуту

    return () => clearInterval(timer)
  }, [token, tokenExpiryTime, refreshAccessToken])

  const login = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Get Telegram user data
      if (isTelegramWebApp()) {
        let initData = getInitData()

        // Для локальной разработки
        if (process.env.NODE_ENV === "development" && !initData) {
          injectMockTelegramData()
          // @ts-ignore
          initData = window.Telegram?.WebApp?.initData
        }

        if (!initData) {
          throw new Error("No Telegram init data available")
        }

        // Send to our API for verification
        const response = await fetch("/api/auth", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ initData }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Authentication failed")
        }

        // Store user and tokens
        setUser(data.user)
        setToken(data.token)
        setRefreshToken(data.refreshToken)

        // Set token expiry time (24 hours from now)
        const expiryTime = Date.now() + 24 * 60 * 60 * 1000
        setTokenExpiryTime(expiryTime)

        // Save to localStorage
        localStorage.setItem("auth_token", data.token)
        localStorage.setItem("auth_refresh_token", data.refreshToken)
        localStorage.setItem("auth_user", JSON.stringify(data.user))
        localStorage.setItem("auth_token_expiry", expiryTime.toString())

        toast({
          title: "Успешный вход",
          description: `Добро пожаловать, ${data.user.firstName}!`,
        })
      } else {
        // For development/testing without Telegram
        try {
          // Пробуем использовать mock-login API
          const response = await fetch("/api/auth/mock-login", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
          })

          if (!response.ok) {
            throw new Error("Mock login API failed")
          }

          const data = await response.json()

          setUser(data.user)
          setToken(data.accessToken)
          setRefreshToken(data.refreshToken)

          const expiryTime = Date.now() + 24 * 60 * 60 * 1000
          setTokenExpiryTime(expiryTime)

          localStorage.setItem("auth_token", data.accessToken)
          localStorage.setItem("auth_refresh_token", data.refreshToken)
          localStorage.setItem("auth_user", JSON.stringify(data.user))
          localStorage.setItem("auth_token_expiry", expiryTime.toString())

          toast({
            title: "Тестовый вход выполнен",
            description: "Вы вошли в режиме разработки",
          })
        } catch (apiError) {
          console.error("Mock login API error:", apiError)

          // Fallback to hardcoded mock user
          const mockUser = {
            id: 12345678,
            telegramId: 12345678,
            firstName: "Demo",
            lastName: "User",
            username: "demouser",
            photoUrl: "/placeholder.svg?height=200&width=200",
            balance: 5000,
            tonBalance: 0.5,
            role: "admin", // For testing admin features
          }

          const mockToken = "mock_token_for_development"
          const mockRefreshToken = "mock_refresh_token_for_development"

          setUser(mockUser)
          setToken(mockToken)
          setRefreshToken(mockRefreshToken)

          const expiryTime = Date.now() + 24 * 60 * 60 * 1000
          setTokenExpiryTime(expiryTime)

          // Save to localStorage
          localStorage.setItem("auth_token", mockToken)
          localStorage.setItem("auth_refresh_token", mockRefreshToken)
          localStorage.setItem("auth_user", JSON.stringify(mockUser))
          localStorage.setItem("auth_token_expiry", expiryTime.toString())

          toast({
            title: "Тестовый вход выполнен",
            description: "Вы вошли с тестовым пользователем",
          })
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed")
      console.error("Login error:", err)

      toast({
        title: "Ошибка входа",
        description: err instanceof Error ? err.message : "Не удалось выполнить вход",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [])

  // Мемоизируем контекстное значение для предотвращения ненужных ререндеров
  const contextValue = useMemo(
    () => ({
      user,
      token,
      refreshToken,
      loading,
      error,
      login,
      logout,
      refreshAccessToken,
      updateUserData,
    }),
    [user, token, refreshToken, loading, error, login, logout, refreshAccessToken, updateUserData],
  )

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}

