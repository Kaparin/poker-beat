"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDate } from "@/lib/utils"

export default function JackpotWidget() {
  const [jackpot, setJackpot] = useState<{ amount: number; lastUpdated: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchJackpot = async () => {
      try {
        const response = await fetch("/api/jackpot")
        if (!response.ok) throw new Error("Ошибка при загрузке данных")
        const data = await response.json()
        setJackpot(data)
      } catch (error) {
        console.error("Ошибка при загрузке джекпота:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchJackpot()

    // Обновляем информацию о джекпоте каждые 5 минут
    const interval = setInterval(fetchJackpot, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Джекпот</CardTitle>
          <CardDescription>Загрузка...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Джекпот</CardTitle>
        <CardDescription>Текущий размер джекпота</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
          {jackpot?.amount.toLocaleString()} фишек
        </div>
        {jackpot?.lastUpdated && (
          <p className="text-xs text-muted-foreground mt-1">Обновлено: {formatDate(jackpot.lastUpdated)}</p>
        )}
      </CardContent>
    </Card>
  )
}

