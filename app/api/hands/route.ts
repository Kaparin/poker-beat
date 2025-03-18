import { type NextRequest, NextResponse } from "next/server"
import { withAuth } from "@/lib/auth-middleware"
import prisma from "@/lib/prisma"

// Get user's hand history
export const GET = withAuth(async (req: NextRequest, user) => {
  try {
    const page = Number.parseInt(req.nextUrl.searchParams.get("page") || "1")
    const limit = Number.parseInt(req.nextUrl.searchParams.get("limit") || "10")
    const type = req.nextUrl.searchParams.get("type") // "cash" or "tournament"

    // Validate parameters
    if (isNaN(page) || page < 1) {
      return NextResponse.json({ error: "Invalid page parameter" }, { status: 400 })
    }

    if (isNaN(limit) || limit < 1 || limit > 50) {
      return NextResponse.json({ error: "Invalid limit parameter" }, { status: 400 })
    }

    // Build query
    const skip = (page - 1) * limit

    // Get hand history from database
    const handHistoryQuery = prisma.handHistory.findMany({
      where: {
        players: {
          path: "$[*].userId",
          array_contains: user.id,
        },
        ...(type === "tournament" ? { tournamentId: { not: null } } : {}),
        ...(type === "cash" ? { tournamentId: null } : {}),
      },
      orderBy: {
        startTime: "desc",
      },
      skip,
      take: limit,
    })

    // Execute query
    const handHistory = await handHistoryQuery

    // Format hand history
    const formattedHands = handHistory.map((hand) => {
      const players = JSON.parse(hand.players as string)
      const actions = JSON.parse(hand.actions as string)
      const communityCards = hand.communityCards ? JSON.parse(hand.communityCards as string) : []
      const results = hand.results ? JSON.parse(hand.results as string) : {}

      // Format player actions
      const playersWithActions = players.map((player: any) => {
        const playerActions = actions.filter((action: any) => action.userId === player.userId)

        return {
          ...player,
          actions: playerActions.map((action: any) => ({
            action: action.action,
            amount: action.amount,
            stage: action.stage,
            timestamp: action.timestamp,
          })),
          wonAmount: results[player.userId] || 0,
        }
      })

      return {
        handId: hand.id,
        tableId: hand.tableId,
        tournamentId: hand.tournamentId,
        handNumber: hand.handNumber,
        players: playersWithActions,
        communityCards,
        pot: hand.pot,
        rake: hand.rake,
        timestamp: hand.startTime,
      }
    })

    return NextResponse.json({ hands: formattedHands })
  } catch (error) {
    console.error("Error fetching hand history:", error)
    return NextResponse.json({ error: "Failed to fetch hand history" }, { status: 500 })
  }
})

