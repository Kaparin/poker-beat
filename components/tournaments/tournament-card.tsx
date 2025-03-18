"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
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
import { formatDistanceToNow, format, isPast, isFuture } from "date-fns"
import { ru } from "date-fns/locale"
import { Clock, Users, DollarSign, Award, Lock, Calendar, ChevronRight } from "lucide-react"
import { useRouter } from "next/navigation"
import type { Tournament } from "@/types/tournament"

interface TournamentCardProps {
  tournament: Tournament
  userBalance: number
  onRegister: (tournamentId: string, password?: string) => Promise<void>
  onUnregister: (tournamentId: string) => Promise<void>
  isRegistered: boolean
}

export function TournamentCard({
  tournament,
  userBalance,
  onRegister,
  onUnregister,
  isRegistered,
}: TournamentCardProps) {
  const router = useRouter()
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const totalBuyIn = tournament.buyIn + tournament.entryFee
  const canRegister = userBalance >= totalBuyIn
  const isRegistrationOpen = tournament.status === "REGISTRATION_OPEN"
  const isStarted = ["RUNNING", "BREAK", "FINAL_TABLE"].includes(tournament.status)
  const isFinished = tournament.status === "FINISHED"

  const registrationTimeInfo = () => {
    if (isRegistrationOpen) {
      return `Регистрация закрывается ${formatDistanceToNow(new Date(tournament.registrationEndTime), {
        addSuffix: true,
        locale: ru,
      })}`
    } else if (
      isPast(new Date(tournament.registrationStartTime)) &&
      isFuture(new Date(tournament.registrationEndTime))
    ) {
      return "Регистрация открыта"
    } else if (isFuture(new Date(tournament.registrationStartTime))) {
      return `Регистрация начнется ${formatDistanceToNow(new Date(tournament.registrationStartTime), {
        addSuffix: true,
        locale: ru,
      })}`
    } else {
      return "Регистрация закрыта"
    }
  }

  const statusBadgeColor = () => {
    switch (tournament.status) {
      case "SCHEDULED":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
      case "REGISTRATION_OPEN":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "RUNNING":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300"
      case "BREAK":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
      case "FINAL_TABLE":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      case "FINISHED":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
      case "CANCELLED":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
    }
  }

  const statusText = () => {
    switch (tournament.status) {
      case "SCHEDULED":
        return "Запланирован"
      case "REGISTRATION_OPEN":
        return "Регистрация открыта"
      case "REGISTRATION_CLOSED":
        return "Регистрация закрыта"
      case "RUNNING":
        return "В процессе"
      case "BREAK":
        return "Перерыв"
      case "FINAL_TABLE":
        return "Финальный стол"
      case "FINISHED":
        return "Завершен"
      case "CANCELLED":
        return "Отменен"
      default:
        return tournament.status
    }
  }

  const handleRegisterClick = async () => {
    if (tournament.isPrivate) {
      setIsPasswordDialogOpen(true)
    } else {
      await handleRegister()
    }
  }

  const handleRegister = async (pwd?: string) => {
    setIsLoading(true)
    try {
      await onRegister(tournament.id, pwd)
      toast({
        title: "Успешно",
        description: `Вы зарегистрированы на турнир "${tournament.name}"`,
      })
      setIsPasswordDialogOpen(false)
    } catch (error) {
      console.error("Error registering for tournament:", error)
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось зарегистрироваться на турнир",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleUnregister = async () => {
    setIsLoading(true)
    try {
      await onUnregister(tournament.id)
      toast({
        title: "Успешно",
        description: `Вы отменили регистрацию на турнир "${tournament.name}"`,
      })
    } catch (error) {
      console.error("Error unregistering from tournament:", error)
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось отменить регистрацию",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordSubmit = () => {
    handleRegister(password)
  }

  const handleViewDetails = () => {
    router.push(`/tournaments/${tournament.id}`)
  }

  return (
    <>
      <Card className="h-full flex flex-col">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl">{tournament.name}</CardTitle>
              <CardDescription>{tournament.description || "Покерный турнир"}</CardDescription>
            </div>
            <Badge className={statusBadgeColor()}>{statusText()}</Badge>
          </div>
        </CardHeader>
        <CardContent className="flex-grow">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                <Calendar className="mr-2 h-4 w-4" />
                <span>{format(new Date(tournament.startTime), "dd MMM yyyy, HH:mm", { locale: ru })}</span>
              </div>
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                <Clock className="mr-2 h-4 w-4" />
                <span>{registrationTimeInfo()}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="flex flex-col">
                <span className="text-sm text-gray-500 dark:text-gray-400">Бай-ин</span>
                <span className="font-medium flex items-center">
                  <DollarSign className="h-4 w-4 mr-1" />
                  {tournament.buyIn} + {tournament.entryFee}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-gray-500 dark:text-gray-400">Фишки</span>
                <span className="font-medium">{tournament.startingChips}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-gray-500 dark:text-gray-400">Игроки</span>
                <span className="font-medium flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  {tournament.players.length} / {tournament.maxPlayers}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-gray-500 dark:text-gray-400">Призовой фонд</span>
                <span className="font-medium flex items-center">
                  <Award className="h-4 w-4 mr-1" />
                  {tournament.players.length * tournament.buyIn}
                </span>
              </div>
            </div>

            {tournament.isPrivate && (
              <div className="flex items-center mt-2 text-sm text-amber-600 dark:text-amber-400">
                <Lock className="h-4 w-4 mr-1" />
                <span>Приватный турнир</span>
              </div>
            )}

            {!canRegister && !isRegistered && isRegistrationOpen && (
              <div className="text-sm text-red-500 mt-2">Недостаточно средств для регистрации</div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t pt-4">
          {isRegistered ? (
            <Button variant="outline" onClick={handleUnregister} disabled={isLoading || isStarted || isFinished}>
              {isLoading ? "Обработка..." : "Отменить регистрацию"}
            </Button>
          ) : (
            <Button
              onClick={handleRegisterClick}
              disabled={isLoading || !canRegister || !isRegistrationOpen || isStarted || isFinished}
            >
              {isLoading ? "Обработка..." : "Зарегистрироваться"}
            </Button>
          )}

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={handleViewDetails}>
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Подробнее о турнире</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardFooter>
      </Card>

      {/* Password Dialog */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Введите пароль турнира</DialogTitle>
            <DialogDescription>
              Этот турнир защищен паролем. Пожалуйста, введите пароль для регистрации.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="password">Пароль</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Введите пароль турнира"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPasswordDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handlePasswordSubmit} disabled={!password || isLoading}>
              {isLoading ? "Проверка..." : "Подтвердить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

