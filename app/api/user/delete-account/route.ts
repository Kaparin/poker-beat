import { type NextRequest, NextResponse } from "next/server"
import { withAuth } from "@/lib/auth-middleware"
import prisma from "@/lib/prisma"
import { revokeToken } from "@/lib/jwt"
import { encrypt } from "@/lib/encryption"
import { sendTelegramNotification } from "@/lib/telegram-notifications"

export const POST = withAuth(async (req: NextRequest, user, token) => {
  try {
    // Get client IP for security logging
    const ip = req.ip || req.headers.get("x-forwarded-for") || "unknown"
    const userAgent = req.headers.get("user-agent") || "unknown"

    // Mark the account for deletion
    await prisma.user.update({
      where: { id: user.id },
      data: {
        deletionRequested: true,
        deletionRequestedAt: new Date(),
      },
    })

    // Log the deletion request
    await prisma.securityLog.create({
      data: {
        userId: user.id,
        action: "account_deletion_requested",
        ipAddress: encrypt(ip),
        userAgent,
        details: "User requested account deletion under GDPR",
      },
    })

    // Revoke the user's token
    revokeToken(token)

    // Send confirmation to the user
    await sendTelegramNotification(
      user.telegramId,
      `Your account deletion request has been received. Your data will be deleted within 30 days. If you wish to cancel this request, please contact support.`,
    )

    return NextResponse.json({
      success: true,
      message: "Account deletion request received. Your data will be deleted within 30 days.",
    })
  } catch (error) {
    console.error("Error requesting account deletion:", error)
    return NextResponse.json({ error: "Failed to process account deletion request" }, { status: 500 })
  }
})

