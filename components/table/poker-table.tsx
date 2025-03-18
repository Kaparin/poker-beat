"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { toast } from "@/hooks/use-toast"
import { socketClient, type TableState, type ChatMessage } from "@/lib/socket-client"
import { PlayerSeat } from "@/components/table/player-seat"
import { CommunityCards } from "@/components/table/community-cards"
import { BettingControls } from "@/components/table/betting-controls"
import { TableChat } from "@/components/table/table-chat"
import { HandHistory } from "@/components/table/hand-history"
import { TableInfo } from "@/components/table/table-info"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"

interface PokerTableProps {
  tableId: string
  userId: string
  token: string
  isSpectator?: boolean
}

export function PokerTable({ tableId, userId, token, isSpectator = false }: PokerTableProps) {
  const router = useRouter()
  const [tableState, setTableState] = useState<TableState | null>(null)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Инициализация сокета
    socketClient.onTableState((state) => {
      setTableState(state)
      setLoading(false)
    })

    socketClient.onChatMessage((message) => {
      setChatMessages((prev) => [message, ...prev])
    })

    socketClient.onError((error) => {
      toast({
        title: "Ошибка",
        description: error,
        variant: "destructive",
      })
    })

    socketClient.onConnectionStatus((status) => {
      setIsConnected(status)

      if (status) {
        // При успешном подключении присоединяемся к столу
        socketClient.joinTable(tableId, userId, token)
      } else {
        // При потере соединения показываем уведомление
        toast({
          title: "Соединение потеряно",
          description: "Пытаемся восстановить соединение...",
          variant: "destructive",
        })
      }
    })

    // Подключение к сокету
    socketClient.connect()

    // Загрузка истории чата
    fetchChatHistory()

    // Очистка при размонтировании
    return () => {
      socketClient.leaveTable()
      socketClient.disconnect()
    }
  }, [tableId, userId, token])

  const fetchChatHistory = async () => {
    try {
      const response = await fetch(`/api/tables/${tableId}/chat`)

      if (!response.ok) {
        throw new Error("Failed to fetch chat history")
      }

      const data = await response.json()
      setChatMessages(data)
    } catch (error) {
      console.error("Error fetching chat history:", error)
    }
  }

  const handleAction = (action: { type: string; amount?: number }) => {
    socketClient.sendAction(action)
  }

  const handleSendMessage = (message: string) => {
    socketClient.sendChatMessage(message)
  }

  const handleLeaveTable = async () => {
    try {
      const response = await fetch(`/api/tables/${tableId}/leave`, {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Failed to leave table")
      }

      const data = await response.json()

      toast({
        title: "Успешно",
        description: `Вы покинули стол. Возвращено ${data.chipsReturned} фишек.`,
      })

      // Перенаправление в лобби
      router.push("/lobby")
    } catch (error) {
      console.error("Error leaving table:", error)
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось покинуть стол",
        variant: "destructive",
      })
    }
  }

  const handleStopSpectating = async () => {
    try {
      const response = await fetch(`/api/tables/${tableId}/spectate`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to stop spectating")
      }

      toast({
        title: "Успешно",
        description: "Вы перестали наблюдать за столом",
      })

      // Перенаправление в лобби
      router.push("/lobby")
    } catch (error) {
      console.error("Error stopping spectating:", error)
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось прекратить наблюдение",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Skeleton className="h-[500px] rounded-md" />
      </div>
    )
  }

  if (!tableState) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="text-center py-8">
          <h2 className="text-2xl font-bold">Ошибка загрузки стола</h2>
          <p className="text-muted-foreground mt-2">Не удалось загрузить данные стола</p>
          <Button className="mt-4" onClick={() => router.push("/lobby")}>
            Вернуться в лобби
          </Button>
        </div>
      </div>
    )
  }

  const currentPlayer = tableState.players.find((player) => player.userId === userId)

  const getPlayerPosition = (seatNumber: number) => {
    const positions = [
      "bottom", // 1
      "bottom-right", // 2
      "right", // 3
      "top-right", // 4
      "top", // 5
      "top-left", // 6
      "left", // 7
      "bottom-left", // 8
    ]

    // Если игрок сидит за столом, позиционируем его внизу (позиция 0)
    if (currentPlayer && !isSpectator) {
      const currentSeat = currentPlayer.seatNumber
      const relativePosition = (seatNumber - currentSeat + 8) % 8
      return positions[relativePosition]
    }

    // Для наблюдателей используем стандартное расположение
    return positions[(seatNumber - 1) % 8]
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{tableState.name}</h1>
        <div className="flex items-center space-x-2">
          <div className="text-sm text-muted-foreground">
            {isConnected ? (
              <span className="text-green-500">Подключено</span>
            ) : (
              <span className="text-red-500">Отключено</span>
            )}
          </div>
          {isSpectator ? (
            <Button variant="outline" size="sm" onClick={handleStopSpectating}>
              Прекратить наблюдение
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={handleLeaveTable}>
              Покинуть стол
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Card className="relative h-[600px] bg-green-800 rounded-lg overflow-hidden">
            {/* Игроки за столом */}
            {tableState.players.map((player) => (
              <PlayerSeat
                key={player.seatNumber}
                player={player}
                position={getPlayerPosition(player.seatNumber)}
                isCurrentUser={player.userId === userId}
                isCurrentPlayer={player.isCurrentPlayer}
              />
            ))}

            {/* Общие карты */}
            {tableState.currentGame && (
              <CommunityCards cards={tableState.currentGame.communityCards} stage={tableState.currentGame.stage} />
            )}

            {/* Информация о поте */}
            {tableState.currentGame && (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-center">
                <div className="text-2xl font-bold">{tableState.currentGame.potSize.toLocaleString()} фишек</div>
                <div className="text-sm">
                  {tableState.blinds} • {tableState.gameType}
                </div>
              </div>
            )}
          </Card>

          {/* Контролы для ставок */}
          {!isSpectator && currentPlayer && tableState.currentGame && currentPlayer.isCurrentPlayer && (
            <BettingControls game={tableState.currentGame} player={currentPlayer} onAction={handleAction} />
          )}
        </div>

        <div className="lg:col-span-1">
          <Tabs defaultValue="info">
            <TabsList className="w-full">
              <TabsTrigger value="info" className="flex-1">
                Инфо
              </TabsTrigger>
              <TabsTrigger value="chat" className="flex-1">
                Чат
              </TabsTrigger>
              <TabsTrigger value="history" className="flex-1">
                История
              </TabsTrigger>
            </TabsList>
            <TabsContent value="info" className="mt-4">
              <TableInfo table={tableState} spectators={tableState.spectators} />
            </TabsContent>
            <TabsContent value="chat" className="mt-4">
              <TableChat messages={chatMessages} onSendMessage={handleSendMessage} />
            </TabsContent>
            <TabsContent value="history" className="mt-4">
              <HandHistory tableId={tableId} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

