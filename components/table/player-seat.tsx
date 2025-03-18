"use client"

import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import type { Player } from "@/lib/socket-client"
import { PlayingCard } from "@/components/table/playing-card"

interface PlayerSeatProps {
  player: Player
  position: string
  isCurrentUser: boolean
  isCurrentPlayer: boolean
}

export function PlayerSeat({ player, position, isCurrentUser, isCurrentPlayer }: PlayerSeatProps) {
  const positionClasses = {
    bottom: "bottom-4 left-1/2 transform -translate-x-1/2",
    "bottom-right": "bottom-16 right-16",
    right: "right-4 top-1/2 transform -translate-y-1/2",
    "top-right": "top-16 right-16",
    top: "top-4 left-1/2 transform -translate-x-1/2",
    "top-left": "top-16 left-16",
    left: "left-4 top-1/2 transform -translate-y-1/2",
    "bottom-left": "bottom-16 left-16",
  }

  const getStatusBadge = () => {
    if (player.isDealer) {
      return (
        <Badge variant="outline" className="bg-white">
          D
        </Badge>
      )
    }
    if (player.isSmallBlind) {
      return (
        <Badge variant="outline" className="bg-white">
          SB
        </Badge>
      )
    }
    if (player.isBigBlind) {
      return (
        <Badge variant="outline" className="bg-white">
          BB
        </Badge>
      )
    }
    return null
  }

  const getLastActionBadge = () => {
    if (!player.lastAction) return null

    const actionVariant =
      {
        fold: "destructive",
        check: "outline",
        call: "default",
        bet: "secondary",
        raise: "secondary",
        "all-in": "secondary",
      }[player.lastAction] || "outline"

    return (
      <Badge variant={actionVariant as any} className="ml-1">
        {formatActionText(player.lastAction)}
      </Badge>
    )
  }

  const formatActionText = (action: string) => {
    switch (action) {
      case "fold":
        return "Фолд"
      case "check":
        return "Чек"
      case "call":
        return "Колл"
      case "bet":
        return "Бет"
      case "raise":
        return "Рейз"
      case "all-in":
        return "Олл-ин"
      default:
        return action
    }
  }

  return (
    <div className={`absolute ${positionClasses[position as keyof typeof positionClasses]}`}>
      <Card
        className={`w-40 p-2 ${isCurrentPlayer ? "ring-2 ring-primary" : ""} ${isCurrentUser ? "bg-primary/10" : ""}`}
      >
        <div className="flex items-center space-x-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={player.avatarUrl || ""} alt={player.username} />
            <AvatarFallback>{player.username.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{player.username}</p>
            <p className="text-xs text-muted-foreground">{player.chips.toLocaleString()} фишек</p>
          </div>
          {getStatusBadge()}
        </div>

        {player.bet && player.bet > 0 && (
          <div className="mt-1 text-center text-xs font-medium bg-primary/20 rounded-sm py-0.5">
            Ставка: {player.bet.toLocaleString()}
          </div>
        )}

        {player.lastAction && <div className="mt-1 flex justify-center">{getLastActionBadge()}</div>}

        {player.cards && player.cards.length > 0 && (
          <div className="mt-2 flex justify-center space-x-1">
            {player.cards.map((card, index) => (
              <PlayingCard key={index} card={card} size="sm" />
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

