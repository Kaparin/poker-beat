import { NextResponse } from "next/server"
import { supabase } from "@/lib/api-client"
import { auth } from "@/lib/auth"

export async function GET(request: Request) {
  try {
    // Проверка аутентификации и прав доступа
    const session = await auth()
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Проверка прав администратора
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("role")
      .eq("id", session.user.id)
      .single()

    if (userError || !userData || (userData.role !== "ADMIN" && userData.role !== "MODERATOR")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Получение финансовой статистики
    const { data: transactionsData, error: transactionsError } = await supabase
      .from("transactions")
      .select("id, type, amount, created_at")

    if (transactionsError) {
      console.error("Error fetching transactions data:", transactionsError)
      return NextResponse.json({ error: "Failed to fetch transactions data" }, { status: 500 })
    }

    const deposits = transactionsData.filter((tx) => tx.type === "DEPOSIT")
    const withdrawals = transactionsData.filter((tx) => tx.type === "WITHDRAWAL")
    const rake = transactionsData.filter((tx) => tx.type === "RAKE")

    const totalDeposits = deposits.reduce((sum, tx) => sum + tx.amount, 0)
    const totalWithdrawals = withdrawals.reduce((sum, tx) => sum + tx.amount, 0)
    const totalRake = rake.reduce((sum, tx) => sum + tx.amount, 0)

    // Прибыль сегодня (рейк за сегодня)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const profitToday = rake
      .filter((tx) => {
        const createdAt = new Date(tx.created_at)
        return createdAt >= today
      })
      .reduce((sum, tx) => sum + tx.amount, 0)

    return NextResponse.json({
      totalDeposits,
      totalWithdrawals,
      totalRake,
      profitToday,
    })
  } catch (error) {
    console.error("Financial stats API error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

