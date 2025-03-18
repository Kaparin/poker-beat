"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { dashboardApi } from "@/lib/api-client"

export function ActiveTablesWidget() {
  const [tablesData, setTablesData] = useState({
    activeTables: 0,
    activePlayers: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTablesData = async () => {
      try {
        const response = await dashboardApi.getActiveTablesData()

        if (response.error) {
          console.error("Ошибка при загрузке данных о столах:", response.error)
          return
        }

        if (response.data) {
          setTablesData(response.data)
        }
      } catch (error) {
        console.error("Ошибка при загрузке данных о столах:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchTablesData()
  }, [])

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Активные столы</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{loading ? "Загрузка..." : tablesData.activeTables}</div>
        <p className="text-xs text-muted-foreground mt-1">
          {loading ? "Загрузка..." : `${tablesData.activePlayers} активных игроков`}
        </p>
      </CardContent>
    </Card>
  )
}

