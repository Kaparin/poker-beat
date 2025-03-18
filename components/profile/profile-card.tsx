"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { Edit, Trophy, Award, Wallet, Calendar, User, Check } from "lucide-react"
import { format } from "date-fns"
import { ru } from "date-fns/locale"
import type { PlayerStatistics, PlayerRank } from "@/types/statistics"

interface ProfileCardProps {
  statistics: PlayerStatistics
  onUpdateUsername?: (username: string) => Promise<void>
}

export function ProfileCard({ statistics, onUpdateUsername }: ProfileCardProps) {
  const { user } = useAuth()
  const [isEditingUsername, setIsEditingUsername] = useState(false)
  const [newUsername, setNewUsername] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleUpdateUsername = async () => {
    if (!newUsername.trim() || !onUpdateUsername) return

    setIsSubmitting(true)
    try {
      await onUpdateUsername(newUsername)
      setIsEditingUsername(false)
      toast({
        title: "Успешно",
        description: "Имя пользователя обновлено",
      })
    } catch (error) {
      console.error("Error updating username:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось обновить имя пользователя",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getRankColor = (rank: PlayerRank) => {
    switch (rank) {
      case "BEGINNER":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
      case "AMATEUR":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "INTERMEDIATE":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
      case "ADVANCED":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
      case "EXPERT":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300"
      case "MASTER":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      case "GRANDMASTER":
        return "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300"
      case "LEGEND":
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
    }
  }

  const getRankLabel = (rank: PlayerRank) => {
    switch (rank) {
      case "BEGINNER":
        return "Новичок"
      case "AMATEUR":
        return "Любитель"
      case "INTERMEDIATE":
        return "Средний"
      case "ADVANCED":
        return "Продвинутый"
      case "EXPERT":
        return "Эксперт"
      case "MASTER":
        return "Мастер"
      case "GRANDMASTER":
        return "Гроссмейстер"
      case "LEGEND":
        return "Легенда"
      default:
        return rank
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center">
            <Avatar className="h-16 w-16 mr-4">
              <AvatarImage src={user?.photoUrl || ""} alt={user?.username} />
              <AvatarFallback>{user?.username?.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center">
                <CardTitle className="text-2xl">{user?.username}</CardTitle>
                {onUpdateUsername && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="ml-2 h-8 w-8"
                    onClick={() => {
                      setNewUsername(user?.username || "")
                      setIsEditingUsername(true)
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <CardDescription className="flex items-center mt-1">
                <Calendar className="h-4 w-4 mr-1" />С нами с{" "}
                {format(new Date(user?.createdAt || new Date()), "MMMM yyyy", { locale: ru })}
              </CardDescription>
            </div>
          </div>

          <div className="flex flex-col items-start md:items-end">
            <Badge className={`${getRankColor(statistics.rank)} mb-2`}>{getRankLabel(statistics.rank)}</Badge>
            <div className="flex items-center text-sm text-gray-500">
              <Trophy className="h-4 w-4 mr-1" />
              {statistics.rankingPoints} очков рейтинга
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium mb-3 flex items-center">
              <Trophy className="h-5 w-5 mr-2 text-primary" />
              Общая статистика
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Сыграно игр:</span>
                <span className="font-medium">{statistics.gamesPlayed}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Выиграно игр:</span>
                <span className="font-medium">{statistics.gamesWon}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Процент побед:</span>
                <span className="font-medium">
                  {statistics.gamesPlayed > 0
                    ? `${Math.round((statistics.gamesWon / statistics.gamesPlayed) * 100)}%`
                    : "0%"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Сыграно рук:</span>
                <span className="font-medium">{statistics.handsPlayed}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500">Выиграно рук:</span>
                <span className="font-medium">{statistics.handsWon}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Самый большой банк:</span>
                <span className="font-medium">{statistics.biggestPot}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Самый большой выигрыш:</span>
                <span className="font-medium">{statistics.biggestWin}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-3 flex items-center">
              <Award className="h-5 w-5 mr-2 text-primary" />
              Турнирная статистика
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Сыграно турниров:</span>
                <span className="font-medium">{statistics.tournamentStats.tournamentsPlayed}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Выиграно турниров:</span>
                <span className="font-medium">{statistics.tournamentStats.tournamentsWon}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Попаданий в призы:</span>
                <span className="font-medium">{statistics.tournamentStats.tournamentsInMoney}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Лучший результат:</span>
                <span className="font-medium">
                  {statistics.tournamentStats.bestFinish
                    ? `${statistics.tournamentStats.bestFinish} место`
                    : "Нет данных"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Средний результат:</span>
                <span className="font-medium">
                  {statistics.tournamentStats.averageFinish
                    ? `${statistics.tournamentStats.averageFinish} место`
                    : "Нет данных"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Выигрыш в турнирах:</span>
                <span className="font-medium">{statistics.tournamentStats.totalTournamentWinnings}</span>
              </div>
            </div>
          </div>
        </div>

        <Separator className="my-6" />

        <div>
          <h3 className="text-lg font-medium mb-3 flex items-center">
            <Wallet className="h-5 w-5 mr-2 text-primary" />
            Финансовая статистика
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
              <div className="text-sm text-gray-500 dark:text-gray-400">Общий выигрыш</div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{statistics.totalWinnings}</div>
            </div>
            <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20">
              <div className="text-sm text-gray-500 dark:text-gray-400">Общий проигрыш</div>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">{statistics.totalLosses}</div>
            </div>
            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <div className="text-sm text-gray-500 dark:text-gray-400">Чистая прибыль</div>
              <div
                className={`text-2xl font-bold ${statistics.totalWinnings - statistics.totalLosses >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
              >
                {statistics.totalWinnings - statistics.totalLosses}
              </div>
            </div>
          </div>
        </div>

        <Separator className="my-6" />

        <div>
          <h3 className="text-lg font-medium mb-3 flex items-center">
            <User className="h-5 w-5 mr-2 text-primary" />
            Покерные метрики
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
              <div className="text-sm text-gray-500 dark:text-gray-400">VPIP</div>
              <div className="text-2xl font-bold">{statistics.vpip.toFixed(1)}%</div>
              <div className="text-xs text-gray-500 mt-1">Добровольно внесено в банк</div>
            </div>
            <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
              <div className="text-sm text-gray-500 dark:text-gray-400">PFR</div>
              <div className="text-2xl font-bold">{statistics.pfr.toFixed(1)}%</div>
              <div className="text-xs text-gray-500 mt-1">Рейз на префлопе</div>
            </div>
            <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
              <div className="text-sm text-gray-500 dark:text-gray-400">AF</div>
              <div className="text-2xl font-bold">{statistics.af.toFixed(2)}</div>
              <div className="text-xs text-gray-500 mt-1">Фактор агрессии</div>
            </div>
          </div>
        </div>
      </CardContent>

      <Dialog open={isEditingUsername} onOpenChange={setIsEditingUsername}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Изменить имя пользователя</DialogTitle>
            <DialogDescription>
              Введите новое имя пользователя. Оно будет отображаться в игре и на вашем профиле.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="username">Имя пользователя</Label>
            <Input
              id="username"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder="Введите новое имя пользователя"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditingUsername(false)}>
              Отмена
            </Button>
            <Button onClick={handleUpdateUsername} disabled={!newUsername.trim() || isSubmitting}>
              {isSubmitting ? (
                <>Сохранение...</>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Сохранить
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

