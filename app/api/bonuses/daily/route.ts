import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function POST(req: Request) {
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

    if (dailyBonusToday) {
      return NextResponse.json(
        {
          message: "Вы уже получили ежедневный бонус сегодня",
          nextAvailable: new Date(today.getTime() + 24 * 60 * 60 * 1000),
        },
        { status: 400 },
      )
    }

    // Определяем размер бонуса (можно настроить логику в зависимости от статуса пользователя)
    const user = await prisma.user.findUnique({
      where: {
        id: Number.parseInt(userId),
      },
      select: {
        vipLevel: true,
        consecutiveLoginDays: true,
      },
    })

    if (!user) {
      return NextResponse.json({ message: "Пользователь не найден" }, { status: 404 })
    }

    // Базовый бонус
    let bonusAmount = 1000

    // Увеличиваем бонус в зависимости от VIP-уровня
    if (user.vipLevel > 0) {
      bonusAmount += user.vipLevel * 500
    }

    // Увеличиваем бонус за последовательные дни входа
    const consecutiveDays = user.consecutiveLoginDays || 0
    if (consecutiveDays > 0) {
      // Максимальный множитель за 7 дней подряд
      const multiplier = Math.min(consecutiveDays, 7) * 0.1 + 1
      bonusAmount = Math.floor(bonusAmount * multiplier)
    }

    // Начисляем фишки пользователю
    await prisma.user.update({
      where: {
        id: Number.parseInt(userId),
      },
      data: {
        chips: {
          increment: bonusAmount,
        },
        consecutiveLoginDays: {
          increment: 1,
        },
        lastLoginAt: new Date(),
      },
    })

    // Создаем запись о транзакции
    await prisma.transaction.create({
      data: {
        userId: Number.parseInt(userId),
        amount: bonusAmount,
        type: "bonus",
        status: "completed",
        description: `Ежедневный бонус (День ${consecutiveDays + 1})`,
      },
    })

    return NextResponse.json({
      success: true,
      message: `Вы получили ежедневный бонус в размере ${bonusAmount} фишек!`,
      amount: bonusAmount,
      consecutiveLoginDays: consecutiveDays + 1,
      nextAvailable: new Date(today.getTime() + 24 * 60 * 60 * 1000),
    })
  } catch (error) {
    console.error("Ошибка при получении ежедневного бонуса:", error)
    return NextResponse.json({ message: "Внутренняя ошибка сервера" }, { status: 500 })
  }
}

