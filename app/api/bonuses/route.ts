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

    // Получаем все бонусы пользователя
    const userBonuses = await prisma.userBonus.findMany({
      where: {
        userId: Number.parseInt(userId),
      },
      include: {
        bonus: true,
      },
    })

    // Получаем все активные бонусы из системы, которые еще не назначены пользователю
    const availableBonuses = await prisma.bonus.findMany({
      where: {
        isActive: true,
        expiresAt: {
          gt: new Date(),
        },
        NOT: {
          userBonuses: {
            some: {
              userId: Number.parseInt(userId),
            },
          },
        },
      },
    })

    // Форматируем данные для фронтенда
    const formattedUserBonuses = userBonuses.map((userBonus) => ({
      id: userBonus.bonus.id,
      title: userBonus.bonus.title,
      description: userBonus.bonus.description,
      type: userBonus.bonus.type,
      amount: userBonus.bonus.amount,
      progress: userBonus.progress,
      requiredAction: userBonus.bonus.requiredAction,
      expiresAt: userBonus.bonus.expiresAt,
      isActive: userBonus.isActive,
      isCompleted: userBonus.isCompleted,
    }))

    const formattedAvailableBonuses = availableBonuses.map((bonus) => ({
      id: bonus.id,
      title: bonus.title,
      description: bonus.description,
      type: bonus.type,
      amount: bonus.amount,
      requiredAction: bonus.requiredAction,
      expiresAt: bonus.expiresAt,
      isActive: false,
      isCompleted: false,
    }))

    // Объединяем бонусы пользователя и доступные бонусы
    const allBonuses = [...formattedUserBonuses, ...formattedAvailableBonuses]

    return NextResponse.json({
      success: true,
      bonuses: allBonuses,
    })
  } catch (error) {
    console.error("Ошибка при получении бонусов:", error)
    return NextResponse.json({ message: "Внутренняя ошибка сервера" }, { status: 500 })
  }
}

