import { type NextRequest, NextResponse } from "next/server"
import { withAuth } from "@/lib/auth-middleware"
import prisma from "@/lib/prisma"

// Clear all notifications
export const DELETE = withAuth(async (req: NextRequest, user) => {
  try {
    // Delete all notifications for the user
    await prisma.notification.deleteMany({
      where: {
        userId: user.id,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error clearing all notifications:", error)
    return NextResponse.json({ error: "Failed to clear all notifications" }, { status: 500 })
  }
})

