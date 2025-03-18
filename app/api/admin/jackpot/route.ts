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

    // Получение данных джекпота
    const { data: jackpotData, error: jackpotError } = await supabase
      .from("jackpot")
      .select("amount, updated_at")
      .order("updated_at", { ascending: false })
      .limit(1)
      .single()

    if (jackpotError && jackpotError.code !== "PGRST116") {
      // PGRST116 - нет данных
      console.error("Error fetching jackpot data:", jackpotError)
      return NextResponse.json({ error: "Failed to fetch jackpot data" }, { status: 500 })
    }

    return NextResponse.json(
      jackpotData || {
        amount: 0,
        lastUpdated: new Date().toISOString(),
      },
    )
  } catch (error) {
    console.error("Jackpot API error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

