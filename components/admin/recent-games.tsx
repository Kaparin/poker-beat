"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"
import { ru } from "date-fns/locale"
import { dashboardApi } from "@/lib/api-client"

interface Game {
  id: string
  tableId: string
  tableName: string
  gameType: "cash" | "tournament"
  blinds: string
  players: number
  potSize: number
  endedAt: string
}

export function RecentGames() {
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const response = await dashboardApi.getRecentGames()

        if (response.error) {
          console.error("Ошибка при загрузке игр:", response.error)
          return
        }

        if (response.data) {
          setGames(response.data)
        }
      } catch (error) {
        console.error("Ошибка при загрузке игр:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchGames()
  }, [])

  if (loading) {
    return <div>Загрузка игр...</div>
  }

  return (
    <div className="space-y-4">
      {games.map((game) => (
        <div key={game.id} className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">{game.tableName}</p>
            <div className="flex items-center space-x-2 mt-1">
              <Badge variant={game.gameType === "cash" ? "default" : "secondary"}>
                {game.gameType === "cash" ? "Кэш" : "Турнир"}
              </Badge>
              <span className="text-xs text-muted-foreground">Блайнды: {game.blinds}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium">{game.potSize.toLocaleString()} фишек</p>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(game.endedAt), { addSuffix: true, locale: ru })}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

