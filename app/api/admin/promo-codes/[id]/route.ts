import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user.isAdmin) {
      return NextResponse.json({ message: "Доступ запрещен" }, { status: 403 })
    }

    const id = Number.parseInt(params.id)

    if (isNaN(id)) {
      return NextResponse.json({ message: "Некорректный ID" }, { status: 400 })
    }

    // Получаем промокод
    const promoCode = await prisma.promoCode.findUnique({
      where: { id },
      include: {
        redemptions: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                telegramId: true,
              },
            },
          },
        },
      },
    })

    if (!promoCode) {
      return NextResponse.json({ message: "Промокод не найден" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      promoCode,
    })
  } catch (error) {
    console.error("Ошибка при получении промокода:", error)
    return NextResponse.json({ message: "Внутренняя ошибка сервера" }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user.isAdmin) {
      return NextResponse.json({ message: "Доступ запрещен" }, { status: 403 })
    }

    const id = Number.parseInt(params.id)

    if (isNaN(id)) {
      return NextResponse.json({ message: "Некорректный ID" }, { status: 400 })
    }

    const body = await req.json()
    const { reward, description, maxUses, expiresAt, isActive } = body

    // Проверяем, существует ли промокод
    const existingCode = await prisma.promoCode.findUnique({
      where: { id },
    })

    if (!existingCode) {
      return NextResponse.json({ message: "Промокод не найден" }, { status: 404 })
    }

    // Обновляем промокод
    const promoCode = await prisma.promoCode.update({
      where: { id },
      data: {
        reward: reward !== undefined ? reward : existingCode.reward,
        description: description !== undefined ? description : existingCode.description,
        maxUses: maxUses !== undefined ? maxUses : existingCode.maxUses,
        expiresAt: expiresAt !== undefined ? new Date(expiresAt) : existingCode.expiresAt,
        isActive: isActive !== undefined ? isActive : existingCode.isActive,
      },
    })

    return NextResponse.json({
      success: true,
      promoCode,
    })
  } catch (error) {
    console.error("Ошибка при обновлении промокода:", error)
    return NextResponse.json({ message: "Внутренняя ошибка сервера" }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user.isAdmin) {
      return NextResponse.json({ message: "Доступ запрещен" }, { status: 403 })
    }

    const id = Number.parseInt(params.id)

    if (isNaN(id)) {
      return NextResponse.json({ message: "Некорректный ID" }, { status: 400 })
    }

    // Проверяем, существует ли промокод
    const existingCode = await prisma.promoCode.findUnique({
      where: { id },
    })

    if (!existingCode) {
      return NextResponse.json({ message: "Промокод не найден" }, { status: 404 })
    }

    // Удаляем промокод
    await prisma.$transaction([
      // Сначала удаляем все записи об использовании промокода
      prisma.promoCodeRedemption.deleteMany({
        where: { promoCodeId: id },
      }),
      // Затем удаляем сам промокод
      prisma.promoCode.delete({
        where: { id },
      }),
    ])

    return NextResponse.json({
      success: true,
      message: "Промокод успешно удален",
    })
  } catch (error) {
    console.error("Ошибка при удалении промокода:", error)
    return NextResponse.json({ message: "Внутренняя ошибка сервера" }, { status: 500 })
  }
}

