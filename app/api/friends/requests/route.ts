import { type NextRequest, NextResponse } from "next/server"
import { withAuth } from "@/lib/auth-middleware"
import prisma from "@/lib/prisma"

// Get pending friend requests
export const GET = withAuth(async (req: NextRequest, user) => {
  try {
    // Get pending friend requests where the user is the receiver
    const requests = await prisma.friendRequest.findMany({
      where: {
        receiverId: user.id,
        status: "PENDING",
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            photoUrl: true,
          },
        },
      },
    })

    return NextResponse.json({ requests })
  } catch (error) {
    console.error("Error fetching friend requests:", error)
    return NextResponse.json({ error: "Failed to fetch friend requests" }, { status: 500 })
  }
})

// Send a friend request
export const POST = withAuth(async (req: NextRequest, user) => {
  try {
    const { userId } = await req.json()

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Check if user exists
    const targetUser = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    })

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if user is trying to add themselves
    if (userId === user.id) {
      return NextResponse.json({ error: "Cannot add yourself as a friend" }, { status: 400 })
    }

    // Check if a friend request already exists
    const existingRequest = await prisma.friendRequest.findFirst({
      where: {
        OR: [
          { senderId: user.id, receiverId: userId },
          { senderId: userId, receiverId: user.id },
        ],
      },
    })

    if (existingRequest) {
      if (existingRequest.status === "PENDING") {
        return NextResponse.json({ error: "Friend request already sent" }, { status: 400 })
      } else if (existingRequest.status === "ACCEPTED") {
        return NextResponse.json({ error: "Already friends" }, { status: 400 })
      } else if (existingRequest.status === "BLOCKED") {
        return NextResponse.json({ error: "Cannot send friend request" }, { status: 400 })
      }
    }

    // Create friend request
    const friendRequest = await prisma.friendRequest.create({
      data: {
        senderId: user.id,
        receiverId: userId,
        status: "PENDING",
      },
    })

    return NextResponse.json({ friendRequest })
  } catch (error) {
    console.error("Error sending friend request:", error)
    return NextResponse.json({ error: "Failed to send friend request" }, { status: 500 })
  }
})

