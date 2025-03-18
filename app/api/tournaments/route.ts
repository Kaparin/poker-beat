import { type NextRequest, NextResponse } from "next/server"
import { withAuth } from "@/lib/auth-middleware"
import prisma from "@/lib/prisma"

// Get all tournaments
export const GET = withAuth(async (req: NextRequest, user) => {
  try {
    // Get tournaments from database
    const tournaments = await prisma.tournament.findMany({
      orderBy: {
        startTime: "asc",
      },
    })

    // Get registered tournaments for the user
    const registrations = await prisma.tournamentRegistration.findMany({
      where: {
        userId: user.id,
      },
      select: {
        tournamentId: true,
      },
    })

    const registeredTournamentIds = registrations.map((reg) => reg.tournamentId)

    // Format tournaments with player information
    const formattedTournaments = await Promise.all(
      tournaments.map(async (tournament) => {
        // Get players for this tournament
        const players = await prisma.tournamentRegistration.findMany({
          where: {
            tournamentId: tournament.id,
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

        return {
          ...tournament,
          blindLevels,
          payoutStructure,
          rebuyOption,
          addOnOption,
          prizes,
          players: formattedPlayers,
          isRegistered: registeredTournamentIds.includes(tournament.id),
        }
      }),
    )

    return NextResponse.json({ tournaments: formattedTournaments })
  } catch (error) {
    console.error("Error fetching tournaments:", error)
    return NextResponse.json({ error: "Failed to fetch tournaments" }, { status: 500 })
  }
})

// Create a new tournament (admin only)
export const POST = withAuth(async (req: NextRequest, user) => {
  // Check if user is admin
  if (!user.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  try {
    const data = await req.json()

    // Validate required fields
    const requiredFields = [
      "name",
      "startTime",
      "registrationStartTime",
      "registrationEndTime",
      "buyIn",
      "entryFee",
      "startingChips",
      "maxPlayers",
      "minPlayers",
      "blindLevels",
      "payoutStructure",
      "tableSize",
    ]

    for (const field of requiredFields) {
      if (!data[field]) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 })
      }
    }

    // Create tournament
    const tournament = await prisma.tournament.create({
      data: {
        name: data.name,
        description: data.description,
        startTime: new Date(data.startTime),
        registrationStartTime: new Date(data.registrationStartTime),
        registrationEndTime: new Date(data.registrationEndTime),
        buyIn: data.buyIn,
        entryFee: data.entryFee,
        startingChips: data.startingChips,
        maxPlayers: data.maxPlayers,
        minPlayers: data.minPlayers,
        blindLevels: JSON.stringify(data.blindLevels),
        payoutStructure: JSON.stringify(data.payoutStructure),
        lateRegistrationPeriod: data.lateRegistrationPeriod,
        rebuyOption: data.rebuyOption ? JSON.stringify(data.rebuyOption) : null,
        addOnOption: data.addOnOption ? JSON.stringify(data.addOnOption) : null,
        tableSize: data.tableSize,
        isPrivate: data.isPrivate || false,
        password: data.password,
        status: "SCHEDULED",
      },
    })

    return NextResponse.json({ tournament })
  } catch (error) {
    console.error("Error creating tournament:", error)
    return NextResponse.json({ error: "Failed to create tournament" }, { status: 500 })
  }
})

