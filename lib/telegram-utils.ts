import crypto from "crypto"

export function isTelegramWebApp(): boolean {
  return typeof window !== "undefined" && !!window.Telegram?.WebApp
}

export function getTelegramUser() {
  if (isTelegramWebApp()) {
    return window.Telegram.WebApp.initDataUnsafe.user
  }
  return null
}

export function getInitData() {
  if (isTelegramWebApp()) {
    return window.Telegram.WebApp.initData
  }
  return ""
}

// Улучшаем функцию валидации Telegram данных
export function validateTelegramWebAppData(initData: string, botToken: string): boolean {
  try {
    const urlParams = new URLSearchParams(initData)
    const hash = urlParams.get("hash")
    if (!hash) return false

    // Проверяем auth_date для предотвращения атак повторного воспроизведения
    const authDate = urlParams.get("auth_date")
    if (!authDate) return false

    // Конвертируем auth_date в число
    const authDateNum = Number.parseInt(authDate, 10)
    if (isNaN(authDateNum)) return false

    // Проверяем, не слишком ли старый auth_date (24 часа)
    const maxAge = 24 * 60 * 60 // 24 часа в секундах
    const currentTime = Math.floor(Date.now() / 1000)
    if (currentTime - authDateNum > maxAge) return false

    // Удаляем hash из данных перед проверкой подписи
    urlParams.delete("hash")

    // Сортируем в алфавитном порядке
    const dataCheckString = Array.from(urlParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join("\n")

    // Создаем секретный ключ из токена бота
    const secretKey = crypto.createHmac("sha256", "WebAppData").update(botToken).digest()

    // Вычисляем хеш
    const calculatedHash = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex")

    return calculatedHash === hash
  } catch (error) {
    console.error("Error validating Telegram data:", error)
    return false
  }
}

// Добавляем функцию для безопасного получения данных пользователя
export function getTelegramUserSafely(): { user: any; isValid: boolean } {
  if (isTelegramWebApp()) {
    try {
      const user = window.Telegram.WebApp.initDataUnsafe.user
      const initData = window.Telegram.WebApp.initData

      // Базовая проверка данных (полная проверка будет на сервере)
      const hasRequiredFields = user && user.id && user.first_name
      const hasInitData = initData && initData.length > 0

      return {
        user,
        isValid: hasRequiredFields && hasInitData,
      }
    } catch (error) {
      console.error("Error getting Telegram user data:", error)
      return { user: null, isValid: false }
    }
  }
  return { user: null, isValid: false }
}

