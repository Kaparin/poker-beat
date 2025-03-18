import { NextResponse } from "next/server"
import { supabase } from "@/lib/api-client"
import { auth } from "@/lib/auth"

export async function GET(request: Request) {
  try {
    // Проверка аутентификации
    const session = await auth()
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Получение баланса кошелька
    const { data, error } = await supabase.from("wallets").select("balance").eq("user_id", session.user.id).single()

    if (error) {
      console.error("Error fetching wallet balance:", error)
      return NextResponse.json({ error: "Failed to fetch wallet balance" }, { status: 500 })
    }

    return NextResponse.json({ balance: data.balance })
  } catch (error) {
    console.error("Wallet balance API error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

