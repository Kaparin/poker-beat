import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ message: "Не авторизован" }, { status: 401 })
    }

    const userId = session.user.id
    const bonusId = Number.parseInt(params.id)

    if (isNaN(bonusId)) {
      return NextResponse.json({ message: "Неверный ID бонуса" }, { status: 400 })
    }

    // Проверяем, существует ли бонус и активен ли он
    const bonus = await prisma.bonus.findUnique({
      where: {
        id: bonusId,
        isActive: true,
        expiresAt: {
          gt: new Date(),
        },
      },
    })

    if (!bonus) {
      return NextResponse.json({ message: "Бонус не найден или неактивен" }, { status: 404 })
    }

    // Проверяем, не активирован ли уже бонус пользователем
    const existingUserBonus = await prisma.userBonus.findFirst({
      where: {
        userId: Number.parseInt(userId),
        bonusId,
      },
    })

    if (existingUserBonus) {
      return NextResponse.json({ message: "Бонус уже активирован" }, { status: 400 })
    }

    // Активируем бонус для пользователя
    const userBonus = await prisma.userBonus.create({
      data: {
        userId: Number.parseInt(userId),
        bonusId,
        isActive: true,
        progress: 0,
        isCompleted: false,
      },
    })

    // Если это приветственный бонус или другой бонус, который можно сразу получить
    if (bonus.type === "welcome" || bonus.requiredAction === null) {
      // Обновляем статус бонуса на завершенный
      await prisma.userBonus.update({
        where: {
          id: userBonus.id,
        },
        data: {
          progress: 100,
          isCompleted: true,
        },
      })

      // Начисляем фишки пользователю
      await prisma.user.update({
        where: {
          id: Number.parseInt(userId),
        },
        data: {
          chips: {
            increment: bonus.amount,
          },
        },
      })

      // Создаем запись о транзакции
      await prisma.transaction.create({
        data: {
          userId: Number.parseInt(userId),
          amount: bonus.amount,
          type: "bonus",
          status: "completed",
          description: `Бонус: ${bonus.title}`,
        },
      })

      return NextResponse.json({
        success: true,
        message: `Бонус активирован и вы получили ${bonus.amount} фишек!`,
        amount: bonus.amount,
        isCompleted: true,
      })
    }

    return NextResponse.json({
      success: true,
      message: "Бонус успешно активирован",
    })
  } catch (error) {
    console.error("Ошибка при активации бонуса:", error)
    return NextResponse.json({ message: "Внутренняя ошибка сервера" }, { status: 500 })
  }
}

