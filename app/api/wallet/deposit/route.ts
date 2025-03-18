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
    const { amount, transactionId } = body

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 })
    }

    if (!transactionId) {
      return NextResponse.json({ error: "Transaction ID is required" }, { status: 400 })
    }

    // Проверка, что транзакция с таким ID еще не обработана
    const { data: existingTransaction, error: existingTransactionError } = await supabase
      .from("transactions")
      .select("id")
      .eq("external_id", transactionId)

    if (existingTransactionError) {
      console.error("Error checking transaction existence:", existingTransactionError)
      return NextResponse.json({ error: "Failed to check transaction existence" }, { status: 500 })
    }

    if (existingTransaction.length > 0) {
      return NextResponse.json({ error: "Transaction already processed" }, { status: 400 })
    }

    // Начало транзакции
    const { data, error } = await supabase.rpc("process_deposit", {
      p_user_id: session.user.id,
      p_amount: amount,
      p_external_id: transactionId,
    })

    if (error) {
      console.error("Error processing deposit:", error)
      return NextResponse.json({ error: "Failed to process deposit" }, { status: 500 })
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
    console.error("Deposit API error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

