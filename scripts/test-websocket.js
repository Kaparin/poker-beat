// Скрипт для тестирования WebSocket-соединения
const { io } = require("socket.io-client")

// URL WebSocket-сервера
const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000"

// Тестовый токен (замените на действительный токен)
const token = "ваш-тестовый-токен"

console.log(`Подключение к ${socketUrl}...`)

// Создаем соединение
const socket = io(socketUrl, {
  path: "/api/socket",
  auth: {
    token,
  },
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  timeout: 20000,
})

// Обработчики событий
socket.on("connect", () => {
  console.log("Подключено к серверу!")

  // Запрашиваем список столов
  socket.emit("getTables")
})

socket.on("connect_error", (error) => {
  console.error("Ошибка подключения:", error.message)
})

socket.on("error", (error) => {
  console.error("Ошибка сокета:", error)
})

socket.on("disconnect", (reason) => {
  console.log("Отключено от сервера:", reason)
})

socket.on("tableList", (tables) => {
  console.log("Получен список столов:", tables)

  // Отключаемся после получения списка столов
  socket.disconnect()
})

// Устанавливаем тайм-аут для отключения, если ничего не происходит
setTimeout(() => {
  if (socket.connected) {
    console.log("Тайм-аут, отключение...")
    socket.disconnect()
  }
}, 10000)

