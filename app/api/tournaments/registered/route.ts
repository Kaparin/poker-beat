import { type NextRequest, NextResponse } from "next/server"
import { withAuth } from "@/lib/auth-middleware"
import prisma from "@/lib/prisma"

// Get tournaments the user is registered for
export const GET = withAuth(async (req: NextRequest, user) => {
  try {
    // Get user's tournament registrations
    const registrations = await prisma.tournamentRegistration.findMany({
      where: {
        userId: user.id,
      },
      select: {
        tournamentId: true,
      },
    })

    const tournamentIds = registrations.map((reg) => reg.tournamentId)

    return NextResponse.json({ tournamentIds })
  } catch (error) {
    console.error("Error fetching registered tournaments:", error)
    return NextResponse.json({ error: "Failed to fetch registered tournaments" }, { status: 500 })
  }
})

