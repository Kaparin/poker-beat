import { type NextRequest, NextResponse } from "next/server"
import { generateToken } from "@/lib/jwt"
import prisma from "@/lib/prisma"
import { rateLimiter } from "@/lib/rate-limiter"

export async function POST(request: NextRequest) {
  // Apply rate limiting
  const rateLimiterResponse = await rateLimiter({ maxRequests: 5, windowMs: 60 * 1000 })(request)
  if (rateLimiterResponse) return rateLimiterResponse

  try {
    const { refreshToken } = await request.json()

    if (!refreshToken) {
      return NextResponse.json({ error: "No refresh token provided" }, { status: 400 })
    }

    // Find the refresh token in the database
    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    })

    // Check if token exists and is valid
    if (!tokenRecord) {
      return NextResponse.json({ error: "Invalid refresh token" }, { status: 401 })
    }

    // Check if token is expired
    if (tokenRecord.expiresAt < new Date()) {
      return NextResponse.json({ error: "Refresh token expired" }, { status: 401 })
    }

    // Check if token is revoked
    if (tokenRecord.revokedAt) {
      return NextResponse.json({ error: "Refresh token revoked" }, { status: 401 })
    }

    // Generate a new access token
    const accessToken = generateToken({
      userId: tokenRecord.user.id,
      telegramId: tokenRecord.user.telegramId,
    })

    // Return the new access token
    return NextResponse.json({ token: accessToken })
  } catch (error) {
    console.error("Refresh token error:", error)
    return NextResponse.json({ error: "Failed to refresh token" }, { status: 500 })
  }
}

