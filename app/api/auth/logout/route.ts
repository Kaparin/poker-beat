import { type NextRequest, NextResponse } from "next/server"
import { withAuth } from "@/lib/auth-middleware"
import prisma from "@/lib/prisma"

export const POST = withAuth(async (req: NextRequest, user) => {
  try {
    const { refreshToken } = await req.json()

    if (!refreshToken) {
      return NextResponse.json({ error: "No refresh token provided" }, { status: 400 })
    }

    // Find the refresh token in the database
    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    })

    // Check if token exists and belongs to the user
    if (!tokenRecord || tokenRecord.userId !== user.id) {
      return NextResponse.json({ error: "Invalid refresh token" }, { status: 401 })
    }

    // Revoke the token
    await prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: { revokedAt: new Date() },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json({ error: "Failed to logout" }, { status: 500 })
  }
})

