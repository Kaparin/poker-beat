"use client"

import { useEffect, useState } from "react"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { dashboardApi } from "@/lib/api-client"

interface StatsData {
  name: string
  users: number
  games: number
  revenue: number
}

export function Overview() {
  const [data, setData] = useState<StatsData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await dashboardApi.getDashboardData()

        if (response.error) {
          console.error("Ошибка при загрузке данных:", response.error)
          return
        }

        if (response.data && response.data.chart) {
          setData(response.data.chart)
        }
      } catch (error) {
        console.error("Ошибка при загрузке данных:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return <div>Загрузка данных...</div>
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data}>
        <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
        <Tooltip
          formatter={(value: number, name: string) => {
            if (name === "revenue") {
              return [`${value.toLocaleString()} фишек`, "Доход"]
            }
            if (name === "users") {
              return [`${value}`, "Пользователи"]
            }
            if (name === "games") {
              return [`${value}`, "Игры"]
            }
            return [value, name]
          }}
        />
        <Bar dataKey="users" fill="#adfa1d" radius={[4, 4, 0, 0]} />
        <Bar dataKey="games" fill="#2563eb" radius={[4, 4, 0, 0]} />
        <Bar dataKey="revenue" fill="#f43f5e" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

