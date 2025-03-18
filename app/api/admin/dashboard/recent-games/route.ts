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

    // Получение последних завершенных игр
    const { data: recentGames, error: recentGamesError } = await supabase
      .from("games")
      .select(`
        id,
        table_id,
        tables:table_id (name),
        game_type,
        blinds,
        player_count,
        pot_size,
        ended_at
      `)
      .not("ended_at", "is", null) // Только завершенные игры
      .order("ended_at", { ascending: false })
      .limit(5)

    if (recentGamesError) {
      console.error("Error fetching recent games:", recentGamesError)
      return NextResponse.json({ error: "Failed to fetch recent games" }, { status: 500 })
    }

    // Преобразование данных в нужный формат
    const formattedGames = recentGames.map((game) => ({
      id: game.id,
      tableId: game.table_id,
      tableName: game.tables?.name || "Неизвестный стол",
      gameType: game.game_type.toLowerCase(),
      blinds: game.blinds,
      players: game.player_count,
      potSize: game.pot_size,
      endedAt: game.ended_at,
    }))

    return NextResponse.json(formattedGames)
  } catch (error) {
    console.error("Recent games API error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

