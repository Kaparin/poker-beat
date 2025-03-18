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

    const userId = session.user.id

    // Проверяем, получал ли пользователь ежедневный бонус сегодня
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const dailyBonusToday = await prisma.transaction.findFirst({
      where: {
        userId: Number.parseInt(userId),
        type: "bonus",
        description: {
          contains: "Ежедневный бонус",
        },
        createdAt: {
          gte: today,
        },
      },
    })

    // Получаем информацию о пользователе
    const user = await prisma.user.findUnique({
      where: {
        id: Number.parseInt(userId),
      },
      select: {
        consecutiveLoginDays: true,
        lastLoginAt: true,
      },
    })

    if (!user) {
      return NextResponse.json({ message: "Пользователь не найден" }, { status: 404 })
    }

    // Если пользователь уже получил бонус сегодня
    if (dailyBonusToday) {
      return NextResponse.json({
        claimed: true,
        nextAvailable: new Date(today.getTime() + 24 * 60 * 60 * 1000),
        consecutiveLoginDays: user.consecutiveLoginDays || 0,
      })
    }

    return NextResponse.json({
      claimed: false,
      consecutiveLoginDays: user.consecutiveLoginDays || 0,
    })
  } catch (error) {
    console.error("Ошибка при проверке статуса ежедневного бонуса:", error)
    return NextResponse.json({ message: "Внутренняя ошибка сервера" }, { status: 500 })
  }
}

