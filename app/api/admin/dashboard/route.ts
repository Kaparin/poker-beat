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

    // Получение данных для дашборда

    // 1. Статистика пользователей
    const { data: usersData, error: usersError } = await supabase
      .from("users")
      .select("id, created_at, last_login, status")
      .order("created_at", { ascending: false })

    if (usersError) {
      console.error("Error fetching users data:", usersError)
      return NextResponse.json({ error: "Failed to fetch users data" }, { status: 500 })
    }

    const totalUsers = usersData.length
    const activeUsers = usersData.filter((user) => user.status === "ACTIVE").length

    // Пользователи, зарегистрированные сегодня
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const newUsersToday = usersData.filter((user) => {
      const createdAt = new Date(user.created_at)
      return createdAt >= today
    }).length

    // Пользователи онлайн (последний вход в течение последних 15 минут)
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000)
    const onlineUsers = usersData.filter((user) => {
      if (!user.last_login) return false
      const lastLogin = new Date(user.last_login)
      return lastLogin >= fifteenMinutesAgo
    }).length

    // 2. Статистика игр
    const { data: gamesData, error: gamesError } = await supabase
      .from("games")
      .select("id, created_at, ended_at, game_type, pot_size")
      .order("created_at", { ascending: false })

    if (gamesError) {
      console.error("Error fetching games data:", gamesError)
      return NextResponse.json({ error: "Failed to fetch games data" }, { status: 500 })
    }

    const totalGames = gamesData.length

    // Активные игры (без даты окончания)
    const activeGames = gamesData.filter((game) => !game.ended_at).length

    // 3. Финансовая статистика
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
    const rakeToday = rake
      .filter((tx) => {
        const createdAt = new Date(tx.created_at)
        return createdAt >= today
      })
      .reduce((sum, tx) => sum + tx.amount, 0)

    // 4. Данные для графика
    // Получаем данные за последние 7 месяцев
    const months = []
    const currentDate = new Date()

    for (let i = 6; i >= 0; i--) {
      const date = new Date(currentDate)
      date.setMonth(date.getMonth() - i)

      const monthName = date.toLocaleString("ru", { month: "short" })
      const year = date.getFullYear()
      const month = date.getMonth()

      // Начало и конец месяца
      const startOfMonth = new Date(year, month, 1)
      const endOfMonth = new Date(year, month + 1, 0)

      // Пользователи за месяц
      const usersInMonth = usersData.filter((user) => {
        const createdAt = new Date(user.created_at)
        return createdAt >= startOfMonth && createdAt <= endOfMonth
      }).length

      // Игры за месяц
      const gamesInMonth = gamesData.filter((game) => {
        const createdAt = new Date(game.created_at)
        return createdAt >= startOfMonth && createdAt <= endOfMonth
      }).length

      // Доход за месяц (рейк)
      const revenueInMonth = rake
        .filter((tx) => {
          const createdAt = new Date(tx.created_at)
          return createdAt >= startOfMonth && createdAt <= endOfMonth
        })
        .reduce((sum, tx) => sum + tx.amount, 0)

      months.push({
        name: monthName,
        users: usersInMonth,
        games: gamesInMonth,
        revenue: revenueInMonth,
      })
    }

    // 5. Данные Treasury Pool
    const { data: treasuryData, error: treasuryError } = await supabase
      .from("treasury_pool")
      .select("amount, updated_at")
      .order("updated_at", { ascending: false })
      .limit(1)
      .single()

    if (treasuryError && treasuryError.code !== "PGRST116") {
      // PGRST116 - нет данных
      console.error("Error fetching treasury data:", treasuryError)
      return NextResponse.json({ error: "Failed to fetch treasury data" }, { status: 500 })
    }

    // 6. Данные джекпота
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

    // Формирование ответа
    return NextResponse.json({
      users: {
        totalUsers,
        activeUsers,
        newUsersToday,
        onlineUsers,
      },
      games: {
        totalGames,
        activeGames,
      },
      financial: {
        totalDeposits,
        totalWithdrawals,
        totalRake,
        profitToday: rakeToday,
      },
      chart: months,
      treasury: treasuryData || { amount: 0, updated_at: new Date().toISOString() },
      jackpot: jackpotData || { amount: 0, updated_at: new Date().toISOString() },
    })
  } catch (error) {
    console.error("Dashboard API error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

