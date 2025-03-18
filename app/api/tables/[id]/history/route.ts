import { NextResponse } from "next/server"
import { supabase } from "@/lib/api-client"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const tableId = params.id

    // Получение параметров запроса
    const url = new URL(request.url)
    const limit = Number.parseInt(url.searchParams.get("limit") || "10")
    const page = Number.parseInt(url.searchParams.get("page") || "1")
    const offset = (page - 1) * limit

    // Проверка существования стола
    const { data: tableData, error: tableError } = await supabase.from("tables").select("id").eq("id", tableId).single()

    if (tableError) {
      if (tableError.code === "PGRST116") {
        return NextResponse.json({ error: "Table not found" }, { status: 404 })
      }
      console.error("Error checking table existence:", tableError)
      return NextResponse.json({ error: "Failed to check table existence" }, { status: 500 })
    }

    // Получение истории игр
    const { data: gamesData, error: gamesError } = await supabase
      .from("games")
      .select(`
        id,
        status,
        pot_size,
        winner_id,
        users:winner_id (username),
        winning_hand,
        community_cards,
        created_at,
        ended_at
      `)
      .eq("table_id", tableId)
      .eq("status", "COMPLETED")
      .order("ended_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (gamesError) {
      console.error("Error fetching game history:", gamesError)
      return NextResponse.json({ error: "Failed to fetch game history" }, { status: 500 })
    }

    // Получение общего количества игр
    const { count, error: countError } = await supabase
      .from("games")
      .select("id", { count: "exact", head: true })
      .eq("table_id", tableId)
      .eq("status", "COMPLETED")

    if (countError) {
      console.error("Error counting games:", countError)
      return NextResponse.json({ error: "Failed to count games" }, { status: 500 })
    }

    // Преобразование данных в нужный формат
    const games = gamesData.map((game) => ({
      id: game.id,
      status: game.status,
      potSize: game.pot_size,
      winnerId: game.winner_id,
      winnerName: game.users?.username || "Unknown",
      winningHand: game.winning_hand,
      communityCards: game.community_cards,
      createdAt: game.created_at,
      endedAt: game.ended_at,
    }))

    return NextResponse.json({
      games,
      pagination: {
        total: count,
        page,
        limit,
        pages: Math.ceil(count / limit),
      },
    })
  } catch (error) {
    console.error("Table history API error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

