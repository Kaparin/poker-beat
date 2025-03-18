import { type NextRequest, NextResponse } from "next/server"
import { withAuth } from "@/lib/auth-middleware"
import prisma from "@/lib/prisma"
import { encrypt } from "@/lib/encryption"

export const GET = withAuth(async (req: NextRequest, user, token) => {
  try {
    // Get client IP for security logging
    const ip = req.ip || req.headers.get("x-forwarded-for") || "unknown"
    const userAgent = req.headers.get("user-agent") || "unknown"

    // Get all user data
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        settings: true,
        statistics: true,
        transactions: true,
        gamePlayers: {
          include: {
            game: true,
          },
        },
      },
    })

    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Log the data export
    await prisma.securityLog.create({
      data: {
        userId: user.id,
        action: "data_export",
        ipAddress: encrypt(ip),
        userAgent,
        details: "User exported their data under GDPR",
      },
    })

    // Format the data for export
    const exportData = {
      personalInfo: {
        id: userData.id,
        telegramId: userData.telegramId,
        firstName: userData.firstName,
        lastName: userData.lastName,
        username: userData.username,
        inGameName: userData.inGameName,
        createdAt: userData.createdAt,
        lastLoginAt: userData.lastLoginAt,
      },
      settings: userData.settings,
      statistics: userData.statistics,
      financialData: {
        currentBalance: userData.balance,
        currentTonBalance: userData.tonBalance,
        transactions: userData.transactions.map((t) => ({
          id: t.id,
          type: t.type,
          amount: t.amount,
          tonAmount: t.tonAmount,
          status: t.status,
          timestamp: t.timestamp,
          memo: t.memo,
        })),
      },
      gameHistory: userData.gamePlayers.map((gp) => ({
        gameId: gp.gameId,
        tableId: gp.game.tableId,
        startTime: gp.game.startTime,
        endTime: gp.game.endTime,
        initialStack: gp.initialStack,
        finalStack: gp.finalStack,
        isWinner: gp.isWinner,
        amountWon: gp.amountWon,
        position: gp.position,
      })),
    }

    return NextResponse.json(exportData)
  } catch (error) {
    console.error("Error exporting user data:", error)
    return NextResponse.json({ error: "Failed to export user data" }, { status: 500 })
  }
})

