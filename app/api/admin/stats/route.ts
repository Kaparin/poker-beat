import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { auth } from "@/lib/auth"

// Инициализация Supabase клиента
const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET(request: Request) {
  try {
    // Проверка аутентификации и прав доступа
    const session = await auth()
    if (!session || !session.user.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Получение общего количества пользователей
    const { count: totalUsers, error: usersError } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })

    if (usersError) {
      console.error("Error fetching users count:", usersError)
      throw usersError
    }

    // Получение количества активных столов
    const { count: activeTables, error: tablesError } = await supabase
      .from("tables")
      .select("*", { count: "exact", head: true })
      .eq("status", "active")

    if (tablesError) {
      console.error("Error fetching active tables count:", tablesError)
      throw tablesError
    }

    // Получение количества ожидающих транзакций
    const { count: pendingTransactions, error: transactionsError } = await supabase
      .from("transactions")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending")

    if (transactionsError) {
      console.error("Error fetching pending transactions count:", transactionsError)
      throw transactionsError
    }

    // Получение общего дохода (сумма всех депозитов минус сумма всех выводов)
    const { data: deposits, error: depositsError } = await supabase
      .from("transactions")
      .select("amount")
      .eq("type", "deposit")
      .eq("status", "completed")

    if (depositsError) {
      console.error("Error fetching deposits:", depositsError)
      throw depositsError
    }

    const { data: withdrawals, error: withdrawalsError } = await supabase
      .from("transactions")
      .select("amount")
      .eq("type", "withdrawal")
      .eq("status", "completed")

    if (withdrawalsError) {
      console.error("Error fetching withdrawals:", withdrawalsError)
      throw withdrawalsError
    }

    const totalDeposits = deposits.reduce((sum, item) => sum + item.amount, 0)
    const totalWithdrawals = withdrawals.reduce((sum, item) => sum + item.amount, 0)
    const totalRevenue = totalDeposits - totalWithdrawals

    return NextResponse.json({
      totalUsers: totalUsers || 0,
      activeTables: activeTables || 0,
      pendingTransactions: pendingTransactions || 0,
      totalRevenue: totalRevenue || 0,
    })
  } catch (error) {
    console.error("Stats API error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

