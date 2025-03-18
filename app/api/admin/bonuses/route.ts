import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ message: "Доступ запрещен" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const type = searchParams.get("type")
    const isActive = searchParams.has("isActive") ? searchParams.get("isActive") === "true" : undefined

    const skip = (page - 1) * limit

    // Формируем условия фильтрации
    const where: any = {}

    if (type) {
      where.type = type
    }

    if (isActive !== undefined) {
      where.isActive = isActive
    }

    // Получаем бонусы с пагинацией и фильтрацией
    const bonuses = await prisma.bonus.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
    })

    // Получаем общее количество бонусов для пагинации
    const total = await prisma.bonus.count({ where })

    return NextResponse.json({
      success: true,
      bonuses,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Ошибка при получении бонусов:", error)
    return NextResponse.json({ message: "Внутренняя ошибка сервера" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ message: "Доступ запрещен" }, { status: 403 })
    }

    const body = await req.json()

    // Валидация данных
    const { title, description, type, amount, requiredAction, isActive, expiresAt } = body

    if (!title || !description || !type || !amount) {
      return NextResponse.json({ message: "Не все обязательные поля заполнены" }, { status: 400 })
    }

    // Создаем новый бонус
    const bonus = await prisma.bonus.create({
      data: {
        title,
        description,
        type,
        amount,
        requiredAction,
        isActive: isActive ?? true,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    })

    return NextResponse.json({
      success: true,
      message: "Бонус успешно создан",
      bonus,
    })
  } catch (error) {
    console.error("Ошибка при создании бонуса:", error)
    return NextResponse.json({ message: "Внутренняя ошибка сервера" }, { status: 500 })
  }
}

