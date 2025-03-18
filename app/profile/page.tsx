"use client"

import { useState, useEffect } from "react"
import { ProfileCard } from "@/components/profile/profile-card"
import { AchievementsList } from "@/components/achievements/achievements-list"
import { HandHistoryList } from "@/components/profile/hand-history-list"
import { LeaderboardTable } from "@/components/leaderboard/leaderboard-table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import type { PlayerStatistics } from "@/types/statistics"

export default function ProfilePage() {
  const { token, user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [statistics, setStatistics] = useState<PlayerStatistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    if (!authLoading && !token) {
      router.push("/")
    } else if (!authLoading && token) {
      fetchStatistics()
    }
  }, [authLoading, token, router])

  const fetchStatistics = async () => {
    if (!token) return

    try {
      const response = await fetch("/api/profile/statistics", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch statistics")
      }

      const data = await response.json()
      setStatistics(data.statistics)
    } catch (error) {
      console.error("Error fetching statistics:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить статистику профиля",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateUsername = async (username: string) => {
    if (!token) return

    const response = await fetch("/api/profile/update-username", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ username }),
    })

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error || "Failed to update username")
    }

    // Refresh user data
    window.location.reload()
  }

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!statistics) {
    return (
      <div className="container max-w-7xl mx-auto p-4 pb-20">
        <div className="text-center py-12">
          <h2 className="text-xl font-bold mb-4">Не удалось загрузить данные профиля</h2>
          <p className="text-gray-500">Пожалуйста, попробуйте обновить страницу</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-7xl mx-auto p-4 pb-20">
      <div className="mb-8">
        <ProfileCard statistics={statistics} onUpdateUsername={handleUpdateUsername} />
      </div>

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 mb-8">
          <TabsTrigger value="overview">Достижения</TabsTrigger>
          <TabsTrigger value="history">История рук</TabsTrigger>
          <TabsTrigger value="leaderboard">Рейтинг</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-0">
          <AchievementsList />
        </TabsContent>

        <TabsContent value="history" className="mt-0">
          <HandHistoryList />
        </TabsContent>

        <TabsContent value="leaderboard" className="mt-0">
          <LeaderboardTable />
        </TabsContent>
      </Tabs>
    </div>
  )
}

