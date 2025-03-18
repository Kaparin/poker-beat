import { type NextRequest, NextResponse } from "next/server"
import { withAuth } from "@/lib/auth-middleware"
import prisma from "@/lib/prisma"

// Get tournament details
export const GET = withAuth(async (req: NextRequest, user, { params }) => {
  try {
    const tournamentId = params?.id

    if (!tournamentId) {
      return NextResponse.json({ error: "Tournament ID is required" }, { status: 400 })
    }

    // Get tournament from database
    const tournament = await prisma.tournament.findUnique({
      where: {
        id: tournamentId,
      },
    })

    if (!tournament) {
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 })
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

    // Get all players for this tournament
    const players = await prisma.tournamentRegistration.findMany({
      where: {
        tournamentId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            photoUrl: true,
          },
        },
      },
    })

    // Format player data
    const formattedPlayers = players.map((registration) => ({
      userId: registration.userId,
      username: registration.user.username,
      avatarUrl: registration.user.photoUrl,
      chips: registration.chips,
      tableId: registration.tableId,
      position: registration.position,
      status: registration.status,
      registeredAt: registration.registeredAt,
      eliminatedAt: registration.eliminatedAt,
      finalPosition: registration.finalPosition,
      rebuyCount: registration.rebuyCount,
      addOnCount: registration.addOnCount,
    }))

    // Parse JSON fields
    const blindLevels = JSON.parse(tournament.blindLevels as string)
    const payoutStructure = JSON.parse(tournament.payoutStructure as string)
    const rebuyOption = tournament.rebuyOption ? JSON.parse(tournament.rebuyOption as string) : null
    const addOnOption = tournament.addOnOption ? JSON.parse(tournament.addOnOption as string) : null
    const prizes = tournament.prizes ? JSON.parse(tournament.prizes as string) : null

    return NextResponse.json({
      tournament: {
        ...tournament,
        blindLevels,
        payoutStructure,
        rebuyOption,
        addOnOption,
        prizes,
        players: formattedPlayers,
      },
      isRegistered: !!registration,
    })
  } catch (error) {
    console.error("Error fetching tournament details:", error)
    return NextResponse.json({ error: "Failed to fetch tournament details" }, { status: 500 })
  }
})

// Update tournament (admin only)
export const PATCH = withAuth(async (req: NextRequest, user, { params }) => {
  // Check if user is admin
  if (!user.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  try {
    const tournamentId = params?.id

    if (!tournamentId) {
      return NextResponse.json({ error: "Tournament ID is required" }, { status: 400 })
    }

    const data = await req.json()

    // Update tournament
    const tournament = await prisma.tournament.update({
      where: {
        id: tournamentId,
      },
      data: {
        name: data.name,
        description: data.description,
        startTime: data.startTime ? new Date(data.startTime) : undefined,
        registrationStartTime: data.registrationStartTime ? new Date(data.registrationStartTime) : undefined,
        registrationEndTime: data.registrationEndTime ? new Date(data.registrationEndTime) : undefined,
        buyIn: data.buyIn,
        entryFee: data.entryFee,
        startingChips: data.startingChips,
        maxPlayers: data.maxPlayers,
        minPlayers: data.minPlayers,
        blindLevels: data.blindLevels ? JSON.stringify(data.blindLevels) : undefined,
        payoutStructure: data.payoutStructure ? JSON.stringify(data.payoutStructure) : undefined,
        lateRegistrationPeriod: data.lateRegistrationPeriod,
        rebuyOption: data.rebuyOption ? JSON.stringify(data.rebuyOption) : undefined,
        addOnOption: data.addOnOption ? JSON.stringify(data.addOnOption) : undefined,
        tableSize: data.tableSize,
        isPrivate: data.isPrivate,
        password: data.password,
        status: data.status,
        currentLevel: data.currentLevel,
        nextLevelTime: data.nextLevelTime ? new Date(data.nextLevelTime) : undefined,
        prizes: data.prizes ? JSON.stringify(data.prizes) : undefined,
        winnerId: data.winnerId,
        isFinished: data.isFinished,
      },
    })

    return NextResponse.json({ tournament })
  } catch (error) {
    console.error("Error updating tournament:", error)
    return NextResponse.json({ error: "Failed to update tournament" }, { status: 500 })
  }
})

// Delete tournament (admin only)
export const DELETE = withAuth(async (req: NextRequest, user, { params }) => {
  // Check if user is admin
  if (!user.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  try {
    const tournamentId = params?.id

    if (!tournamentId) {
      return NextResponse.json({ error: "Tournament ID is required" }, { status: 400 })
    }

    // Delete tournament
    await prisma.tournament.delete({
      where: {
        id: tournamentId,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting tournament:", error)
    return NextResponse.json({ error: "Failed to delete tournament" }, { status: 500 })
  }
})

