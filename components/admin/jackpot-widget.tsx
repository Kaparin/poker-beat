"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDistanceToNow } from "date-fns"
import { ru } from "date-fns/locale"
import { jackpotApi } from "@/lib/api-client"

export function JackpotWidget() {
  const [jackpotData, setJackpotData] = useState({
    amount: 0,
    lastUpdated: new Date().toISOString(),
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchJackpotData = async () => {
      try {
        const response = await jackpotApi.getJackpotData()

        if (response.error) {
          console.error("Ошибка при загрузке данных джекпота:", response.error)
          return
        }

        if (response.data) {
          setJackpotData({
            amount: response.data.amount,
            lastUpdated: response.data.updated_at || response.data.lastUpdated,
          })
        }
      } catch (error) {
        console.error("Ошибка при загрузке данных джекпота:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchJackpotData()
  }, [])

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Джекпот</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {loading ? "Загрузка..." : `${jackpotData.amount.toLocaleString()} фишек`}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {loading
            ? "Загрузка..."
            : `Обновлено ${formatDistanceToNow(new Date(jackpotData.lastUpdated), {
                addSuffix: true,
                locale: ru,
              })}`}
        </p>
      </CardContent>
    </Card>
  )
}

