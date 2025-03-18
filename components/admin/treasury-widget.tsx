"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDistanceToNow } from "date-fns"
import { ru } from "date-fns/locale"
import { treasuryApi } from "@/lib/api-client"

export function TreasuryWidget() {
  const [treasuryData, setTreasuryData] = useState({
    amount: 0,
    lastUpdated: new Date().toISOString(),
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTreasuryData = async () => {
      try {
        const response = await treasuryApi.getTreasuryData()

        if (response.error) {
          console.error("Ошибка при загрузке данных Treasury Pool:", response.error)
          return
        }

        if (response.data) {
          setTreasuryData({
            amount: response.data.amount,
            lastUpdated: response.data.updated_at || response.data.lastUpdated,
          })
        }
      } catch (error) {
        console.error("Ошибка при загрузке данных Treasury Pool:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchTreasuryData()
  }, [])

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Treasury Pool</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {loading ? "Загрузка..." : `${treasuryData.amount.toLocaleString()} фишек`}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {loading
            ? "Загрузка..."
            : `Обновлено ${formatDistanceToNow(new Date(treasuryData.lastUpdated), {
                addSuffix: true,
                locale: ru,
              })}`}
        </p>
      </CardContent>
    </Card>
  )
}

