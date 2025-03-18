import { NextResponse } from "next/server"
import { supabase } from "@/lib/api-client"
import { auth } from "@/lib/auth"

export async function GET(request: Request) {
  try {
    // Проверка аутентификации
    const session = await auth()
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Получение статистики игр
    const { data: gameStats, error: gameStatsError } = await supabase.rpc("get_user_game_statistics", {
      p_user_id: session.user.id,
    })

    if (gameStatsError) {
      console.error("Error fetching game statistics:", gameStatsError)
      return NextResponse.json({ error: "Failed to fetch game statistics" }, { status: 500 })
    }

    // Получение статистики турниров
    const { data: tournamentStats, error: tournamentStatsError } = await supabase.rpc(
      "get_user_tournament_statistics",
      {
        p_user_id: session.user.id,
      },
    )

    if (tournamentStatsError) {
      console.error("Error fetching tournament statistics:", tournamentStatsError)
      return NextResponse.json({ error: "Failed to fetch tournament statistics" }, { status: 500 })
    }

    // Получение статистики рук
    const { data: handStats, error: handStatsError } = await supabase.rpc("get_user_hand_statistics", {
      p_user_id: session.user.id,
    })

    if (handStatsError) {
      console.error("Error fetching hand statistics:", handStatsError)
      return NextResponse.json({ error: "Failed to fetch hand statistics" }, { status: 500 })
    }

    // Получение истории игр
    const { data: recentGames, error: recentGamesError } = await supabase
      .from("game_players")
      .select(`
        id,
        games:game_id (
          id,
          table_id,
          tables:table_id (name),
          game_type,
          blinds,
          pot_size,
          winner_id,
          ended_at
        ),
        final_chips,
        final_position,
        created_at
      `)
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(5)

    if (recentGamesError) {
      console.error("Error fetching recent games:", recentGamesError)
      return NextResponse.json({ error: "Failed to fetch recent games" }, { status: 500 })
    }

    // Преобразование данных в нужный формат
    const formattedRecentGames = recentGames
      .filter((game) => game.games) // Фильтрация null значений
      .map((game) => ({
        id: game.id,
        gameId: game.games.id,
        tableName: game.games.tables?.name || "Unknown",
        gameType: game.games.game_type,
        blinds: game.games.blinds,
        potSize: game.games.pot_size,
        isWinner: game.games.winner_id === session.user.id,
        finalChips: game.final_chips,
        finalPosition: game.final_position,
        endedAt: game.games.ended_at,
        createdAt: game.created_at,
      }))

    // Формирование ответа
    const statistics = {
      games: {
        totalGames: gameStats.total_games || 0,
        gamesWon: gameStats.games_won || 0,
        winRate: gameStats.win_rate || 0,
        totalChipsWon: gameStats.total_chips_won || 0,
        totalChipsLost: gameStats.total_chips_lost || 0,
        biggestPot: gameStats.biggest_pot || 0,
        averagePot: gameStats.average_pot || 0,
      },
      tournaments: {
        totalTournaments: tournamentStats.total_tournaments || 0,
        tournamentsWon: tournamentStats.tournaments_won || 0,
        inTheMoney: tournamentStats.in_the_money || 0,
        bestFinish: tournamentStats.best_finish || 0,
        totalPrizeWon: tournamentStats.total_prize_won || 0,
      },
      hands: {
        totalHands: handStats.total_hands || 0,
        handsWon: handStats.hands_won || 0,
        handWinRate: handStats.hand_win_rate || 0,
        bestHand: handStats.best_hand || "None",
        foldRate: handStats.fold_rate || 0,
        checkRate: handStats.check_rate || 0,
        callRate: handStats.call_rate || 0,
        betRate: handStats.bet_rate || 0,
        raiseRate: handStats.raise_rate || 0,
      },
      recentGames: formattedRecentGames,
    }

    return NextResponse.json(statistics)
  } catch (error) {
    console.error("Statistics API error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

