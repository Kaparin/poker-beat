import { NextResponse } from "next/server"
import { supabase } from "@/lib/api-client"
import { auth } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    // Проверка аутентификации
    const session = await auth()
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Получение данных из запроса
    const body = await request.json()
    const { amount, walletAddress } = body

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 })
    }

    if (!walletAddress) {
      return NextResponse.json({ error: "Wallet address is required" }, { status: 400 })
    }

    // Получение лимитов вывода из переменных окружения
    const maxDailyWithdrawal = Number.parseInt(process.env.MAX_DAILY_WITHDRAWAL || "10000")
    const maxMonthlyWithdrawal = Number.parseInt(process.env.MAX_MONTHLY_WITHDRAWAL || "100000")

    // Проверка дневного лимита вывода
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const { data: dailyWithdrawals, error: dailyWithdrawalsError } = await supabase
      .from("transactions")
      .select("amount")
      .eq("user_id", session.user.id)
      .eq("type", "WITHDRAWAL")
      .gte("created_at", today.toISOString())

    if (dailyWithdrawalsError) {
      console.error("Error checking daily withdrawals:", dailyWithdrawalsError)
      return NextResponse.json({ error: "Failed to check daily withdrawals" }, { status: 500 })
    }

    const dailyTotal = dailyWithdrawals.reduce((sum, tx) => sum + tx.amount, 0)

    if (dailyTotal + amount > maxDailyWithdrawal) {
      return NextResponse.json(
        {
          error: `Daily withdrawal limit exceeded. Remaining: ${maxDailyWithdrawal - dailyTotal} chips`,
        },
        { status: 400 },
      )
    }

    // Проверка месячного лимита вывода
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

    const { data: monthlyWithdrawals, error: monthlyWithdrawalsError } = await supabase
      .from("transactions")
      .select("amount")
      .eq("user_id", session.user.id)
      .eq("type", "WITHDRAWAL")
      .gte("created_at", firstDayOfMonth.toISOString())

    if (monthlyWithdrawalsError) {
      console.error("Error checking monthly withdrawals:", monthlyWithdrawalsError)
      return NextResponse.json({ error: "Failed to check monthly withdrawals" }, { status: 500 })
    }

    const monthlyTotal = monthlyWithdrawals.reduce((sum, tx) => sum + tx.amount, 0)

    if (monthlyTotal + amount > maxMonthlyWithdrawal) {
      return NextResponse.json(
        {
          error: `Monthly withdrawal limit exceeded. Remaining: ${maxMonthlyWithdrawal - monthlyTotal} chips`,
        },
        { status: 400 },
      )
    }

    // Проверка баланса пользователя
    const { data: walletData, error: walletError } = await supabase
      .from("wallets")
      .select("balance")
      .eq("user_id", session.user.id)
      .single()

    if (walletError) {
      console.error("Error checking wallet balance:", walletError)
      return NextResponse.json({ error: "Failed to check wallet balance" }, { status: 500 })
    }

    if (walletData.balance < amount) {
      return NextResponse.json({ error: "Insufficient balance" }, { status: 400 })
    }

    // Создание запроса на вывод
    const { data, error } = await supabase.rpc("create_withdrawal_request", {
      p_user_id: session.user.id,
      p_amount: amount,
      p_wallet_address: walletAddress,
    })

    if (error) {
      console.error("Error creating withdrawal request:", error)
      return NextResponse.json({ error: "Failed to create withdrawal request" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      withdrawalId: data.withdrawal_id,
      status: "PENDING",
    })
  } catch (error) {
    console.error("Withdrawal API error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

