import { type NextRequest, NextResponse } from "next/server"
import { withAuth } from "@/lib/auth-middleware"
import prisma from "@/lib/prisma"

// Remove a friend
export const DELETE = withAuth(async (req: NextRequest, user, { params }) => {
  try {
    const friendId = Number.parseInt(params?.id as string)

    if (!friendId) {
      return NextResponse.json({ error: "Friend ID is required" }, { status: 400 })
    }

    // Find the friend request
    const friendRequest = await prisma.friendRequest.findFirst({
      where: {
        OR: [
          { senderId: user.id, receiverId: friendId, status: "ACCEPTED" },
          { senderId: friendId, receiverId: user.id, status: "ACCEPTED" },
        ],
      },
    })

    if (!friendRequest) {
      return NextResponse.json({ error: "Friend not found" }, { status: 404 })
    }

    // Delete the friend request
    await prisma.friendRequest.delete({
      where: {
        id: friendRequest.id,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error removing friend:", error)
    return NextResponse.json({ error: "Failed to remove friend" }, { status: 500 })
  }
})

