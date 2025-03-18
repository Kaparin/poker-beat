"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { format } from "date-fns"
import { ru } from "date-fns/locale"
import { Clock, Eye, ChevronRight, Loader2, Award } from "lucide-react"
import type { HandStatistics } from "@/types/statistics"

export function HandHistoryList() {
  const { token } = useAuth()
  const [hands, setHands] = useState<HandStatistics[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedHand, setSelectedHand] = useState<HandStatistics | null>(null)
  const [isHandDetailsOpen, setIsHandDetailsOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [activeTab, setActiveTab] = useState("all")

  const pageSize = 10

  // Fetch hand history on component mount
  useEffect(() => {
    if (token) {
      fetchHandHistory(1, true)
    }
  }, [token, activeTab])

  const fetchHandHistory = async (pageNum: number, reset = false) => {
    if (!token) return

    setIsLoading(true)
    try {
      const type = activeTab === "all" ? "" : `&type=${activeTab}`
      const response = await fetch(`/api/hands?page=${pageNum}&limit=${pageSize}${type}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch hand history")
      }

      const data = await response.json()

      if (reset) {
        setHands(data.hands || [])
      } else {
        setHands((prev) => [...prev, ...(data.hands || [])])
      }

      setHasMore((data.hands || []).length === pageSize)
      setPage(pageNum)
    } catch (error) {
      console.error("Error fetching hand history:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить историю рук",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleLoadMore = () => {
    fetchHandHistory(page + 1)
  }

  const handleViewHandDetails = (hand: HandStatistics) => {
    setSelectedHand(hand)
    setIsHandDetailsOpen(true)
  }

  const getActionText = (action: string, amount?: number) => {
    switch (action) {
      case "fold":
        return "Фолд"
      case "check":
        return "Чек"
      case "call":
        return amount ? `Колл ${amount}` : "Колл"
      case "bet":
        return amount ? `Ставка ${amount}` : "Ставка"
      case "raise":
        return amount ? `Рейз до ${amount}` : "Рейз"
      case "all-in":
        return amount ? `Олл-ин ${amount}` : "Олл-ин"
      default:
        return action
    }
  }

  const getStageName = (stage: string) => {
    switch (stage) {
      case "preflop":
        return "Префлоп"
      case "flop":
        return "Флоп"
      case "turn":
        return "Тёрн"
      case "river":
        return "Ривер"
      case "showdown":
        return "Вскрытие"
      default:
        return stage
    }
  }

  const formatCard = (card: string) => {
    const suit = card.charAt(1)
    const rank = card.charAt(0)

    const suitSymbol =
      {
        h: "♥",
        d: "♦",
        c: "♣",
        s: "♠",
      }[suit] || suit

    const rankText =
      {
        T: "10",
        J: "В",
        Q: "Д",
        K: "К",
        A: "Т",
      }[rank] || rank

    const suitColor = suit === "h" || suit === "d" ? "text-red-500" : "text-black dark:text-white"

    return (
      <span
        className={`inline-flex items-center justify-center rounded-md border px-2 py-1 text-xs font-medium ${suitColor}`}
      >
        {rankText}
        {suitSymbol}
      </span>
    )
  }

  const renderHandDetails = () => {
    if (!selectedHand) return null

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-2">Информация о раздаче</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-500">ID раздачи:</span>
              <span className="ml-2">{selectedHand.handId}</span>
            </div>
            <div>
              <span className="text-gray-500">Стол:</span>
              <span className="ml-2">{selectedHand.tableId}</span>
            </div>
            <div>
              <span className="text-gray-500">Дата:</span>
              <span className="ml-2">
                {format(new Date(selectedHand.timestamp), "dd MMMM yyyy, HH:mm:ss", { locale: ru })}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Банк:</span>
              <span className="ml-2">{selectedHand.pot}</span>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-2">Общие карты</h3>
          <div className="flex flex-wrap gap-2 mb-4">
            {selectedHand.communityCards.length > 0 ? (
              selectedHand.communityCards.map((card, index) => (
                <div key={index} className="mr-1">
                  {formatCard(card)}
                </div>
              ))
            ) : (
              <span className="text-gray-500">Нет общих карт</span>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-2">Игроки</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Игрок</TableHead>
                <TableHead>Позиция</TableHead>
                <TableHead>Карты</TableHead>
                <TableHead className="text-right">Выигрыш</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {selectedHand.players.map((player) => (
                <TableRow key={player.userId}>
                  <TableCell className="font-medium">{player.username}</TableCell>
                  <TableCell>{player.position}</TableCell>
                  <TableCell>
                    {player.holeCards && player.showedCards ? (
                      <div className="flex gap-1">
                        {player.holeCards.map((card, index) => (
                          <div key={index}>{formatCard(card)}</div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-500">Не показаны</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {player.wonAmount > 0 ? (
                      <span className="text-green-600 font-medium">+{player.wonAmount}</span>
                    ) : (
                      <span>-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-2">Действия</h3>
          <div className="space-y-4">
            {["preflop", "flop", "turn", "river", "showdown"].map((stage) => {
              const stageActions = selectedHand.players
                .flatMap((player) => player.actions.filter((action) => action.stage === stage))
                .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

              if (stageActions.length === 0) return null

              return (
                <div key={stage}>
                  <h4 className="text-md font-medium mb-2">{getStageName(stage)}</h4>
                  <div className="pl-4 border-l-2 border-gray-200 space-y-2">
                    {stageActions.map((action, index) => {
                      const player = selectedHand.players.find((p) => p.actions.some((a) => a === action))

                      return (
                        <div key={index} className="flex items-center text-sm">
                          <span className="font-medium mr-2">{player?.username}:</span>
                          <span>{getActionText(action.action, action.amount)}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {selectedHand.players.some((p) => p.handRank) && (
          <div>
            <h3 className="text-lg font-medium mb-2">Результаты</h3>
            <div className="space-y-2">
              {selectedHand.players
                .filter((p) => p.handRank)
                .sort((a, b) => (b.wonAmount || 0) - (a.wonAmount || 0))
                .map((player, index) => (
                  <div key={player.userId} className="flex items-center">
                    {player.wonAmount > 0 && index === 0 && <Award className="h-5 w-5 text-yellow-500 mr-2" />}
                    <span className="font-medium mr-2">{player.username}:</span>
                    <span className="mr-2">{player.handRank}</span>
                    {player.wonAmount > 0 && <span className="text-green-600 font-medium">+{player.wonAmount}</span>}
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">История рук</h2>
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="all">Все</TabsTrigger>
          <TabsTrigger value="cash">Кэш-игры</TabsTrigger>
          <TabsTrigger value="tournament">Турниры</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-0">
          {renderHandsList()}
        </TabsContent>

        <TabsContent value="cash" className="mt-0">
          {renderHandsList()}
        </TabsContent>

        <TabsContent value="tournament" className="mt-0">
          {renderHandsList()}
        </TabsContent>
      </Tabs>

      <Dialog open={isHandDetailsOpen} onOpenChange={setIsHandDetailsOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Детали раздачи</DialogTitle>
            <DialogDescription>Подробная информация о раздаче #{selectedHand?.handId}</DialogDescription>
          </DialogHeader>
          {renderHandDetails()}
        </DialogContent>
      </Dialog>
    </div>
  )

  function renderHandsList() {
    if (isLoading && hands.length === 0) {
      return (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )
    }

    if (hands.length === 0) {
      return (
        <Card>
          <CardContent className="text-center py-8">
            <Clock className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">История рук пуста</p>
          </CardContent>
        </Card>
      )
    }

    return (
      <div className="space-y-4">
        {hands.map((hand) => (
          <Card key={hand.handId}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center">
                    <h3 className="text-lg font-medium">Раздача #{hand.handId.substring(0, 8)}</h3>
                    {hand.tournamentId && (
                      <Badge variant="outline" className="ml-2">
                        Турнир
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {format(new Date(hand.timestamp), "dd MMMM yyyy, HH:mm", { locale: ru })}
                  </div>
                </div>

                <div className="flex items-center">
                  <div className="text-right mr-4">
                    <div className="text-sm text-gray-500">Банк</div>
                    <div className="font-medium">{hand.pot}</div>
                  </div>

                  <Button variant="ghost" size="icon" onClick={() => handleViewHandDetails(hand)}>
                    <Eye className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              <div className="mt-4">
                <div className="text-sm text-gray-500 mb-2">Игроки:</div>
                <div className="flex flex-wrap gap-2">
                  {hand.players.map((player) => (
                    <Badge
                      key={player.userId}
                      variant="outline"
                      className={
                        player.wonAmount > 0 ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" : ""
                      }
                    >
                      {player.username}
                      {player.wonAmount > 0 && ` (+${player.wonAmount})`}
                    </Badge>
                  ))}
                </div>
              </div>

              {hand.communityCards.length > 0 && (
                <div className="mt-4">
                  <div className="text-sm text-gray-500 mb-2">Общие карты:</div>
                  <div className="flex flex-wrap gap-1">
                    {hand.communityCards.map((card, index) => (
                      <div key={index}>{formatCard(card)}</div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {hasMore && (
          <div className="flex justify-center mt-4">
            <Button variant="outline" onClick={handleLoadMore} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Загрузка...
                </>
              ) : (
                <>
                  Загрузить еще
                  <ChevronRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    )
  }
}

