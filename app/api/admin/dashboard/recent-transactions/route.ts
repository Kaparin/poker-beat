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

    // Получение последних транзакций
    const { data: recentTransactions, error: recentTransactionsError } = await supabase
      .from("transactions")
      .select(`
        id,
        user_id,
        users:user_id (username),
        type,
        amount,
        status,
        created_at
      `)
      .order("created_at", { ascending: false })
      .limit(5)

    if (recentTransactionsError) {
      console.error("Error fetching recent transactions:", recentTransactionsError)
      return NextResponse.json({ error: "Failed to fetch recent transactions" }, { status: 500 })
    }

    // Преобразование данных в нужный формат
    const formattedTransactions = recentTransactions.map((transaction) => ({
      id: transaction.id,
      userId: transaction.user_id,
      username: transaction.users?.username || "Неизвестный пользователь",
      type: transaction.type.toLowerCase(),
      amount: transaction.amount,
      status: transaction.status.toLowerCase(),
      createdAt: transaction.created_at,
    }))

    return NextResponse.json(formattedTransactions)
  } catch (error) {
    console.error("Recent transactions API error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

