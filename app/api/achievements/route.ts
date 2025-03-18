import { type NextRequest, NextResponse } from "next/server"
import { withAuth } from "@/lib/auth-middleware"
import prisma from "@/lib/prisma"

// Get user achievements
export const GET = withAuth(async (req: NextRequest, user) => {
  try {
    // Get all achievements
    const allAchievements = await prisma.achievement.findMany()

    // Get user's unlocked achievements
    const userAchievements = await prisma.userAchievement.findMany({
      where: {
        userId: user.id,
      },
      include: {
        achievement: true,
      },
    })

    // Format achievements with unlock status
    const formattedAchievements = allAchievements.map((achievement) => {
      const userAchievement = userAchievements.find((ua) => ua.achievementId === achievement.id)

      return {
        id: achievement.id,
        name: achievement.name,
        description: achievement.description,
        icon: achievement.icon,
        category: achievement.category,
        isUnlocked: !!userAchievement,
        unlockedAt: userAchievement?.unlockedAt || null,
        progress: userAchievement?.progress || 0,
        maxProgress: achievement.threshold,
      }
    })

    return NextResponse.json({ achievements: formattedAchievements })
  } catch (error) {
    console.error("Error fetching achievements:", error)
    return NextResponse.json({ error: "Failed to fetch achievements" }, { status: 500 })
  }
})

