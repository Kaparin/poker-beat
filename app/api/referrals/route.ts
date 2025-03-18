import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import crypto from "crypto"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ message: "Не авторизован" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ message: "ID пользователя не указан" }, { status: 400 })
    }

    // Получаем пользователя
    const user = await prisma.user.findUnique({
      where: { id: Number.parseInt(userId) },
    })

    if (!user) {
      return NextResponse.json({ message: "Пользователь не найден" }, { status: 404 })
    }

    // Получаем или создаем реферальный код
    let referralProfile = await prisma.referralProfile.findUnique({
      where: { userId: Number.parseInt(userId) },
    })

    if (!referralProfile) {
      // Создаем реферальный код
      const referralCode = generateReferralCode(user.username)

      referralProfile = await prisma.referralProfile.create({
        data: {
          userId: Number.parseInt(userId),
          referralCode,
          totalEarnings: 0,
        },
      })
    }

    // Получаем рефералов пользователя
    const referrals = await prisma.referral.findMany({
      where: { referrerId: Number.parseInt(userId) },
      include: {
        referredUser: {
          select: {
            username: true,
            lastActive: true,
          },
        },
      },
    })

    // Форматируем данные для ответа
    const formattedReferrals = referrals.map((ref) => {
      const isActive = ref.referredUser.lastActive
        ? new Date(ref.referredUser.lastActive) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        : false

      return {
        id: ref.id,
        referredUserId: ref.referredUserId,
        referredUsername: ref.referredUser.username,
        status: isActive ? "active" : "inactive",
        registeredAt: ref.createdAt,
        earnings: ref.earnings,
      }
    })

    // Считаем активных рефералов
    const activeReferrals = formattedReferrals.filter((ref) => ref.status === "active").length

    return NextResponse.json({
      success: true,
      referralCode: referralProfile.referralCode,
      totalEarnings: referralProfile.totalEarnings,
      activeReferrals,
      referrals: formattedReferrals,
    })
  } catch (error) {
    console.error("Ошибка при получении данных реферальной программы:", error)
    return NextResponse.json({ message: "Внутренняя ошибка сервера" }, { status: 500 })
  }
}

// Функция для генерации реферального кода
function generateReferralCode(username: string): string {
  // Берем первые 3 символа имени пользователя
  const prefix = username.substring(0, 3).toUpperCase()

  // Генерируем случайную строку
  const randomBytes = crypto.randomBytes(4)
  const randomString = randomBytes.toString("hex").toUpperCase()

  return `${prefix}-${randomString}`
}

