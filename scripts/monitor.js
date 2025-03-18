// Скрипт для мониторинга приложения
import fetch from "node-fetch"
import nodemailer from "nodemailer"

// Конфигурация
const config = {
  // URL для проверки состояния приложения
  healthCheckUrl: process.env.HEALTH_CHECK_URL || "http://localhost:3000/api/health",

  // Интервал проверки в миллисекундах (по умолчанию 1 минута)
  checkInterval: Number.parseInt(process.env.HEALTH_CHECK_INTERVAL || "60000"),

  // Количество попыток перед отправкой уведомления
  maxRetries: Number.parseInt(process.env.HEALTH_CHECK_MAX_RETRIES || "3"),

  // Настройки уведомлений по электронной почте
  email: {
    enabled: process.env.EMAIL_NOTIFICATIONS_ENABLED === "true",
    host: process.env.EMAIL_HOST,
    port: Number.parseInt(process.env.EMAIL_PORT || "587"),
    secure: process.env.EMAIL_SECURE === "true",
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
    from: process.env.EMAIL_FROM,
    to: process.env.EMAIL_TO,
  },
}

// Создаем транспорт для отправки электронной почты
let transporter = null

if (config.email.enabled) {
  if (!config.email.host || !config.email.user || !config.email.pass || !config.email.from || !config.email.to) {
    console.error(
      "Ошибка: Для отправки уведомлений по электронной почте необходимо установить все переменные окружения EMAIL_*",
    )
    process.exit(1)
  }

  transporter = nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    secure: config.email.secure,
    auth: {
      user: config.email.user,
      pass: config.email.pass,
    },
  })
}

// Функция для отправки уведомления
async function sendNotification(subject, message) {
  console.error(`[${new Date().toISOString()}] ${subject}: ${message}`)

  if (config.email.enabled && transporter) {
    try {
      await transporter.sendMail({
        from: config.email.from,
        to: config.email.to,
        subject,
        text: message,
        html: `<p>${message}</p>`,
      })

      console.log(`[${new Date().toISOString()}] Уведомление отправлено на ${config.email.to}`)
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Ошибка отправки уведомления:`, error)
    }
  }
}

// Функция для проверки состояния приложения
async function checkHealth() {
  try {
    const response = await fetch(config.healthCheckUrl)
    const data = await response.json()

    if (response.ok && data.status !== "unhealthy") {
      console.log(`[${new Date().toISOString()}] Приложение работает нормально. Статус: ${data.status}`)
      return true
    } else {
      console.error(`[${new Date().toISOString()}] Приложение в нерабочем состоянии. Статус: ${data.status}`)
      return false
    }
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Ошибка проверки состояния приложения:`, error)
    return false
  }
}

// Основная функция мониторинга
async function monitor() {
  let consecutiveFailures = 0
  let notificationSent = false

  console.log(`[${new Date().toISOString()}] Запуск мониторинга приложения...`)
  console.log(`[${new Date().toISOString()}] URL для проверки: ${config.healthCheckUrl}`)
  console.log(`[${new Date().toISOString()}] Интервал проверки: ${config.checkInterval}ms`)

  // Запускаем периодическую проверку
  setInterval(async () => {
    const isHealthy = await checkHealth()

    if (isHealthy) {
      consecutiveFailures = 0

      // Если приложение восстановилось после сбоя, отправляем уведомление
      if (notificationSent) {
        await sendNotification(
          "Приложение восстановлено",
          `Приложение снова работает нормально. Время восстановления: ${new Date().toISOString()}`,
        )
        notificationSent = false
      }
    } else {
      consecutiveFailures++

      // Если превышено максимальное количество попыток, отправляем уведомление
      if (consecutiveFailures >= config.maxRetries && !notificationSent) {
        await sendNotification(
          "Приложение не работает",
          `Приложение не отвечает или находится в нерабочем состоянии. Количество последовательных сбоев: ${consecutiveFailures}. Время обнаружения: ${new Date().toISOString()}`,
        )
        notificationSent = true
      }
    }
  }, config.checkInterval)
}

// Запускаем мониторинг
monitor().catch((error) => {
  console.error("Ошибка запуска мониторинга:", error)
  process.exit(1)
})

