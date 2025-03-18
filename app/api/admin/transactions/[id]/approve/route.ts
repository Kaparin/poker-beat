import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Инициализация Supabase клиента
const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    // Получаем информацию о транзакции
    const { data: transaction, error: fetchError } = await supabase
      .from("transactions")
      .select("*")
      .eq("id", id)
      .single()

    if (fetchError) throw fetchError

    // Проверяем, что транзакция в статусе "pending"
    if (transaction.status !== "pending") {
      return NextResponse.json({ message: "Можно подтвердить только ожидающие транзакции" }, { status: 400 })
    }

    // Обновляем статус транзакции на "completed"
    const { error: updateError } = await supabase
      .from("transactions")
      .update({
        status: "completed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)

    if (updateError) throw updateError

    // Если это вывод средств, обновляем баланс пользователя
    if (transaction.type === "withdrawal") {
      // Получаем текущий баланс пользователя
      const { data: wallet, error: walletError } = await supabase
        .from("wallets")
        .select("balance")
        .eq("user_id", transaction.user_id)
        .single()

      if (walletError) throw walletError

      // Обновляем баланс пользователя
      const { error: balanceError } = await supabase
        .from("wallets")
        .update({
          balance: wallet.balance - transaction.amount,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", transaction.user_id)

      if (balanceError) throw balanceError
    }

    return NextResponse.json({ message: "Транзакция подтверждена" })
  } catch (error) {
    console.error("Ошибка подтверждения транзакции:", error)
    return NextResponse.json({ message: "Внутренняя ошибка сервера" }, { status: 500 })
  }
}

