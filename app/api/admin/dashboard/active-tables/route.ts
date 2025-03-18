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

    // Получение активных столов
    const { data: activeTables, error: activeTablesError } = await supabase
      .from("tables")
      .select("id")
      .eq("status", "ACTIVE")

    if (activeTablesError) {
      console.error("Error fetching active tables:", activeTablesError)
      return NextResponse.json({ error: "Failed to fetch active tables" }, { status: 500 })
    }

    // Получение активных игроков за столами
    const { data: activePlayers, error: activePlayersError } = await supabase
      .from("table_players")
      .select("id")
      .in(
        "table_id",
        activeTables.map((table) => table.id),
      )

    if (activePlayersError) {
      console.error("Error fetching active players:", activePlayersError)
      return NextResponse.json({ error: "Failed to fetch active players" }, { status: 500 })
    }

    return NextResponse.json({
      activeTables: activeTables.length,
      activePlayers: activePlayers.length,
    })
  } catch (error) {
    console.error("Active tables API error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

