"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Table2, CreditCard, TrendingUp } from "lucide-react"

type StatsData = {
  totalUsers: number
  activeTables: number
  pendingTransactions: number
  totalRevenue: number
}

export default function StatsCards() {
  const [stats, setStats] = useState<StatsData>({
    totalUsers: 0,
    activeTables: 0,
    pendingTransactions: 0,
    totalRevenue: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/admin/stats")

        if (!response.ok) {
          throw new Error("Failed to fetch stats")
        }

        const data = await response.json()
        setStats(data)
      } catch (error) {
        console.error("Error fetching stats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const cards = [
    {
      title: "Всего пользователей",
      value: stats.totalUsers,
      icon: <Users className="h-6 w-6 text-blue-500" />,
      description: "Зарегистрированных пользователей",
    },
    {
      title: "Активные столы",
      value: stats.activeTables,
      icon: <Table2 className="h-6 w-6 text-green-500" />,
      description: "Игровых столов в данный момент",
    },
    {
      title: "Ожидающие транзакции",
      value: stats.pendingTransactions,
      icon: <CreditCard className="h-6 w-6 text-yellow-500" />,
      description: "Требуют подтверждения",
    },
    {
      title: "Общий доход",
      value: stats.totalRevenue.toLocaleString() + " ₽",
      icon: <TrendingUp className="h-6 w-6 text-purple-500" />,
      description: "За все время",
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

