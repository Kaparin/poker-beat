"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Clock, X, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"

interface HandAction {
  id: string
  playerId: number
  playerName: string
  action: string
  amount?: number
  timestamp: Date
}

interface HandRecord {
  id: string
  tableId: string
  tableName: string
  startTime: Date
  endTime?: Date
  players: {
    id: number
    name: string
    initialStack: number
    finalStack?: number
    position?: number
    isWinner: boolean
    cards?: { suit: string; rank: string }[]
  }[]
  communityCards: { suit: string; rank: string }[]
  pot: number
  actions: HandAction[]
  winners?: {
    playerId: number
    amount: number
    handDescription: string
  }[]
}

interface HandHistoryProps {
  hands: HandRecord[]
  className?: string
}

export function HandHistory({ hands, className }: HandHistoryProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [selectedHandIndex, setSelectedHandIndex] = useState(0)

  const selectedHand = hands[selectedHandIndex]

  const handlePreviousHand = () => {
    if (selectedHandIndex > 0) {
      setSelectedHandIndex(selectedHandIndex - 1)
    }
  }

  const handleNextHand = () => {
    if (selectedHandIndex < hands.length - 1) {
      setSelectedHandIndex(selectedHandIndex + 1)
    }
  }

  if (!isExpanded) {
    return (
      <Button
        variant="outline"
        size="icon"
        className={cn("fixed bottom-4 left-4 h-12 w-12 rounded-full shadow-lg", className)}
        onClick={() => setIsExpanded(true)}
      >
        <Clock className="h-6 w-6" />
      </Button>
    )
  }

  if (hands.length === 0) {
    return (
      <Card className={cn("fixed bottom-4 left-4 w-80 h-96 shadow-lg", className)}>
        <CardHeader className="p-3 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium">Hand History</CardTitle>
          <Button variant="ghost" size="icon" onClick={() => setIsExpanded(false)}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="p-4 flex items-center justify-center h-[calc(100%-56px)]">
          <p className="text-gray-500 dark:text-gray-400 text-center">
            No hand history available yet. Play some hands to see them here.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn("fixed bottom-4 left-4 w-80 h-96 shadow-lg", className)}>
      <CardHeader className="p-3 flex flex-row items-center justify-between">
        <div className="flex items-center space-x-2">
          <CardTitle className="text-sm font-medium">Hand History</CardTitle>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {selectedHandIndex + 1} of {hands.length}
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handlePreviousHand}
            disabled={selectedHandIndex === 0}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleNextHand}
            disabled={selectedHandIndex === hands.length - 1}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsExpanded(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0 flex flex-col h-[calc(100%-56px)]">
        <Tabs defaultValue="summary" className="flex flex-col h-full">
          <TabsList className="mx-3 mt-2">
            <TabsTrigger value="summary" className="flex-1">
              Summary
            </TabsTrigger>
            <TabsTrigger value="actions" className="flex-1">
              Actions
            </TabsTrigger>
          </TabsList>
          <TabsContent value="summary" className="flex-1 p-3 overflow-auto">
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-medium">Hand #{selectedHand.id.substring(0, 8)}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatDistanceToNow(new Date(selectedHand.startTime), { addSuffix: true })}
                </p>
              </div>

              <div>
                <h4 className="text-xs font-medium mb-1">Players</h4>
                <div className="space-y-1">
                  {selectedHand.players.map((player) => (
                    <div key={player.id} className="flex justify-between text-xs">
                      <span className={player.isWinner ? "font-medium text-green-500" : ""}>{player.name}</span>
                      <span>
                        {player.finalStack !== undefined
                          ? `${player.initialStack} → ${player.finalStack}`
                          : player.initialStack}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {selectedHand.winners && selectedHand.winners.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium mb-1">Winners</h4>
                  <div className="space-y-1">
                    {selectedHand.winners.map((winner) => {
                      const player = selectedHand.players.find((p) => p.id === winner.playerId)
                      return (
                        <div key={winner.playerId} className="text-xs">
                          <span className="font-medium text-green-500">{player?.name}</span>
                          <span> won {winner.amount} with </span>
                          <span className="italic">{winner.handDescription}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              <div>
                <h4 className="text-xs font-medium mb-1">Community Cards</h4>
                <div className="flex flex-wrap gap-1">
                  {selectedHand.communityCards.map((card, index) => (
                    <div
                      key={index}
                      className={cn(
                        "w-6 h-8 rounded border flex items-center justify-center text-xs",
                        card.suit === "hearts" || card.suit === "diamonds"
                          ? "text-red-500 border-red-300"
                          : "text-black dark:text-white border-gray-300",
                      )}
                    >
                      {card.rank}
                      <span className="text-[8px]">
                        {card.suit === "hearts"
                          ? "♥"
                          : card.suit === "diamonds"
                            ? "♦"
                            : card.suit === "clubs"
                              ? "♣"
                              : "♠"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-medium mb-1">Pot</h4>
                <p className="text-xs">{selectedHand.pot} chips</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="actions" className="flex-1 p-0">
            <ScrollArea className="h-full p-3">
              <div className="space-y-2">
                {selectedHand.actions.map((action) => (
                  <div key={action.id} className="text-xs border-b pb-2">
                    <div className="flex justify-between">
                      <span className="font-medium">{action.playerName}</span>
                      <span className="text-gray-500 dark:text-gray-400">
                        {new Date(action.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </span>
                    </div>
                    <div>
                      {action.action}
                      {action.amount !== undefined && ` ${action.amount}`}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

