import { type NextRequest, NextResponse } from "next/server"
import { withAuth } from "@/lib/auth-middleware"
import prisma from "@/lib/prisma"

// Accept a friend request
export const POST = withAuth(async (req: NextRequest, user, { params }) => {
  try {
    const requestId = Number.parseInt(params?.id as string)

    if (!requestId) {
      return NextResponse.json({ error: "Request ID is required" }, { status: 400 })
    }

    // Get the friend request
    const friendRequest = await prisma.friendRequest.findUnique({
      where: {
        id: requestId,
      },
    })

    if (!friendRequest) {
      return NextResponse.json({ error: "Friend request not found" }, { status: 404 })
    }

    // Check if the user is the receiver of the request
    if (friendRequest.receiverId !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Check if the request is pending
    if (friendRequest.status !== "PENDING") {
      return NextResponse.json({ error: "Friend request is not pending" }, { status: 400 })
    }

    // Update the friend request status
    const updatedRequest = await prisma.friendRequest.update({
      where: {
        id: requestId,
      },
      data: {
        status: "ACCEPTED",
      },
    })

    return NextResponse.json({ friendRequest: updatedRequest })
  } catch (error) {
    console.error("Error accepting friend request:", error)
    return NextResponse.json({ error: "Failed to accept friend request" }, { status: 500 })
  }
})

