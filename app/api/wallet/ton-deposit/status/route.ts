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
    const transactionId = searchParams.get("transactionId")

    if (!transactionId) {
      return NextResponse.json({ message: "ID транзакции не указан" }, { status: 400 })
    }

    // Получаем транзакцию из базы данных
    const transaction = await prisma.transaction.findUnique({
      where: { id: Number.parseInt(transactionId) },
    })

    if (!transaction) {
      return NextResponse.json({ message: "Транзакция не найдена" }, { status: 404 })
    }

    // В реальном приложении здесь был бы код для проверки статуса транзакции в TON
    // Для демонстрации, мы будем случайно менять статус

    // Симулируем проверку статуса (в реальном приложении здесь была бы проверка через TON API)
    let status = transaction.status

    if (status === "pending") {
      // Для демонстрации: 30% шанс, что транзакция будет завершена
      if (Math.random() < 0.3) {
        // Обновляем статус транзакции
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: { status: "completed" },
        })

        // Обновляем баланс пользователя
        await prisma.user.update({
          where: { id: transaction.userId },
          data: { balance: { increment: transaction.amount } },
        })

        status = "completed"
      }
    }

    return NextResponse.json({
      success: true,
      status,
      transaction: {
        id: transaction.id,
        amount: transaction.amount,
        status,
        createdAt: transaction.createdAt,
      },
    })
  } catch (error) {
    console.error("Ошибка при проверке статуса TON депозита:", error)
    return NextResponse.json({ message: "Внутренняя ошибка сервера" }, { status: 500 })
  }
}

