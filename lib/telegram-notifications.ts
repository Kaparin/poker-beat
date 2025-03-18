import axios from "axios"

/**
 * Sends a notification to a user via Telegram bot
 */
export async function sendTelegramNotification(telegramId: number, message: string, silent = false): Promise<boolean> {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN

    if (!botToken) {
      console.error("TELEGRAM_BOT_TOKEN is not set")
      return false
    }

    // Send message via Telegram Bot API
    const response = await axios.post(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        chat_id: telegramId,
        text: message,
        parse_mode: "HTML",
        disable_notification: silent,
      },
      {
        timeout: 10000, // 10 second timeout
        headers: {
          "Content-Type": "application/json",
        },
      },
    )

    return response.data.ok === true
  } catch (error) {
    console.error("Error sending Telegram notification:", error)
    return false
  }
}

/**
 * Sends a notification to multiple users via Telegram bot
 */
export async function sendBulkTelegramNotifications(
  telegramIds: number[],
  message: string,
  silent = false,
): Promise<{ success: number; failed: number }> {
  let success = 0
  let failed = 0

  // Send notifications in batches to avoid rate limiting
  const batchSize = 20
  for (let i = 0; i < telegramIds.length; i += batchSize) {
    const batch = telegramIds.slice(i, i + batchSize)

    // Send notifications in parallel
    const results = await Promise.all(batch.map((id) => sendTelegramNotification(id, message, silent)))

    // Count successes and failures
    results.forEach((result) => {
      if (result) {
        success++
      } else {
        failed++
      }
    })

    // Wait a bit between batches to avoid rate limiting
    if (i + batchSize < telegramIds.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  }

  return { success, failed }
}

