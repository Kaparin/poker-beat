"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { dashboardApi } from "@/lib/api-client"

export function ActiveTournamentsWidget() {
  const [tournamentsData, setTournamentsData] = useState({
    activeTournaments: 0,
    registeredPlayers: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTournamentsData = async () => {
      try {
        const response = await dashboardApi.getActiveTournamentsData()

        if (response.error) {
          console.error("Ошибка при загрузке данных о турнирах:", response.error)
          return
        }

        if (response.data) {
          setTournamentsData(response.data)
        }
      } catch (error) {
        console.error("Ошибка при загрузке данных о турнирах:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchTournamentsData()
  }, [])

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Активные турниры</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{loading ? "Загрузка..." : tournamentsData.activeTournaments}</div>
        <p className="text-xs text-muted-foreground mt-1">
          {loading ? "Загрузка..." : `${tournamentsData.registeredPlayers} зарегистрированных игроков`}
        </p>
      </CardContent>
    </Card>
  )
}

