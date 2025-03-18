import { type NextRequest, NextResponse } from "next/server"
import { withAuth } from "@/lib/auth-middleware"
import prisma from "@/lib/prisma"

// Register for a tournament
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

    // Check if registration is open
    if (tournament.status !== "REGISTRATION_OPEN") {
      return NextResponse.json({ error: "Registration is not open for this tournament" }, { status: 400 })
    }

    // Check if tournament is full
    const registrationCount = await prisma.tournamentRegistration.count({
      where: {
        tournamentId,
      },
    })

    if (registrationCount >= tournament.maxPlayers) {
      return NextResponse.json({ error: "Tournament is full" }, { status: 400 })
    }

    // Check if user is already registered
    const existingRegistration = await prisma.tournamentRegistration.findUnique({
      where: {
        tournamentId_userId: {
          tournamentId,
          userId: user.id,
        },
      },
    })

    if (existingRegistration) {
      return NextResponse.json({ error: "You are already registered for this tournament" }, { status: 400 })
    }

    // Check if user has enough balance
    const totalCost = tournament.buyIn + tournament.entryFee

    if (user.balance < totalCost) {
      return NextResponse.json({ error: "Insufficient balance" }, { status: 400 })
    }

    // Check password for private tournaments
    if (tournament.isPrivate) {
      const { password } = await req.json()

      if (!password || password !== tournament.password) {
        return NextResponse.json({ error: "Invalid tournament password" }, { status: 400 })
      }
    }

    // Create transaction for tournament entry
    const transaction = await prisma.transaction.create({
      data: {
        userId: user.id,
        type: "tournament_entry",
        amount: -totalCost,
        status: "completed",
        description: `Entry fee for tournament: ${tournament.name}`,
      },
    })

    // Update user balance
    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        balance: {
          decrement: totalCost,
        },
      },
    })

    // Register user for tournament
    const registration = await prisma.tournamentRegistration.create({
      data: {
        tournamentId,
        userId: user.id,
        chips: tournament.startingChips,
        status: "REGISTERED",
      },
    })

    return NextResponse.json({ registration })
  } catch (error) {
    console.error("Error registering for tournament:", error)
    return NextResponse.json({ error: "Failed to register for tournament" }, { status: 500 })
  }
})

