import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ message: "Не авторизован" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ message: "ID пользователя не указан" }, { status: 400 })
    }

    // Получаем лимиты из переменных окружения
    const MAX_DAILY_WITHDRAWAL = Number.parseInt(process.env.MAX_DAILY_WITHDRAWAL || "10000")
    const MAX_MONTHLY_WITHDRAWAL = Number.parseInt(process.env.MAX_MONTHLY_WITHDRAWAL || "100000")

    // Получаем сумму выводов за текущий день
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const dailyWithdrawals = await prisma.transaction.aggregate({
      where: {
        userId: Number.parseInt(userId),
        type: "withdraw",
        status: { in: ["pending", "completed"] },
        createdAt: { gte: today },
      },
      _sum: { amount: true },
    })

    const dailyUsed = Math.abs(dailyWithdrawals._sum.amount || 0)

    // Получаем сумму выводов за текущий месяц
    const firstDayOfMonth = new Date()
    firstDayOfMonth.setDate(1)
    firstDayOfMonth.setHours(0, 0, 0, 0)

    const monthlyWithdrawals = await prisma.transaction.aggregate({
      where: {
        userId: Number.parseInt(userId),
        type: "withdraw",
        status: { in: ["pending", "completed"] },
        createdAt: { gte: firstDayOfMonth },
      },
      _sum: { amount: true },
    })

    const monthlyUsed = Math.abs(monthlyWithdrawals._sum.amount || 0)

    return NextResponse.json({
      success: true,
      dailyLimit: MAX_DAILY_WITHDRAWAL,
      monthlyLimit: MAX_MONTHLY_WITHDRAWAL,
      dailyUsed,
      monthlyUsed,
      dailyRemaining: MAX_DAILY_WITHDRAWAL - dailyUsed,
      monthlyRemaining: MAX_MONTHLY_WITHDRAWAL - monthlyUsed,
    })
  } catch (error) {
    console.error("Ошибка при получении лимитов вывода:", error)
    return NextResponse.json({ message: "Внутренняя ошибка сервера" }, { status: 500 })
  }
}

