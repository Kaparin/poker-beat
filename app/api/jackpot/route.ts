import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

/**
 * Получение информации о текущем джекпоте
 */
export async function GET(req: NextRequest) {
  try {
    // Получаем информацию о джекпоте
    const jackpot = await db.jackpot.findFirst()

    if (!jackpot) {
      return NextResponse.json({
        amount: 0,
        lastUpdated: new Date(),
      })
    }

    return NextResponse.json({
      amount: jackpot.amount,
      lastUpdated: jackpot.lastUpdated,
    })
  } catch (error) {
    console.error("Ошибка при получении информации о джекпоте:", error)
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 })
  }
}

