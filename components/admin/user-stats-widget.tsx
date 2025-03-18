"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { dashboardApi } from "@/lib/api-client"

export function UserStatsWidget() {
  const [userData, setUserData] = useState({
    totalUsers: 0,
    activeUsers: 0,
    newUsersToday: 0,
    onlineUsers: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await dashboardApi.getUserStatsData()

        if (response.error) {
          console.error("Ошибка при загрузке данных о пользователях:", response.error)
          return
        }

        if (response.data) {
          setUserData(response.data)
        }
      } catch (error) {
        console.error("Ошибка при загрузке данных о пользователях:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [])

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Всего пользователей</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{loading ? "Загрузка..." : userData.totalUsers.toLocaleString()}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Активные пользователи</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{loading ? "Загрузка..." : userData.activeUsers.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {loading
              ? "Загрузка..."
              : `${Math.round((userData.activeUsers / userData.totalUsers) * 100)}% от общего числа`}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Новые пользователи сегодня</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{loading ? "Загрузка..." : userData.newUsersToday}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Онлайн сейчас</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{loading ? "Загрузка..." : userData.onlineUsers}</div>
        </CardContent>
      </Card>
    </>
  )
}

