import { type NextRequest, NextResponse } from "next/server"
import { withAuth } from "@/lib/auth-middleware"
import prisma from "@/lib/prisma"

// Get user game preferences
export const GET = withAuth(async (req: NextRequest, user) => {
  try {
    // Get user preferences from database
    const preferences = await prisma.userGamePreferences.findUnique({
      where: { userId: user.id },
    })

    // If no preferences exist yet, return defaults
    if (!preferences) {
      return NextResponse.json({
        preferences: {
          soundEnabled: true,
          soundVolume: 70,
          chatEnabled: true,
          showHandHistory: true,
          showSpectators: true,
          autoFoldWhenAway: true,
          confirmActions: true,
          tableBackground: "green",
          cardStyle: "classic",
        },
      })
    }

    return NextResponse.json({ preferences })
  } catch (error) {
    console.error("Error fetching game preferences:", error)
    return NextResponse.json({ error: "Failed to fetch game preferences" }, { status: 500 })
  }
})

// Update user game preferences
export const PATCH = withAuth(async (req: NextRequest, user) => {
  try {
    const updates = await req.json()

    // Validate updates
    const validFields = [
      "soundEnabled",
      "soundVolume",
      "chatEnabled",
      "showHandHistory",
      "showSpectators",
      "autoFoldWhenAway",
      "confirmActions",
      "tableBackground",
      "cardStyle",
    ]

    const validUpdates: Record<string, any> = {}

    for (const [key, value] of Object.entries(updates)) {
      if (validFields.includes(key)) {
        validUpdates[key] = value
      }
    }

    // Check if soundVolume is within valid range
    if ("soundVolume" in validUpdates && (validUpdates.soundVolume < 0 || validUpdates.soundVolume > 100)) {
      return NextResponse.json({ error: "Sound volume must be between 0 and 100" }, { status: 400 })
    }

    // Create or update preferences
    const preferences = await prisma.userGamePreferences.upsert({
      where: { userId: user.id },
      update: validUpdates,
      create: {
        userId: user.id,
        ...validUpdates,
      },
    })

    return NextResponse.json({ preferences })
  } catch (error) {
    console.error("Error updating game preferences:", error)
    return NextResponse.json({ error: "Failed to update game preferences" }, { status: 500 })
  }
})

