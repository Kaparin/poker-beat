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
    const { withdrawalId, verificationCode } = body

    if (!withdrawalId) {
      return NextResponse.json({ error: "Withdrawal ID is required" }, { status: 400 })
    }

    if (!verificationCode) {
      return NextResponse.json({ error: "Verification code is required" }, { status: 400 })
    }

    // Проверка существования запроса на вывод
    const { data: withdrawalData, error: withdrawalError } = await supabase
      .from("withdrawals")
      .select("id, user_id, amount, status, verification_code")
      .eq("id", withdrawalId)
      .single()

    if (withdrawalError) {
      if (withdrawalError.code === "PGRST116") {
        return NextResponse.json({ error: "Withdrawal request not found" }, { status: 404 })
      }
      console.error("Error checking withdrawal existence:", withdrawalError)
      return NextResponse.json({ error: "Failed to check withdrawal existence" }, { status: 500 })
    }

    // Проверка, что запрос принадлежит пользователю
    if (withdrawalData.user_id !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Проверка статуса запроса
    if (withdrawalData.status !== "PENDING") {
      return NextResponse.json({ error: "Withdrawal request is not pending" }, { status: 400 })
    }

    // Проверка кода верификации
    if (withdrawalData.verification_code !== verificationCode) {
      return NextResponse.json({ error: "Invalid verification code" }, { status: 400 })
    }

    // Обработка запроса на вывод
    const { data, error } = await supabase.rpc("process_withdrawal", {
      p_withdrawal_id: withdrawalId,
    })

    if (error) {
      console.error("Error processing withdrawal:", error)
      return NextResponse.json({ error: "Failed to process withdrawal" }, { status: 500 })
    }

    // Получение обновленного баланса
    const { data: walletData, error: walletError } = await supabase
      .from("wallets")
      .select("balance")
      .eq("user_id", session.user.id)
      .single()

    if (walletError) {
      console.error("Error fetching updated balance:", walletError)
      return NextResponse.json({ error: "Failed to fetch updated balance" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      transactionId: data.transaction_id,
      newBalance: walletData.balance,
    })
  } catch (error) {
    console.error("Verify withdrawal API error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

