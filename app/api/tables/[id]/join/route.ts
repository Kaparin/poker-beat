import { NextResponse } from "next/server"
import { supabase } from "@/lib/api-client"
import { auth } from "@/lib/auth"

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    // Проверка аутентификации
    const session = await auth()
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const tableId = params.id

    // Получение данных из запроса
    const body = await request.json()
    const { seatNumber, buyIn } = body

    if (seatNumber === undefined || !buyIn) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Проверка существования стола
    const { data: tableData, error: tableError } = await supabase
      .from("tables")
      .select("id, max_players, current_players, status, blinds")
      .eq("id", tableId)
      .single()

    if (tableError) {
      if (tableError.code === "PGRST116") {
        return NextResponse.json({ error: "Table not found" }, { status: 404 })
      }
      console.error("Error checking table existence:", tableError)
      return NextResponse.json({ error: "Failed to check table existence" }, { status: 500 })
    }

    // Проверка статуса стола
    if (tableData.status !== "ACTIVE") {
      return NextResponse.json({ error: "Table is not active" }, { status: 400 })
    }

    // Проверка количества игроков
    if (tableData.current_players >= tableData.max_players) {
      return NextResponse.json({ error: "Table is full" }, { status: 400 })
    }

    // Проверка, что место не занято
    const { data: seatData, error: seatError } = await supabase
      .from("table_players")
      .select("id")
      .eq("table_id", tableId)
      .eq("seat_number", seatNumber)

    if (seatError) {
      console.error("Error checking seat availability:", seatError)
      return NextResponse.json({ error: "Failed to check seat availability" }, { status: 500 })
    }

    if (seatData.length > 0) {
      return NextResponse.json({ error: "Seat is already taken" }, { status: 400 })
    }

    // Проверка, что пользователь уже не сидит за этим столом
    const { data: playerData, error: playerError } = await supabase
      .from("table_players")
      .select("id")
      .eq("table_id", tableId)
      .eq("user_id", session.user.id)

    if (playerError) {
      console.error("Error checking player existence:", playerError)
      return NextResponse.json({ error: "Failed to check player existence" }, { status: 500 })
    }

    if (playerData.length > 0) {
      return NextResponse.json({ error: "You are already at this table" }, { status: 400 })
    }

    // Проверка баланса пользователя
    const { data: walletData, error: walletError } = await supabase
      .from("wallets")
      .select("balance")
      .eq("user_id", session.user.id)
      .single()

    if (walletError) {
      console.error("Error checking wallet balance:", walletError)
      return NextResponse.json({ error: "Failed to check wallet balance" }, { status: 500 })
    }

    if (walletData.balance < buyIn) {
      return NextResponse.json({ error: "Insufficient balance" }, { status: 400 })
    }

    // Начало транзакции
    const { error: transactionError } = await supabase.rpc("join_table", {
      p_user_id: session.user.id,
      p_table_id: tableId,
      p_seat_number: seatNumber,
      p_buy_in: buyIn,
    })

    if (transactionError) {
      console.error("Error joining table:", transactionError)
      return NextResponse.json({ error: "Failed to join table" }, { status: 500 })
    }

    // Получение данных игрока за столом
    const { data: newPlayerData, error: newPlayerError } = await supabase
      .from("table_players")
      .select(`
        id,
        user_id,
        table_id,
        seat_number,
        chips,
        status,
        joined_at
      `)
      .eq("table_id", tableId)
      .eq("user_id", session.user.id)
      .single()

    if (newPlayerError) {
      console.error("Error fetching new player data:", newPlayerError)
      return NextResponse.json({ error: "Failed to fetch new player data" }, { status: 500 })
    }

    // Преобразование данных в нужный формат
    const player = {
      id: newPlayerData.id,
      userId: newPlayerData.user_id,
      tableId: newPlayerData.table_id,
      seatNumber: newPlayerData.seat_number,
      chips: newPlayerData.chips,
      status: newPlayerData.status,
      joinedAt: newPlayerData.joined_at,
    }

    return NextResponse.json(player, { status: 201 })
  } catch (error) {
    console.error("Join table API error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

