import { validateTelegramWebAppData } from "./telegram-utils"

export async function createOrUpdateUser(userData: any) {
  // In a real application, you would:
  // 1. Connect to your database
  // 2. Check if the user exists (by Telegram ID)
  // 3. Create or update the user record
  // 4. Return the user data

  // For now, we'll just simulate this process
  console.log("Creating or updating user:", userData)

  // Simulate a database operation
  return {
    id: userData.id,
    name: userData.first_name + (userData.last_name ? ` ${userData.last_name}` : ""),
    username: userData.username || "",
    photoUrl: userData.photo_url || "",
    balance: 1000, // Default starting balance
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

export async function validateAndProcessUser(initData: string) {
  // In a real application, you would get this from environment variables
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || ""

  // Parse the initData
  const urlParams = new URLSearchParams(initData)
  const userDataStr = urlParams.get("user")

  if (!userDataStr) {
    throw new Error("No user data provided")
  }

  // Validate the data
  const isValid = validateTelegramWebAppData(initData, BOT_TOKEN)

  if (!isValid) {
    throw new Error("Invalid Telegram data")
  }

  // Parse the user data
  const userData = JSON.parse(userDataStr)

  // Create or update the user in the database
  return await createOrUpdateUser(userData)
}

