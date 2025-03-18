import { type NextRequest, NextResponse } from "next/server"
import { withAuth } from "@/lib/auth-middleware"
import prisma from "@/lib/prisma"

// Unregister from a tournament
export const POST = withAuth(async (req: NextRequest, user, { params }) => {
  try {
    const tournamentId = params?.id

    if (!tournamentId) {
      return NextResponse.json({ error: "Tournament ID is required" }, { status: 400 })
    }

    // Get tournament details
    const tournament = await prisma.tournament.findUnique({
      where: {
        id: tournamentId,
      },
    })

    if (!tournament) {
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 })
    }

    // Check if tournament has already started
    if (["RUNNING", "BREAK", "FINAL_TABLE"].includes(tournament.status)) {
      return NextResponse.json(
        { error: "Cannot unregister from a tournament that has already started" },
        { status: 400 },
      )
    }

    // Check if user is registered
    const registration = await prisma.tournamentRegistration.findUnique({
      where: {
        tournamentId_userId: {
          tournamentId,
          userId: user.id,
        },
      },
    })

    if (!registration) {
      return NextResponse.json({ error: "You are not registered for this tournament" }, { status: 400 })
    }

    // Calculate refund amount (may include a cancellation fee)
    const refundAmount = tournament.buyIn + tournament.entryFee

    // Create transaction for refund
    const transaction = await prisma.transaction.create({
      data: {
        userId: user.id,
        type: "tournament_refund",
        amount: refundAmount,
        status: "completed",
        description: `Refund for tournament: ${tournament.name}`,
      },
    })

    // Update user balance
    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        balance: {
          increment: refundAmount,
        },
      },
    })

    // Delete registration
    await prisma.tournamentRegistration.delete({
      where: {
        tournamentId_userId: {
          tournamentId,
          userId: user.id,
        },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error unregistering from tournament:", error)
    return NextResponse.json({ error: "Failed to unregister from tournament" }, { status: 500 })
  }
})

