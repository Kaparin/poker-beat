"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { Trophy, TrendingUp, TrendingDown, Minus, Loader2 } from "lucide-react"
import type { Leaderboard } from "@/types/statistics"

export function LeaderboardTable() {
  const { token, user } = useAuth()
  const [leaderboard, setLeaderboard] = useState<Leaderboard | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [timeframe, setTimeframe] = useState<"daily" | "weekly" | "monthly" | "allTime">("weekly")
  const [category, setCategory] = useState<"cashGames" | "tournaments" | "overall">("overall")

  // Fetch leaderboard data when timeframe or category changes
  useEffect(() => {
    if (token) {
      fetchLeaderboard()
    }
  }, [token, timeframe, category])

  const fetchLeaderboard = async () => {
    if (!token) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/leaderboard?timeframe=${timeframe}&category=${category}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch leaderboard")
      }

      const data = await response.json()
      setLeaderboard(data.leaderboard)
    } catch (error) {
      console.error("Error fetching leaderboard:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить таблицу лидеров",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getPositionColor = (position: number) => {
    if (position === 1) return "text-yellow-500"
    if (position === 2) return "text-gray-400"
    if (position === 3) return "text-amber-600"
    return ""
  }

  const getPositionIcon = (position: number) => {
    if (position === 1) return <Trophy className="h-5 w-5 text-yellow-500" />
    if (position === 2) return <Trophy className="h-5 w-5 text-gray-400" />
    if (position === 3) return <Trophy className="h-5 w-5 text-amber-600" />
    return <span className="text-gray-500">{position}</span>
  }

  const getChangeIcon = (change?: number) => {
    if (!change) return <Minus className="h-4 w-4 text-gray-400" />
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-500" />
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-500" />
    return <Minus className="h-4 w-4 text-gray-400" />
  }

  const formatValue = (value: number, category: string) => {
    if (category === "cashGames" || category === "tournaments") {
      return value.toLocaleString()
    } else {
      return value.toLocaleString()
    }
  }

  const getCategoryLabel = () => {
    switch (category) {
      case "cashGames":
        return "Кэш-игры"
      case "tournaments":
        return "Турниры"
      case "overall":
        return "Общий"
      default:
        return "Общий"
    }
  }

  const getTimeframeLabel = () => {
    switch (timeframe) {
      case "daily":
        return "За день"
      case "weekly":
        return "За неделю"
      case "monthly":
        return "За месяц"
      case "allTime":
        return "За все время"
      default:
        return "За неделю"
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!leaderboard) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <p>Не удалось загрузить таблицу лидеров</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center">
          <Trophy className="h-6 w-6 mr-2" />
          Таблица лидеров
        </h2>
        <div className="text-sm text-gray-500">Обновлено: {new Date(leaderboard.lastUpdated).toLocaleString()}</div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-grow">
          <Badge variant="outline" className="text-base font-normal">
            {getTimeframeLabel()} - {getCategoryLabel()}
          </Badge>
        </div>

        <div className="flex gap-2">
          <Select value={timeframe} onValueChange={(value) => setTimeframe(value as any)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Период" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">За день</SelectItem>
              <SelectItem value="weekly">За неделю</SelectItem>
              <SelectItem value="monthly">За месяц</SelectItem>
              <SelectItem value="allTime">За все время</SelectItem>
            </SelectContent>
          </Select>

          <Select value={category} onValueChange={(value) => setCategory(value as any)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Категория" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="overall">Общий рейтинг</SelectItem>
              <SelectItem value="cashGames">Кэш-игры</SelectItem>
              <SelectItem value="tournaments">Турниры</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Место</TableHead>
              <TableHead>Игрок</TableHead>
              <TableHead className="text-right">Очки</TableHead>
              <TableHead className="w-[100px] text-center">Изменение</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leaderboard.entries.map((entry) => (
              <TableRow key={entry.userId} className={entry.userId === user?.id ? "bg-primary/10" : ""}>
                <TableCell className="font-medium">
                  <div className="flex items-center">{getPositionIcon(entry.position)}</div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <Avatar className="h-8 w-8 mr-2">
                      <AvatarImage src={entry.avatarUrl || ""} alt={entry.username} />
                      <AvatarFallback>{entry.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">
                        {entry.username}
                        {entry.userId === user?.id && <span className="ml-2 text-primary">(Вы)</span>}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right font-medium">{formatValue(entry.value, category)}</TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center">
                    {getChangeIcon(entry.change)}
                    {entry.change !== 0 && (
                      <span
                        className={`ml-1 ${entry.change > 0 ? "text-green-500" : entry.change < 0 ? "text-red-500" : ""}`}
                      >
                        {Math.abs(entry.change || 0)}
                      </span>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}

            {leaderboard.entries.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                  Нет данных для отображения
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

