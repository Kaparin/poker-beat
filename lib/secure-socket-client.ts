import { io, type Socket } from "socket.io-client"
import type { PlayerAction } from "@/types/poker"
import { toast } from "@/hooks/use-toast"

// Socket.IO клиент-синглтон
let socket: Socket | null = null
let refreshTokenCallback: (() => Promise<string | null>) | null = null
let reconnectAttempts = 0
const MAX_RECONNECT_ATTEMPTS = 5
let connectionStatus: "connected" | "connecting" | "disconnected" = "disconnected"
const pendingRequests: Map<string, { resolve: Function; reject: Function; timeout: NodeJS.Timeout }> = new Map()

// Функция для обработки ошибок соединения
function handleConnectionError(message: string) {
  console.error(`Ошибка соединения WebSocket: ${message}`)

  // Показываем уведомление пользователю
  if (typeof window !== "undefined") {
    toast({
      title: "Ошибка соединения",
      description: message,
      variant: "destructive",
    })
  }
}

export function setRefreshTokenCallback(callback: () => Promise<string | null>) {
  refreshTokenCallback = callback
}

export function getConnectionStatus(): string {
  return connectionStatus
}

export function getSocket(token: string): Socket {
  if (!socket) {
    connectionStatus = "connecting"

    // Создаем новое соединение
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin
    console.log(`Подключение к WebSocket серверу: ${socketUrl}`)

    socket = io(socketUrl, {
      path: "/api/socket",
      auth: {
        token,
      },
      reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      transports: ["websocket", "polling"], // Предпочитаем WebSocket, но с fallback на polling
    })

    // Настраиваем обработчики событий по умолчанию
    socket.on("connect", () => {
      console.log("Подключено к серверу")
      connectionStatus = "connected"
      reconnectAttempts = 0

      // Уведомляем пользователя о восстановлении соединения, если были попытки переподключения
      if (reconnectAttempts > 0) {
        toast({
          title: "Соединение восстановлено",
          description: "Подключение к игровому серверу восстановлено.",
        })
      }
    })

    socket.on("connect_error", (error) => {
      console.error("Ошибка подключения:", error.message)
      connectionStatus = "disconnected"
      handleConnectionError("Не удалось подключиться к игровому серверу. Проверьте ваше интернет-соединение.")

      // Отклоняем все ожидающие запросы
      for (const [requestId, { reject, timeout }] of pendingRequests.entries()) {
        clearTimeout(timeout)
        reject(new Error("Соединение потеряно"))
        pendingRequests.delete(requestId)
      }
    })

    socket.on("disconnect", (reason) => {
      console.log("Отключено от сервера:", reason)
      connectionStatus = "disconnected"

      if (reason === "io server disconnect") {
        // Сервер разорвал соединение, нужно переподключиться вручную
        socket?.connect()
      }

      // Отклоняем все ожидающие запросы
      for (const [requestId, { reject, timeout }] of pendingRequests.entries()) {
        clearTimeout(timeout)
        reject(new Error(`Соединение разорвано: ${reason}`))
        pendingRequests.delete(requestId)
      }

      // Уведомляем пользователя о потере соединения
      if (reason !== "io client disconnect") {
        toast({
          title: "Соединение потеряно",
          description: "Соединение с игровым сервером потеряно. Пытаемся переподключиться...",
        })
      }
    })

    socket.on("error", (error) => {
      console.error("Ошибка сокета:", error)

      // Если ошибка связана с недействительным токеном, пытаемся обновить токен
      if (error.message?.includes("Authentication error") && refreshTokenCallback) {
        refreshTokenCallback().then((newToken) => {
          if (newToken) {
            // Переподключаемся с новым токеном
            socket?.disconnect()
            socket = null
            getSocket(newToken)
          } else {
            handleConnectionError("Не удалось обновить аутентификацию. Пожалуйста, войдите снова.")
          }
        })
      } else {
        handleConnectionError(`Произошла ошибка: ${error.message || "Неизвестная ошибка"}`)
      }
    })

    // Обработка переподключения
    socket.on("reconnect_attempt", (attemptNumber) => {
      console.log(`Попытка переподключения (${attemptNumber}/${MAX_RECONNECT_ATTEMPTS})...`)
      connectionStatus = "connecting"
      reconnectAttempts = attemptNumber

      // Если у нас есть callback для обновления токена, пытаемся получить новый токен
      if (refreshTokenCallback) {
        refreshTokenCallback().then((newToken) => {
          if (newToken && socket) {
            // Обновляем данные аутентификации с новым токеном
            socket.auth = { token: newToken }
          }
        })
      }
    })

    socket.on("reconnect_failed", () => {
      console.error("Не удалось переподключиться после максимального количества попыток")
      connectionStatus = "disconnected"
      handleConnectionError("Не удалось восстановить соединение. Пожалуйста, обновите страницу.")
    })

    // Добавляем обработчик для пользовательских ошибок
    socket.on("clientError", (data) => {
      handleConnectionError(data.message || "Произошла ошибка")
    })

    // Добавляем обработчик для пинга, чтобы проверять соединение
    setInterval(() => {
      if (socket && socket.connected) {
        const start = Date.now()
        socket.emit("ping", () => {
          const latency = Date.now() - start
          console.log(`WebSocket latency: ${latency}ms`)
        })
      }
    }, 30000) // Проверяем каждые 30 секунд
  }

  return socket
}

