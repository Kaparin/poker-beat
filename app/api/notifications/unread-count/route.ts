import { type NextRequest, NextResponse } from "next/server"
import { withAuth } from "@/lib/auth-middleware"
import prisma from "@/lib/prisma"

// Get unread notification count
export const GET = withAuth(async (req: NextRequest, user) => {
  try {
    // Count unread notifications
    const count = await prisma.notification.count({
      where: {
        userId: user.id,
        read: false,
      },
    })

    return NextResponse.json({ count })
  } catch (error) {
    console.error("Error fetching unread notification count:", error)
    return NextResponse.json({ error: "Failed to fetch unread notification count" }, { status: 500 })
  }
})

