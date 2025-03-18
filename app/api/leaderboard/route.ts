import { type NextRequest, NextResponse } from "next/server"
import { withAuth } from "@/lib/auth-middleware"
import prisma from "@/lib/prisma"

// Get leaderboard
export const GET = withAuth(async (req: NextRequest, user) => {
  try {
    const timeframe = req.nextUrl.searchParams.get("timeframe") || "weekly"
    const category = req.nextUrl.searchParams.get("category") || "overall"

    // Validate parameters
    if (!["daily", "weekly", "monthly", "allTime"].includes(timeframe)) {
      return NextResponse.json({ error: "Invalid timeframe" }, { status: 400 })
    }

    if (!["cashGames", "tournaments", "overall"].includes(category)) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 })
    }

    // Get leaderboard from database
    const leaderboard = await prisma.leaderboard.findUnique({
      where: {
        timeframe_category: {
          timeframe,
          category,
        },
      },
    })

    if (!leaderboard) {
      // Return empty leaderboard if not found
      return NextResponse.json({
        leaderboard: {
          timeframe,
          category,
          entries: [],
          lastUpdated: new Date(),
        },
      })
    }

    // Parse entries
    const entries = JSON.parse(leaderboard.entries as string)

    return NextResponse.json({
      leaderboard: {
        timeframe,
        category,
        entries,
        lastUpdated: leaderboard.lastUpdated,
      },
    })
  } catch (error) {
    console.error("Error fetching leaderboard:", error)
    return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 })
  }
})

