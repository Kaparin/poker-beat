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

    // Получение активных турниров
    const { data: activeTournaments, error: activeTournamentsError } = await supabase
      .from("tournaments")
      .select("id")
      .in("status", ["REGISTRATION", "RUNNING"])

    if (activeTournamentsError) {
      console.error("Error fetching active tournaments:", activeTournamentsError)
      return NextResponse.json({ error: "Failed to fetch active tournaments" }, { status: 500 })
    }

    // Получение зарегистрированных игроков в турнирах
    const { data: registeredPlayers, error: registeredPlayersError } = await supabase
      .from("tournament_players")
      .select("id")
      .in(
        "tournament_id",
        activeTournaments.map((tournament) => tournament.id),
      )

    if (registeredPlayersError) {
      console.error("Error fetching registered players:", registeredPlayersError)
      return NextResponse.json({ error: "Failed to fetch registered players" }, { status: 500 })
    }

    return NextResponse.json({
      activeTournaments: activeTournaments.length,
      registeredPlayers: registeredPlayers.length,
    })
  } catch (error) {
    console.error("Active tournaments API error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

