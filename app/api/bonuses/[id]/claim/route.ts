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

    // Получаем информацию о бонусе пользователя
    const userBonus = await prisma.userBonus.findFirst({
      where: {
        userId: Number.parseInt(userId),
        bonusId,
        isActive: true,
        isCompleted: false,
      },
      include: {
        bonus: true,
      },
    })

    if (!userBonus) {
      return NextResponse.json({ message: "Бонус не найден или уже получен" }, { status: 404 })
    }

    // Проверяем, выполнены ли условия для получения бонуса
    if (userBonus.progress < 100) {
      return NextResponse.json({ message: "Условия бонуса еще не выполнены" }, { status: 400 })
    }

    // Обновляем статус бонуса на завершенный
    await prisma.userBonus.update({
      where: {
        id: userBonus.id,
      },
      data: {
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
          increment: userBonus.bonus.amount,
        },
      },
    })

    // Создаем запись о транзакции
    await prisma.transaction.create({
      data: {
        userId: Number.parseInt(userId),
        amount: userBonus.bonus.amount,
        type: "bonus",
        status: "completed",
        description: `Бонус: ${userBonus.bonus.title}`,
      },
    })

    return NextResponse.json({
      success: true,
      message: `Вы получили ${userBonus.bonus.amount} фишек!`,
      amount: userBonus.bonus.amount,
    })
  } catch (error) {
    console.error("Ошибка при получении награды:", error)
    return NextResponse.json({ message: "Внутренняя ошибка сервера" }, { status: 500 })
  }
}

