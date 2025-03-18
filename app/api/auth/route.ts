import { type NextRequest, NextResponse } from "next/server"
import { validateTelegramWebAppData } from "@/lib/telegram-utils"
import { generateToken } from "@/lib/jwt"
import prisma from "@/lib/prisma"
import { withErrorHandling } from "@/lib/error-handler"
import { withRateLimit } from "@/lib/auth-middleware"
import { encrypt } from "@/lib/encryption"

// Apply rate limiting to prevent brute force attacks
export const POST = withRateLimit(
  withErrorHandling(async (request: NextRequest) => {
    const { initData } = await request.json()

    if (!initData) {
      return NextResponse.json({ error: "No initData provided" }, { status: 400 })
    }

    // Parse the initData
    const urlParams = new URLSearchParams(initData)
    const userDataStr = urlParams.get("user")

    if (!userDataStr) {
      return NextResponse.json({ error: "No user data provided" }, { status: 400 })
    }

    // Validate the data
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || ""
    const validation = validateTelegramWebAppData(initData, BOT_TOKEN)

    if (!validation) {
      // Log the failed authentication attempt
      console.error("Telegram authentication failed")

      return NextResponse.json({ error: "Invalid Telegram data" }, { status: 401 })
    }

    // Parse the user data
    const userData = JSON.parse(userDataStr)
    const telegramId = userData.id

    // Get client IP for security logging
    const ip = request.ip || request.headers.get("x-forwarded-for") || "unknown"
    const userAgent = request.headers.get("user-agent") || "unknown"

    // Find or create user in the database
    let user = await prisma.user.findUnique({
      where: { telegramId },
      include: {
        settings: true,
        statistics: true,
      },
    })

    if (!user) {
      // Create new user
      user = await prisma.user.create({
        data: {
          telegramId,
          firstName: userData.first_name,
          lastName: userData.last_name || null,
          username: userData.username || null,
          photoUrl: userData.photo_url || null,
          lastLoginAt: new Date(),
          lastLoginIp: encrypt(ip),
          settings: {
            create: {
              theme: "light",
              notifications: true,
              soundEffects: true,
            },
          },
          statistics: {
            create: {
              handsPlayed: 0,
              gamesPlayed: 0,
              gamesWon: 0,
              totalWinnings: 0,
              biggestWin: 0,
              currentStreak: 0,
              winRate: 0,
              level: 1,
              experience: 0,
            },
          },
        },
        include: {
          settings: true,
          statistics: true,
        },
      })

      // Log the new user creation
      await prisma.securityLog.create({
        data: {
          userId: user.id,
          action: "user_created",
          ipAddress: encrypt(ip),
          userAgent,
          details: `New user created via Telegram auth: ${user.firstName} ${user.lastName || ""}`,
        },
      })
    } else {
      // Check if user is banned
      if (user.banned) {
        // Log the banned user attempt
        await prisma.securityLog.create({
          data: {
            userId: user.id,
            action: "banned_user_login_attempt",
            ipAddress: encrypt(ip),
            userAgent,
            details: `Banned user attempted to login: ${user.banReason || "No reason provided"}`,
          },
        })

        return NextResponse.json({ error: "Your account has been suspended. Please contact support." }, { status: 403 })
      }

      // Update user data
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          firstName: userData.first_name,
          lastName: userData.last_name || null,
          username: userData.username || null,
          photoUrl: userData.photo_url || null,
          lastLoginAt: new Date(),
          lastLoginIp: encrypt(ip),
          failedLoginAttempts: 0, // Reset failed attempts on successful login
          updatedAt: new Date(),
        },
        include: {
          settings: true,
          statistics: true,
        },
      })
    }

    // Log successful login
    await prisma.securityLog.create({
      data: {
        userId: user.id,
        action: "login",
        ipAddress: encrypt(ip),
        userAgent,
        details: "Successful login via Telegram",
      },
    })

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      telegramId: user.telegramId,
    })

    // Generate refresh token
    const refreshToken = crypto.randomBytes(64).toString("hex")

    // Calculate expiration date (7 days from now)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    // Store refresh token in database
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt,
      },
    })

    // Return user data and token
    return NextResponse.json({
      user: {
        id: user.id,
        telegramId: user.telegramId,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        photoUrl: user.photoUrl,
        inGameName: user.inGameName,
        balance: user.balance,
        tonBalance: user.tonBalance,
        settings: user.settings,
        statistics: user.statistics,
        role: user.role || "user",
      },
      token,
      refreshToken,
    })
  }),
  10, // 10 requests max
  60000, // per minute
)

