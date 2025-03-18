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

    const body = await req.json()
    const { userId, promoCode } = body

    if (!userId || !promoCode) {
      return NextResponse.json({ message: "Отсутствуют обязательные поля" }, { status: 400 })
    }

    // Проверяем, что пользователь существует
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json({ message: "Пользователь не найден" }, { status: 404 })
    }

    // Ищем промокод в базе данных
    const promotion = await prisma.promoCode.findUnique({
      where: { code: promoCode },
    })

    if (!promotion) {
      return NextResponse.json({ message: "Промокод не найден" }, { status: 404 })
    }

    // Проверяем, не истек ли срок действия промокода
    if (promotion.expiresAt && new Date(promotion.expiresAt) < new Date()) {
      return NextResponse.json({ message: "Срок действия промокода истек" }, { status: 400 })
    }

    // Проверяем, не превышено ли максимальное количество использований
    if (promotion.maxUses !== null && promotion.usedCount >= promotion.maxUses) {
      return NextResponse.json(
        { message: "Промокод больше не действителен (достигнут лимит использований)" },
        { status: 400 },
      )
    }

    // Проверяем, не использовал ли пользователь уже этот промокод
    const existingRedemption = await prisma.promoCodeRedemption.findFirst({
      where: {
        userId,
        promoCodeId: promotion.id,
      },
    })

    if (existingRedemption) {
      return NextResponse.json({ message: "Вы уже использовали этот промокод" }, { status: 400 })
    }

    // Начинаем транзакцию для атомарного обновления
    const result = await prisma.$transaction(async (tx) => {
      // Создаем запись об использовании промокода
      await tx.promoCodeRedemption.create({
        data: {
          userId,
          promoCodeId: promotion.id,
        },
      })

      // Увеличиваем счетчик использований промокода
      await tx.promoCode.update({
        where: { id: promotion.id },
        data: { usedCount: { increment: 1 } },
      })

      // Начисляем бонус пользователю
      await tx.user.update({
        where: { id: userId },
        data: { balance: { increment: promotion.reward } },
      })

      // Создаем транзакцию
      await tx.transaction.create({
        data: {
          userId,
          type: "bonus",
          amount: promotion.reward,
          status: "completed",
          description: `Бонус за активацию промокода ${promoCode}`,
        },
      })

      // Создаем уведомление
      await tx.notification.create({
        data: {
          userId,
          type: "system",
          title: "Промокод активирован",
          message: `Вы успешно активировали промокод ${promoCode} и получили ${promotion.reward} фишек!`,
          read: false,
        },
      })

      return promotion.reward
    })

    return NextResponse.json({
      success: true,
      message: "Промокод успешно активирован",
      reward: result,
    })
  } catch (error) {
    console.error("Ошибка при активации промокода:", error)
    return NextResponse.json({ message: "Внутренняя ошибка сервера" }, { status: 500 })
  }
}

