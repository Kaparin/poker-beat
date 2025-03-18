"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { format, formatDistanceToNow } from "date-fns"
import { ru } from "date-fns/locale"
import {
  Clock,
  Users,
  DollarSign,
  Award,
  Calendar,
  ArrowLeft,
  Loader2,
  Trophy,
  Timer,
  TableIcon,
  ChevronUp,
  ChevronDown,
} from "lucide-react"
import type { Tournament, BlindLevel, TournamentPlayer } from "@/types/tournament"

interface TournamentDetailsProps {
  tournamentId: string
}

export function TournamentDetails({ tournamentId }: TournamentDetailsProps) {
  const router = useRouter()
  const { token, user } = useAuth()
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRegistering, setIsRegistering] = useState(false)
  const [isUnregistering, setIsUnregistering] = useState(false)
  const [isRegistered, setIsRegistered] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")

  // Fetch tournament details
  useEffect(() => {
    if (token) {
      fetchTournamentDetails()
    }
  }, [token, tournamentId])

  const fetchTournamentDetails = async () => {
    if (!token) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/tournaments/${tournamentId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch tournament details")
      }

      const data = await response.json()
      setTournament(data.tournament)
      setIsRegistered(data.isRegistered || false)
    } catch (error) {
      console.error("Error fetching tournament details:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить информацию о турнире",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async () => {
    if (!token || !tournament) return

    setIsRegistering(true)
    try {
      const response = await fetch(`/api/tournaments/${tournamentId}/register`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to register for tournament")
      }

      setIsRegistered(true)
      toast({
        title: "Успешно",
        description: `Вы зарегистрированы на турнир "${tournament.name}"`,
      })

      // Refresh tournament details
      fetchTournamentDetails()
    } catch (error) {
      console.error("Error registering for tournament:", error)
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось зарегистрироваться на турнир",
        variant: "destructive",
      })
    } finally {
      setIsRegistering(false)
    }
  }

  const handleUnregister = async () => {
    if (!token || !tournament) return

    setIsUnregistering(true)
    try {
      const response = await fetch(`/api/tournaments/${tournamentId}/unregister`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to unregister from tournament")
      }

      setIsRegistered(false)
      toast({
        title: "Успешно",
        description: `Вы отменили регистрацию на турнир "${tournament.name}"`,
      })

      // Refresh tournament details
      fetchTournamentDetails()
    } catch (error) {
      console.error("Error unregistering from tournament:", error)
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось отменить регистрацию",
        variant: "destructive",
      })
    } finally {
      setIsUnregistering(false)
    }
  }

  const handleGoToLobby = () => {
    router.push("/tournaments")
  }

  const handlePlayTournament = () => {
    if (!tournament) return

    // Find the player's table
    const playerInfo = tournament.players.find((p) => p.userId === user?.id)
    if (playerInfo && playerInfo.tableId) {
      router.push(`/table/${playerInfo.tableId}`)
    } else {
      toast({
        title: "Информация",
        description: "Вы еще не назначены на стол. Пожалуйста, подождите начала турнира.",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!tournament) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-bold mb-4">Турнир не найден</h2>
        <Button onClick={handleGoToLobby}>Вернуться к списку турниров</Button>
      </div>
    )
  }

  const isRegistrationOpen = tournament.status === "REGISTRATION_OPEN"
  const isStarted = ["RUNNING", "BREAK", "FINAL_TABLE"].includes(tournament.status)
  const isFinished = tournament.status === "FINISHED"
  const totalBuyIn = tournament.buyIn + tournament.entryFee
  const canRegister = (user?.balance || 0) >= totalBuyIn
  const prizePool = tournament.players.length * tournament.buyIn

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

  const renderBlindLevels = (blindLevels: BlindLevel[]) => {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Уровень</TableHead>
            <TableHead>Малый блайнд</TableHead>
            <TableHead>Большой блайнд</TableHead>
            <TableHead>Анте</TableHead>
            <TableHead>Длительность</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {blindLevels.map((level) => (
            <TableRow key={level.level} className={tournament.currentLevel === level.level ? "bg-primary/10" : ""}>
              <TableCell>{level.level}</TableCell>
              <TableCell>{level.smallBlind}</TableCell>
              <TableCell>{level.bigBlind}</TableCell>
              <TableCell>{level.ante}</TableCell>
              <TableCell>{level.duration} мин.</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )
  }

  const renderPayoutStructure = () => {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Место</TableHead>
            <TableHead>Процент</TableHead>
            <TableHead>Сумма</TableHead>
            <TableHead>Игрок</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tournament.payoutStructure.map((payout) => {
            const prize = tournament.prizes?.find((p) => p.position === payout.position)
            const player = prize?.userId ? tournament.players.find((p) => p.userId === prize.userId) : undefined

            return (
              <TableRow key={payout.position}>
                <TableCell>{payout.position}</TableCell>
                <TableCell>{payout.percentage}%</TableCell>
                <TableCell>{Math.floor(prizePool * (payout.percentage / 100))}</TableCell>
                <TableCell>{player ? player.username : "-"}</TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    )
  }

  const renderPlayersList = (players: TournamentPlayer[]) => {
    // Sort players by chips (descending)
    const sortedPlayers = [...players].sort((a, b) => b.chips - a.chips)

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Место</TableHead>
            <TableHead>Игрок</TableHead>
            <TableHead>Фишки</TableHead>
            <TableHead>Статус</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedPlayers.map((player, index) => (
            <TableRow key={player.userId} className={player.userId === user?.id ? "bg-primary/10" : ""}>
              <TableCell>{index + 1}</TableCell>
              <TableCell className="flex items-center">
                {player.userId === user?.id && <span className="mr-2 text-primary">•</span>}
                {player.username}
              </TableCell>
              <TableCell>
                {player.status === "ELIMINATED" ? (
                  <span className="text-red-500">Выбыл</span>
                ) : (
                  <span>{player.chips}</span>
                )}
              </TableCell>
              <TableCell>
                {player.status === "REGISTERED" && "Зарегистрирован"}
                {player.status === "PLAYING" && "Играет"}
                {player.status === "AWAY" && "Отсутствует"}
                {player.status === "ELIMINATED" && <span className="text-red-500">Выбыл</span>}
                {player.status === "WINNER" && (
                  <span className="text-green-500 flex items-center">
                    <Trophy className="h-4 w-4 mr-1" />
                    Победитель
                  </span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={handleGoToLobby} className="flex items-center">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Назад к турнирам
        </Button>

        <Badge className={statusBadgeColor()}>{statusText()}</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{tournament.name}</CardTitle>
          <CardDescription>{tournament.description || "Покерный турнир"}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-4">
              <div className="flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-gray-500" />
                <div>
                  <div className="font-medium">Дата начала</div>
                  <div className="text-sm text-gray-500">
                    {format(new Date(tournament.startTime), "dd MMMM yyyy, HH:mm", { locale: ru })}
                  </div>
                </div>
              </div>

              <div className="flex items-center">
                <Clock className="h-5 w-5 mr-2 text-gray-500" />
                <div>
                  <div className="font-medium">Регистрация</div>
                  <div className="text-sm text-gray-500">
                    {format(new Date(tournament.registrationStartTime), "dd.MM.yyyy HH:mm", { locale: ru })} -
                    {format(new Date(tournament.registrationEndTime), " dd.MM.yyyy HH:mm", { locale: ru })}
                  </div>
                </div>
              </div>

              <div className="flex items-center">
                <DollarSign className="h-5 w-5 mr-2 text-gray-500" />
                <div>
                  <div className="font-medium">Бай-ин</div>
                  <div className="text-sm text-gray-500">
                    {tournament.buyIn} + {tournament.entryFee} (взнос)
                  </div>
                </div>
              </div>

              <div className="flex items-center">
                <Award className="h-5 w-5 mr-2 text-gray-500" />
                <div>
                  <div className="font-medium">Призовой фонд</div>
                  <div className="text-sm text-gray-500">
                    {prizePool} ({tournament.players.length} игроков)
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center">
                <Users className="h-5 w-5 mr-2 text-gray-500" />
                <div>
                  <div className="font-medium">Игроки</div>
                  <div className="text-sm text-gray-500">
                    {tournament.players.length} / {tournament.maxPlayers}
                  </div>
                  <Progress value={(tournament.players.length / tournament.maxPlayers) * 100} className="h-2 mt-1" />
                </div>
              </div>

              <div className="flex items-center">
                <TableIcon className="h-5 w-5 mr-2 text-gray-500" />
                <div>
                  <div className="font-medium">Размер стола</div>
                  <div className="text-sm text-gray-500">{tournament.tableSize} игроков</div>
                </div>
              </div>

              <div className="flex items-center">
                <Timer className="h-5 w-5 mr-2 text-gray-500" />
                <div>
                  <div className="font-medium">Текущий уровень</div>
                  <div className="text-sm text-gray-500">
                    {isStarted ? (
                      <>
                        Уровень {tournament.currentLevel} - SB:{" "}
                        {tournament.blindLevels[tournament.currentLevel - 1]?.smallBlind || "-"} / BB:{" "}
                        {tournament.blindLevels[tournament.currentLevel - 1]?.bigBlind || "-"}
                      </>
                    ) : (
                      "Турнир еще не начался"
                    )}
                  </div>
                </div>
              </div>

              {tournament.rebuyOption && (
                <div className="flex items-center">
                  <ChevronUp className="h-5 w-5 mr-2 text-gray-500" />
                  <div>
                    <div className="font-medium">Ребай</div>
                    <div className="text-sm text-gray-500">
                      {tournament.rebuyOption.price} чипов, макс. {tournament.rebuyOption.maxRebuys} раз
                    </div>
                  </div>
                </div>
              )}

              {tournament.addOnOption && (
                <div className="flex items-center">
                  <ChevronDown className="h-5 w-5 mr-2 text-gray-500" />
                  <div>
                    <div className="font-medium">Аддон</div>
                    <div className="text-sm text-gray-500">
                      {tournament.addOnOption.price} чипов, доступен до уровня{" "}
                      {tournament.addOnOption.availableUntilLevel}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator className="my-6" />

          <div className="flex flex-col sm:flex-row justify-between gap-4">
            {isRegistered ? (
              <div className="flex flex-col sm:flex-row gap-4">
                {isStarted && <Button onClick={handlePlayTournament}>Играть</Button>}

                {!isStarted && !isFinished && (
                  <Button variant="outline" onClick={handleUnregister} disabled={isUnregistering}>
                    {isUnregistering ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Обработка...
                      </>
                    ) : (
                      "Отменить регистрацию"
                    )}
                  </Button>
                )}
              </div>
            ) : (
              <Button
                onClick={handleRegister}
                disabled={isRegistering || !canRegister || !isRegistrationOpen || isStarted || isFinished}
              >
                {isRegistering ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Обработка...
                  </>
                ) : (
                  "Зарегистрироваться"
                )}
              </Button>
            )}

            {!canRegister && !isRegistered && isRegistrationOpen && (
              <div className="text-sm text-red-500">Недостаточно средств для регистрации. Необходимо: {totalBuyIn}</div>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab} className="mt-6">
        <TabsList className="grid grid-cols-3">
          <TabsTrigger value="overview">Обзор</TabsTrigger>
          <TabsTrigger value="players">Игроки ({tournament.players.length})</TabsTrigger>
          <TabsTrigger value="structure">Структура</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Обзор турнира</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Описание</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {tournament.description || "Стандартный турнир по покеру."}
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">Текущий статус</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Статус турнира</p>
                      <p className="font-medium">{statusText()}</p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">Активных игроков</p>
                      <p className="font-medium">
                        {tournament.players.filter((p) => p.status !== "ELIMINATED").length}
                      </p>
                    </div>

                    {isStarted && (
                      <>
                        <div>
                          <p className="text-sm text-gray-500">Текущий уровень</p>
                          <p className="font-medium">
                            Уровень {tournament.currentLevel} - SB:{" "}
                            {tournament.blindLevels[tournament.currentLevel - 1]?.smallBlind || "-"} / BB:{" "}
                            {tournament.blindLevels[tournament.currentLevel - 1]?.bigBlind || "-"}
                          </p>
                        </div>

                        {tournament.nextLevelTime && (
                          <div>
                            <p className="text-sm text-gray-500">Следующий уровень через</p>
                            <p className="font-medium">
                              {formatDistanceToNow(new Date(tournament.nextLevelTime), { locale: ru })}
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {isFinished && tournament.winnerId && (
                  <div>
                    <h3 className="text-lg font-medium mb-2">Победитель</h3>
                    <div className="flex items-center">
                      <Trophy className="h-6 w-6 text-yellow-500 mr-2" />
                      <div>
                        <p className="font-medium">
                          {tournament.players.find((p) => p.userId === tournament.winnerId)?.username ||
                            "Неизвестный игрок"}
                        </p>
                        <p className="text-sm text-gray-500">
                          Выигрыш: {Math.floor(prizePool * (tournament.payoutStructure[0]?.percentage / 100))}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-lg font-medium mb-2">Призовые места</h3>
                  <div className="overflow-x-auto">{renderPayoutStructure()}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="players" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Участники турнира</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">{renderPlayersList(tournament.players)}</div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="structure" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Структура турнира</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Уровни блайндов</h3>
                  <div className="overflow-x-auto">{renderBlindLevels(tournament.blindLevels)}</div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">Призовая структура</h3>
                  <div className="overflow-x-auto">{renderPayoutStructure()}</div>
                </div>

                {tournament.rebuyOption && (
                  <div>
                    <h3 className="text-lg font-medium mb-2">Правила ребая</h3>
                    <p>Стоимость: {tournament.rebuyOption.price}</p>
                    <p>Получаемые фишки: {tournament.rebuyOption.chips}</p>
                    <p>Максимальное количество: {tournament.rebuyOption.maxRebuys}</p>
                    <p>Доступен до уровня: {tournament.rebuyOption.availableUntilLevel}</p>
                  </div>
                )}

                {tournament.addOnOption && (
                  <div>
                    <h3 className="text-lg font-medium mb-2">Правила аддона</h3>
                    <p>Стоимость: {tournament.addOnOption.price}</p>
                    <p>Получаемые фишки: {tournament.addOnOption.chips}</p>
                    <p>Доступен на перерыве: {tournament.addOnOption.availableAtBreak ? "Да" : "Нет"}</p>
                    <p>Доступен до уровня: {tournament.addOnOption.availableUntilLevel}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

