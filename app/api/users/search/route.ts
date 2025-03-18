import { type NextRequest, NextResponse } from "next/server"
import { withAuth } from "@/lib/auth-middleware"
import prisma from "@/lib/prisma"

// Search users
export const GET = withAuth(async (req: NextRequest, user) => {
  try {
    const searchQuery = req.nextUrl.searchParams.get("q")

    if (!searchQuery) {
      return NextResponse.json({ error: "Search query is required" }, { status: 400 })
    }

    // Search users by username
    const users = await prisma.user.findMany({
      where: {
        username: {
          contains: searchQuery,
          mode: "insensitive",
        },
        isActive: true,
      },
      select: {
        id: true,
        username: true,
        photoUrl: true,
      },
      take: 10,
    })

    // Get friend status for each user
    const usersWithFriendStatus = await Promise.all(
      users.map(async (foundUser) => {
        // Skip if the user is the current user
        if (foundUser.id === user.id) {
          return {
            ...foundUser,
            friendStatus: null,
          }
        }

        // Check if there's a friend request between the users
        const friendRequest = await prisma.friendRequest.findFirst({
          where: {
            OR: [
              { senderId: user.id, receiverId: foundUser.id },
              { senderId: foundUser.id, receiverId: user.id },
            ],
          },
        })

        return {
          ...foundUser,
          friendStatus: friendRequest?.status || null,
        }
      }),
    )

    return NextResponse.json({ users: usersWithFriendStatus })
  } catch (error) {
    console.error("Error searching users:", error)
    return NextResponse.json({ error: "Failed to search users" }, { status: 500 })
  }
})

