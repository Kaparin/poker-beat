import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Инициализация Supabase клиента
const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET(request: Request) {
  try {
    // Получаем транзакции с именами пользователей
    const { data, error } = await supabase
      .from("transactions")
      .select(`
        *,
        users:user_id (username)
      `)
      .order("created_at", { ascending: false })

    if (error) throw error

    // Преобразуем данные для удобства использования
    const transactions = data.map((transaction) => ({
      ...transaction,
      username: transaction.users?.username || "Неизвестный пользователь",
    }))

    return NextResponse.json(transactions)
  } catch (error) {
    console.error("Ошибка получения транзакций:", error)
    return NextResponse.json({ message: "Внутренняя ошибка сервера" }, { status: 500 })
  }
}

