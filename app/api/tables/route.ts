import { NextResponse } from "next/server"
import { supabase } from "@/lib/api-client"
import { auth } from "@/lib/auth"

export async function GET(request: Request) {
  try {
    // Получение параметров запроса
    const url = new URL(request.url)
    const gameType = url.searchParams.get("gameType")
    const blinds = url.searchParams.get("blinds")
    const minPlayers = url.searchParams.get("minPlayers")
    const maxPlayers = url.searchParams.get("maxPlayers")
    const status = url.searchParams.get("status") || "ACTIVE"

    // Базовый запрос
    let query = supabase
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
      .eq("status", status)

    // Добавление фильтров, если они указаны
    if (gameType) {
      query = query.eq("game_type", gameType)
    }

    if (blinds) {
      query = query.eq("blinds", blinds)
    }

    if (minPlayers) {
      query = query.gte("min_players", Number.parseInt(minPlayers))
    }

    if (maxPlayers) {
      query = query.lte("max_players", Number.parseInt(maxPlayers))
    }

    // Выполнение запроса
    const { data, error } = await query.order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching tables:", error)
      return NextResponse.json({ error: "Failed to fetch tables" }, { status: 500 })
    }

    // Преобразование данных в нужный формат
    const tables = data.map((table) => ({
      id: table.id,
      name: table.name,
      gameType: table.game_type,
      blinds: table.blinds,
      minPlayers: table.min_players,
      maxPlayers: table.max_players,
      currentPlayers: table.current_players,
      status: table.status,
      createdAt: table.created_at,
      updatedAt: table.updated_at,
    }))

    return NextResponse.json(tables)
  } catch (error) {
    console.error("Tables API error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
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

    // Получение данных из запроса
    const body = await request.json()
    const { name, gameType, blinds, minPlayers, maxPlayers } = body

    // Валидация данных
    if (!name || !gameType || !blinds || !minPlayers || !maxPlayers) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Создание нового стола
    const { data, error } = await supabase
      .from("tables")
      .insert({
        name,
        game_type: gameType,
        blinds,
        min_players: minPlayers,
        max_players: maxPlayers,
        current_players: 0,
        status: "ACTIVE",
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating table:", error)
      return NextResponse.json({ error: "Failed to create table" }, { status: 500 })
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

    return NextResponse.json(table, { status: 201 })
  } catch (error) {
    console.error("Tables API error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

