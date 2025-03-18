import { NextResponse } from "next/server"
import { supabase } from "@/lib/api-client"
import { auth } from "@/lib/auth"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    // Получение данных стола
    const { data: tableData, error: tableError } = await supabase
      .from("tables")
      .select(`
        id,
        name,
        game_type,
        blinds,
        min_players,
        max_players,
        current_players,
        status,
        created_at,
        updated_at
      `)
      .eq("id", id)
      .single()

    if (tableError) {
      if (tableError.code === "PGRST116") {
        return NextResponse.json({ error: "Table not found" }, { status: 404 })
      }
      console.error("Error fetching table:", tableError)
      return NextResponse.json({ error: "Failed to fetch table" }, { status: 500 })
    }

    // Получение игроков за столом
    const { data: playersData, error: playersError } = await supabase
      .from("table_players")
      .select(`
        id,
        user_id,
        users:user_id (id, username, avatar_url),
        seat_number,
        chips,
        status,
        joined_at
      `)
      .eq("table_id", id)

    if (playersError) {
      console.error("Error fetching table players:", playersError)
      return NextResponse.json({ error: "Failed to fetch table players" }, { status: 500 })
    }

    // Получение текущей игры за столом
    const { data: gameData, error: gameError } = await supabase
      .from("games")
      .select(`
        id,
        status,
        pot_size,
        current_player_id,
        dealer_position,
        small_blind_position,
        big_blind_position,
        community_cards,
        current_bet,
        created_at,
        updated_at
      `)
      .eq("table_id", id)
      .eq("status", "ACTIVE")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (gameError) {
      console.error("Error fetching current game:", gameError)
      return NextResponse.json({ error: "Failed to fetch current game" }, { status: 500 })
    }

    // Преобразование данных игроков
    const players = playersData.map((player) => ({
      id: player.id,
      userId: player.user_id,
      username: player.users?.username || "Unknown",
      avatarUrl: player.users?.avatar_url || null,
      seatNumber: player.seat_number,
      chips: player.chips,
      status: player.status,
      joinedAt: player.joined_at,
    }))

    // Преобразование данных игры
    const game = gameData
      ? {
          id: gameData.id,
          status: gameData.status,
          potSize: gameData.pot_size,
          currentPlayerId: gameData.current_player_id,
          dealerPosition: gameData.dealer_position,
          smallBlindPosition: gameData.small_blind_position,
          bigBlindPosition: gameData.big_blind_position,
          communityCards: gameData.community_cards,
          currentBet: gameData.current_bet,
          createdAt: gameData.created_at,
          updatedAt: gameData.updated_at,
        }
      : null

    // Формирование ответа
    const table = {
      id: tableData.id,
      name: tableData.name,
      gameType: tableData.game_type,
      blinds: tableData.blinds,
      minPlayers: tableData.min_players,
      maxPlayers: tableData.max_players,
      currentPlayers: tableData.current_players,
      status: tableData.status,
      createdAt: tableData.created_at,
      updatedAt: tableData.updated_at,
      players,
      currentGame: game,
    }

    return NextResponse.json(table)
  } catch (error) {
    console.error("Table API error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    // Проверка аутентификации
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

    if (userError || !userData || userData.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const id = params.id

    // Получение данных из запроса
    const body = await request.json()
    const { name, gameType, blinds, minPlayers, maxPlayers, status } = body

    // Проверка существования стола
    const { data: existingTable, error: existingTableError } = await supabase
      .from("tables")
      .select("id")
      .eq("id", id)
      .single()

    if (existingTableError) {
      if (existingTableError.code === "PGRST116") {
        return NextResponse.json({ error: "Table not found" }, { status: 404 })
      }
      console.error("Error checking table existence:", existingTableError)
      return NextResponse.json({ error: "Failed to check table existence" }, { status: 500 })
    }

    // Обновление стола
    const updateData: any = {}

    if (name !== undefined) updateData.name = name
    if (gameType !== undefined) updateData.game_type = gameType
    if (blinds !== undefined) updateData.blinds = blinds
    if (minPlayers !== undefined) updateData.min_players = minPlayers
    if (maxPlayers !== undefined) updateData.max_players = maxPlayers
    if (status !== undefined) updateData.status = status

    const { data, error } = await supabase.from("tables").update(updateData).eq("id", id).select().single()

    if (error) {
      console.error("Error updating table:", error)
      return NextResponse.json({ error: "Failed to update table" }, { status: 500 })
    }

    // Преобразование данных в нужный формат
    const table = {
      id: data.id,
      name: data.name,
      gameType: data.game_type,
      blinds: data.blinds,
      minPlayers: data.min_players,
      maxPlayers: data.max_players,
      currentPlayers: data.current_players,
      status: data.status,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }

    return NextResponse.json(table)
  } catch (error) {
    console.error("Table API error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    // Проверка аутентификации
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

    if (userError || !userData || userData.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const id = params.id

    // Проверка существования стола
    const { data: existingTable, error: existingTableError } = await supabase
      .from("tables")
      .select("id, current_players")
      .eq("id", id)
      .single()

    if (existingTableError) {
      if (existingTableError.code === "PGRST116") {
        return NextResponse.json({ error: "Table not found" }, { status: 404 })
      }
      console.error("Error checking table existence:", existingTableError)
      return NextResponse.json({ error: "Failed to check table existence" }, { status: 500 })
    }

    // Проверка, что за столом нет игроков
    if (existingTable.current_players > 0) {
      return NextResponse.json({ error: "Cannot delete table with active players" }, { status: 400 })
    }

    // Удаление стола
    const { error } = await supabase.from("tables").delete().eq("id", id)

    if (error) {
      console.error("Error deleting table:", error)
      return NextResponse.json({ error: "Failed to delete table" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Table API error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

