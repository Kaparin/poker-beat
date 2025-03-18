import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user.isAdmin) {
      return NextResponse.json({ message: "Доступ запрещен" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const pageSize = Number.parseInt(searchParams.get("pageSize") || "10")

    // Получаем общее количество промокодов
    const totalCount = await prisma.promoCode.count()

    const totalPages = Math.ceil(totalCount / pageSize)

    // Получаем промокоды с пагинацией
    const promoCodes = await prisma.promoCode.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        _count: {
          select: { redemptions: true },
        },
      },
    })

    return NextResponse.json({
      success: true,
      promoCodes: promoCodes.map((code) => ({
        ...code,
        redemptionsCount: code._count.redemptions,
      })),
      totalCount,
      totalPages,
      currentPage: page,
    })
  } catch (error) {
    console.error("Ошибка при получении промокодов:", error)
    return NextResponse.json({ message: "Внутренняя ошибка сервера" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user.isAdmin) {
      return NextResponse.json({ message: "Доступ запрещен" }, { status: 403 })
    }

    const body = await req.json()
    const { code, reward, description, maxUses, expiresAt, isActive } = body

    if (!code || !reward) {
      return NextResponse.json({ message: "Отсутствуют обязательные поля" }, { status: 400 })
    }

    // Проверяем, не существует ли уже такой промокод
    const existingCode = await prisma.promoCode.findUnique({
      where: { code },
    })

    if (existingCode) {
      return NextResponse.json({ message: "Промокод с таким кодом уже существует" }, { status: 400 })
    }

    // Создаем новый промокод
    const promoCode = await prisma.promoCode.create({
      data: {
        code,
        reward,
        description,
        maxUses,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        isActive: isActive !== undefined ? isActive : true,
      },
    })

    return NextResponse.json({
      success: true,
      promoCode,
    })
  } catch (error) {
    console.error("Ошибка при создании промокода:", error)
    return NextResponse.json({ message: "Внутренняя ошибка сервера" }, { status: 500 })
  }
}

