import { type NextRequest, NextResponse } from "next/server"
import { withAuth } from "@/lib/auth-middleware"
import prisma from "@/lib/prisma"

// Get user's friends
export const GET = withAuth(async (req: NextRequest, user) => {
  try {
    // Get accepted friend requests where the user is either sender or receiver
    const friendRequests = await prisma.friendRequest.findMany({
      where: {
        OR: [
          { senderId: user.id, status: "ACCEPTED" },
          { receiverId: user.id, status: "ACCEPTED" },
        ],
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            photoUrl: true,
            lastActive: true,
          },
        },
        receiver: {
          select: {
            id: true,
            username: true,
            photoUrl: true,
            lastActive: true,
          },
        },
      },
    })

    // Format friends list
    const friends = friendRequests.map((request) => {
      const isSender = request.senderId === user.id
      const friend = isSender ? request.receiver : request.sender
      const friendId = isSender ? request.receiverId : request.senderId

      // Check if friend is online (active in the last 5 minutes)
      const isOnline = friend.lastActive
        ? new Date().getTime() - new Date(friend.lastActive).getTime() < 5 * 60 * 1000
        : false

      return {
        id: request.id,
        userId: user.id,
        friendId,
        status: request.status,
        createdAt: request.createdAt,
        updatedAt: request.updatedAt,
        friend: {
          id: friend.id,
          username: friend.username,
          avatarUrl: friend.photoUrl,
          isOnline,
          lastActive: friend.lastActive,
        },
      }
    })

    return NextResponse.json({ friends })
  } catch (error) {
    console.error("Error fetching friends:", error)
    return NextResponse.json({ error: "Failed to fetch friends" }, { status: 500 })
  }
})