// Общая функция для отправки запросов с обработкой ошибок и тайм-аутами
function sendRequest<T>(
  token: string,
  eventName: string,
  data: any,
  responseEvent: string,
  timeout = 10000,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const socket = getSocket(token)

    if (!socket.connected) {
      reject(new Error("Нет соединения с сервером"))
      return
    }

    // Генерируем уникальный ID для запроса
    const requestId = `${eventName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Настраиваем обработчики событий
    const errorHandler = (error: any) => {
      socket.off(responseEvent, successHandler)
      pendingRequests.delete(requestId)
      reject(error)
    }

    const successHandler = (response: T) => {
      socket.off("error", errorHandler)
      clearTimeout(timeoutId)
      pendingRequests.delete(requestId)
      resolve(response)
    }

    // Устанавливаем тайм-аут
    const timeoutId = setTimeout(() => {
      socket.off(responseEvent, successHandler)
      socket.off("error", errorHandler)
      pendingRequests.delete(requestId)
      reject(new Error(`Истекло время ожидания запроса ${eventName}`))
    }, timeout)

    // Сохраняем информацию о запросе
    pendingRequests.set(requestId, {
      resolve: successHandler,
      reject: errorHandler,
      timeout: timeoutId,
    })

    // Регистрируем обработчики
    socket.once(responseEvent, successHandler)
    socket.once("error", errorHandler)

    // Отправляем запрос
    socket.emit(eventName, data)
  })
}

// Присоединиться к столу с безопасной обработкой ошибок
export function joinTable(token: string, tableId: string, buyIn: number): Promise<void> {
  // Проверяем входные данные
  if (!tableId || typeof tableId !== "string") {
    return Promise.reject(new Error("Недопустимый ID стола"))
  }

  if (!buyIn || typeof buyIn !== "number" || buyIn <= 0) {
    return Promise.reject(new Error("Недопустимая сумма бай-ина"))
  }

  return sendRequest<void>(token, "joinTable", { tableId, buyIn }, "gameState")
}

// Покинуть стол
export function leaveTable(token: string): Promise<void> {
  return sendRequest<void>(token, "leaveTable", {}, "leaveTableSuccess")
}

// Отправить действие игрока с валидацией
export function sendPlayerAction(token: string, action: PlayerAction, amount?: number): Promise<void> {
  // Проверяем действие и сумму перед отправкой
  if (!["fold", "check", "call", "bet", "raise", "all-in"].includes(action)) {
    return Promise.reject(new Error("Недопустимое действие"))
  }

  if ((action === "bet" || action === "raise") && (!amount || amount <= 0)) {
    return Promise.reject(new Error("Для ставки или повышения требуется сумма"))
  }

  // Для действий игрока не ждем конкретного ответа, так как обновление придет через gameState
  const socket = getSocket(token)
  socket.emit("playerAction", { action, amount })

  // Возвращаем resolved Promise после отправки
  return Promise.resolve()
}

// Получить лимиты ставок
export function getBetLimits(token: string): Promise<{ min: number; max: number }> {
  return sendRequest<{ min: number; max: number }>(token, "getBetLimits", {}, "betLimits", 5000)
}

// Создать новый стол
export function createTable(
  token: string,
  name: string,
  maxPlayers: number,
  smallBlind: number,
  bigBlind: number,
  minBuyIn: number,
  maxBuyIn: number,
): Promise<{ tableId: string; tableInfo: any }> {
  // Проверяем входные данные
  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return Promise.reject(new Error("Требуется название стола"))
  }

  if (!maxPlayers || maxPlayers < 2 || maxPlayers > 9) {
    return Promise.reject(new Error("Максимальное количество игроков должно быть от 2 до 9"))
  }

  if (
    !smallBlind ||
    smallBlind <= 0 ||
    !bigBlind ||
    bigBlind <= 0 ||
    !minBuyIn ||
    minBuyIn <= 0 ||
    !maxBuyIn ||
    maxBuyIn <= 0
  ) {
    return Promise.reject(new Error("Все значения должны быть положительными"))
  }

  return sendRequest<{ tableId: string; tableInfo: any }>(
    token,
    "createTable",
    { name, maxPlayers, smallBlind, bigBlind, minBuyIn, maxBuyIn },
    "tableCreated",
  )
}

// Получить доступные столы
export function getTables(token: string): Promise<any[]> {
  return sendRequest<any[]>(token, "getTables", {}, "tableList")
}

// Подписаться на обновления состояния игры
export function subscribeToGameState(token: string, callback: (gameState: any) => void): () => void {
  const socket = getSocket(token)

  socket.on("gameState", callback)

  // Возвращаем функцию для отписки
  return () => {
    socket.off("gameState", callback)
  }
}

// Подписаться на обновления стола
export function subscribeToTableUpdates(token: string, callback: (tableInfo: any) => void): () => void {
  const socket = getSocket(token)

  socket.on("tableUpdate", callback)

  // Возвращаем функцию для отписки
  return () => {
    socket.off("tableUpdate", callback)
  }
}

// Подписаться на обновления транзакций
export function subscribeToTransactionUpdates(token: string, callback: (transaction: any) => void): () => void {
  const socket = getSocket(token)

  socket.on("transactionUpdate", ({ transaction }) => {
    callback(transaction)
  })

  // Возвращаем функцию для отписки
  return () => {
    socket.off("transactionUpdate")
  }
}

// Отключить сокет
export function disconnectSocket(): void {
  if (socket) {
    // Отклоняем все ожидающие запросы перед отключением
    for (const [requestId, { reject, timeout }] of pendingRequests.entries()) {
      clearTimeout(timeout)
      reject(new Error("Соединение закрыто"))
      pendingRequests.delete(requestId)
    }

    socket.disconnect()
    socket = null
    connectionStatus = "disconnected"
  }
}

