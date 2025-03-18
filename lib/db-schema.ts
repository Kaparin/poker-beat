// Файл для определения схемы базы данных и типов
import { createClient } from "@supabase/supabase-js"

// Типы для базы данных
export type User = {
  id: string
  username: string
  telegram_id?: string
  avatar_url?: string
  balance: number
  created_at: string
  last_login?: string
  password_hash?: string
  is_admin?: boolean
  status: "active" | "banned" | "suspended"
}

export type Table = {
  id: string
  name: string
  game_type: "texas_holdem" | "omaha" | "five_card_draw"
  stakes: string
  min_buy_in: number
  max_buy_in: number
  max_players: number
  status: "active" | "inactive" | "full"
  created_at: string
  updated_at: string
}

export type Transaction = {
  id: string
  user_id: string
  amount: number
  type: "deposit" | "withdrawal" | "game_win" | "game_loss" | "bonus"
  status: "pending" | "completed" | "rejected"
  details?: any
  created_at: string
  updated_at: string
}

export type SecurityLog = {
  id: string
  user_id?: string
  action: string
  ip_address?: string
  user_agent?: string
  details?: any
  created_at: string
}

export type PromoCode = {
  id: string
  code: string
  type: "percentage" | "fixed"
  value: number
  max_uses: number
  current_uses: number
  expires_at: string
  created_at: string
  status: "active" | "inactive" | "expired"
}

export type Referral = {
  id: string
  referrer_id: string
  referred_id: string
  status: "pending" | "completed"
  reward: number
  created_at: string
  completed_at?: string
}

// Инициализация Supabase клиента
export const supabaseUrl = process.env.SUPABASE_URL!
export const supabaseKey = process.env.SUPABASE_SERVICE_KEY!
export const supabase = createClient(supabaseUrl, supabaseKey)

// Функции для работы с базой данных
export async function getUserByTelegramId(telegramId: string): Promise<User | null> {
  const { data, error } = await supabase.from("users").select("*").eq("telegram_id", telegramId).single()

  if (error) {
    console.error("Error fetching user by Telegram ID:", error)
    return null
  }

  return data
}

export async function getUserById(userId: string): Promise<User | null> {
  const { data, error } = await supabase.from("users").select("*").eq("id", userId).single()

  if (error) {
    console.error("Error fetching user by ID:", error)
    return null
  }

  return data
}

export async function createUser(userData: Partial<User>): Promise<User | null> {
  const { data, error } = await supabase.from("users").insert([userData]).select().single()

  if (error) {
    console.error("Error creating user:", error)
    return null
  }

  return data
}

export async function updateUser(userId: string, userData: Partial<User>): Promise<User | null> {
  const { data, error } = await supabase.from("users").update(userData).eq("id", userId).select().single()

  if (error) {
    console.error("Error updating user:", error)
    return null
  }

  return data
}

// Функции для работы с транзакциями
export async function createTransaction(transactionData: Partial<Transaction>): Promise<Transaction | null> {
  const { data, error } = await supabase.from("transactions").insert([transactionData]).select().single()

  if (error) {
    console.error("Error creating transaction:", error)
    return null
  }

  return data
}

export async function getUserTransactions(userId: string): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching user transactions:", error)
    return []
  }

  return data || []
}

// Функции для работы с безопасностью
export async function logSecurityEvent(logData: Partial<SecurityLog>): Promise<void> {
  const { error } = await supabase.from("security_logs").insert([
    {
      ...logData,
      created_at: new Date().toISOString(),
    },
  ])

  if (error) {
    console.error("Error logging security event:", error)
  }
}

// Функции для работы с промо-кодами
export async function getPromoCode(code: string): Promise<PromoCode | null> {
  const { data, error } = await supabase
    .from("promo_codes")
    .select("*")
    .eq("code", code)
    .eq("status", "active")
    .single()

  if (error) {
    console.error("Error fetching promo code:", error)
    return null
  }

  return data
}

export async function usePromoCode(codeId: string): Promise<boolean> {
  const { data, error } = await supabase.from("promo_codes").select("current_uses, max_uses").eq("id", codeId).single()

  if (error || !data) {
    console.error("Error fetching promo code for use:", error)
    return false
  }

  if (data.current_uses >= data.max_uses) {
    return false
  }

  const { error: updateError } = await supabase
    .from("promo_codes")
    .update({ current_uses: data.current_uses + 1 })
    .eq("id", codeId)

  if (updateError) {
    console.error("Error updating promo code usage:", updateError)
    return false
  }

  return true
}

