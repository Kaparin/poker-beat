import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ message: "Доступ запрещен" }, { status: 403 })
    }

    const bonusId = Number.parseInt(params.id)

    if (isNaN(bonusId)) {
      return NextResponse.json({ message: "Неверный ID бонуса" }, { status: 400 })
    }

    // Получаем информацию о бонусе
    const bonus = await prisma.bonus.findUnique({
      where: {
        id: bonusId,
      },
    })

    if (!bonus) {
      return NextResponse.json({ message: "Бонус не найден" }, { status: 404 })
    }

    // Получаем статистику по использованию бонуса
    const stats = await prisma.$transaction([
      // Количество активаций
      prisma.userBonus.count({
        where: {
          bonusId,
        },
      }),
      // Количество завершенных бонусов
      prisma.userBonus.count({
        where: {
          bonusId,
          isCompleted: true,
        },
      }),
    ])

    return NextResponse.json({
      success: true,
      bonus,
      stats: {
        activations: stats[0],
        completions: stats[1],
        completionRate: stats[0] > 0 ? (stats[1] / stats[0]) * 100 : 0,
      },
    })
  } catch (error) {
    console.error("Ошибка при получении информации о бонусе:", error)
    return NextResponse.json({ message: "Внутренняя ошибка сервера" }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ message: "Доступ запрещен" }, { status: 403 })
    }

    const bonusId = Number.parseInt(params.id)

    if (isNaN(bonusId)) {
      return NextResponse.json({ message: "Неверный ID бонуса" }, { status: 400 })
    }

    const body = await req.json()

    // Валидация данных
    const { title, description, type, amount, requiredAction, isActive, expiresAt } = body

    // Обновляем бонус
    const bonus = await prisma.bonus.update({
      where: {
        id: bonusId,
      },
      data: {
        title,
        description,
        type,
        amount,
        requiredAction,
        isActive,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    })

    return NextResponse.json({
      success: true,
      message: "Бонус успешно обновлен",
      bonus,
    })
  } catch (error) {
    console.error("Ошибка при обновлении бонуса:", error)
    return NextResponse.json({ message: "Внутренняя ошибка сервера" }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ message: "Доступ запрещен" }, { status: 403 })
    }

    const bonusId = Number.parseInt(params.id)

    if (isNaN(bonusId)) {
      return NextResponse.json({ message: "Неверный ID бонуса" }, { status: 400 })
    }

    // Проверяем, существует ли бонус
    const bonus = await prisma.bonus.findUnique({
      where: {
        id: bonusId,
      },
    })

    if (!bonus) {
      return NextResponse.json({ message: "Бонус не найден" }, { status: 404 })
    }

    // Удаляем бонус
    await prisma.bonus.delete({
      where: {
        id: bonusId,
      },
    })

    return NextResponse.json({
      success: true,
      message: "Бонус успешно удален",
    })
  } catch (error) {
    console.error("Ошибка при удалении бонуса:", error)
    return NextResponse.json({ message: "Внутренняя ошибка сервера" }, { status: 500 })
  }
}

