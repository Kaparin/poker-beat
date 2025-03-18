"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, AlertTriangle, Ban, Clock } from "lucide-react"

type SecurityStats = {
  bannedUsersCount: number
  failedLoginsCount: number
  rateLimitCount: number
  suspiciousActionsCount: number
}

export default function SecurityStatsCards() {
  const [stats, setStats] = useState<SecurityStats>({
    bannedUsersCount: 0,
    failedLoginsCount: 0,
    rateLimitCount: 0,
    suspiciousActionsCount: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/admin/security/dashboard")

        if (!response.ok) {
          throw new Error("Failed to fetch security stats")
        }

        const data = await response.json()
        setStats(data)
      } catch (error) {
        console.error("Error fetching security stats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const cards = [
    {
      title: "Заблокированные пользователи",
      value: stats.bannedUsersCount,
      icon: <Ban className="h-6 w-6 text-red-500" />,
      description: "Всего заблокировано",
    },
    {
      title: "Неудачные входы",
      value: stats.failedLoginsCount,
      icon: <Shield className="h-6 w-6 text-yellow-500" />,
      description: "За последние 24 часа",
    },
    {
      title: "Превышения лимита",
      value: stats.rateLimitCount,
      icon: <Clock className="h-6 w-6 text-blue-500" />,
      description: "За последние 24 часа",
    },
    {
      title: "Подозрительные действия",
      value: stats.suspiciousActionsCount,
      icon: <AlertTriangle className="h-6 w-6 text-orange-500" />,
      description: "За последние 24 часа",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">{card.title}</CardTitle>
            {card.icon}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" /> : card.value}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{card.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

