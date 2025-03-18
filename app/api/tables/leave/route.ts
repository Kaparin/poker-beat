import { type NextRequest, NextResponse } from "next/server"
import { withAuth } from "@/lib/auth-middleware"
import prisma from "@/lib/prisma"
import { encrypt } from "@/lib/encryption"

export const POST = withAuth(async (req: NextRequest, user) => {
  try {
    const { tableId } = await req.json()

    if (!tableId) {
      return NextResponse.json({ error: "Table ID is required" }, { status: 400 })
    }

    // Проверяем, не является ли это мок-столом в режиме разработки
    if (process.env.NODE_ENV === "development" && tableId.startsWith("mock-table")) {
      // Для мок-столов просто возвращаем успешный ответ
      return NextResponse.json({
        success: true,
        message: "Successfully left the table",
      })
    }

    // Получаем информацию о столе и игроке
    const table = await prisma.table.findUnique({
      where: { id: tableId },
      include: {
        games: {
          where: { status: "in_progress" },
          include: {
            players: {
              where: { userId: user.id },
            },
          },
        },
      },
    })

    if (!table) {
      return NextResponse.json({ error: "Table not found" }, { status: 404 })
    }

    // Проверяем, сидит ли игрок за столом
    if (table.games.length === 0 || table.games[0].players.length === 0) {
      return NextResponse.json({ error: "You are not at this table" }, { status: 400 })
    }

    const gamePlayer = table.games[0].players[0]
    const game = table.games[0]

    // Начинаем транзакцию для обеспечения атомарности
    await prisma.$transaction(async (prisma) => {
      // Возвращаем фишки игроку
      await prisma.user.update({
        where: { id: user.id },
        data: {
          balance: { increment: gamePlayer.initialStack },
        },
      })

      // Удаляем игрока из игры
      await prisma.gamePlayer.delete({
        where: { id: gamePlayer.id },
      })

      // Если это был последний игрок, завершаем игру
      const remainingPlayers = await prisma.gamePlayer.count({
        where: { gameId: game.id },
      })

      if (remainingPlayers === 0) {
        await prisma.game.update({
          where: { id: game.id },
          data: {
            status: "completed",
            endTime: new Date(),
          },
        })

        // Если это была последняя игра, обновляем статус стола
        await prisma.table.update({
          where: { id: tableId },
          data: {
            status: "waiting",
          },
        })
      }
    })

    // Создаем запись о транзакции для выхода из игры
    await prisma.transaction.create({
      data: {
        userId: user.id,
        type: "game_cash_out",
        amount: gamePlayer.initialStack,
        tonAmount: 0,
        status: "completed",
        memo: `Cash out from table ${table.name}`,
        gameId: game.id,
      },
    })

    // Логируем действие для безопасности
    await prisma.securityLog
      .create({
        data: {
          userId: user.id,
          action: "player_left_table",
          ipAddress: encrypt(req.ip || "unknown"),
          userAgent: req.headers.get("user-agent") || "unknown",
          details: `Player left table ${tableId}`,
        },
      })
      .catch((err) => console.error("Error logging player leave:", err))

    return NextResponse.json({
      success: true,
      message: "Successfully left the table",
    })
  } catch (error) {
    console.error("Error leaving table:", error)
    return NextResponse.json({ error: "Failed to leave table" }, { status: 500 })
  }
})

