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

    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const pageSize = Number.parseInt(searchParams.get("pageSize") || "10")
    const filter = searchParams.get("filter") || "all"

    if (!userId) {
      return NextResponse.json({ message: "ID пользователя не указан" }, { status: 400 })
    }

    // Формируем условия фильтрации
    const whereCondition: any = { userId: Number.parseInt(userId) }

    if (filter !== "all") {
      if (filter === "game") {
        whereCondition.type = { in: ["game_win", "game_loss"] }
      } else if (filter === "tournament") {
        whereCondition.type = { in: ["tournament_entry", "tournament_win"] }
      } else {
        whereCondition.type = filter
      }
    }

    // Получаем общее количество транзакций
    const totalCount = await prisma.transaction.count({
      where: whereCondition,
    })

    const totalPages = Math.ceil(totalCount / pageSize)

    // Получаем транзакции с пагинацией
    const transactions = await prisma.transaction.findMany({
      where: whereCondition,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    })

    return NextResponse.json({
      success: true,
      transactions,
      totalCount,
      totalPages,
      currentPage: page,
    })
  } catch (error) {
    console.error("Ошибка при получении истории транзакций:", error)
    return NextResponse.json({ message: "Внутренняя ошибка сервера" }, { status: 500 })
  }
}

