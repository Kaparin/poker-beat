"use client"

import { forwardRef } from "react"
import Image from "next/image"
import type { PlayerState } from "@/types/poker"
import { Card } from "./card"
import { Chip } from "./chip"
import { DealerButton } from "./dealer-button"
import { cn } from "@/lib/utils"

interface PlayerSeatProps {
  player: PlayerState
  isCurrentPlayer?: boolean
  className?: string
}

export const PlayerSeat = forwardRef<HTMLDivElement, PlayerSeatProps>(({ player, isCurrentPlayer, className }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "w-40 flex flex-col items-center",
        player.folded && "opacity-50",
        player.isTurn && "ring-2 ring-yellow-400 dark:ring-yellow-500 rounded-lg",
        isCurrentPlayer && "bg-blue-50 dark:bg-blue-900/20 rounded-lg p-1",
        className,
      )}
    >
      <div className="relative mb-1">
        {player.avatarUrl ? (
          <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-white dark:border-gray-800">
            <Image
              src={player.avatarUrl || "/placeholder.svg"}
              alt={player.name}
              width={48}
              height={48}
              className="object-cover"
            />
          </div>
        ) : (
          <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-lg font-bold">
            {player.name.charAt(0)}
          </div>
        )}

        {player.isDealer && <DealerButton type="dealer" className="absolute -bottom-1 -right-1" />}

        {player.isSmallBlind && <DealerButton type="small-blind" className="absolute -bottom-1 -right-1" />}

        {player.isBigBlind && <DealerButton type="big-blind" className="absolute -bottom-1 -right-1" />}
      </div>

      <div className="text-sm font-medium truncate max-w-full">{player.name}</div>

      <div className="flex items-center space-x-1 mt-1">
        <Chip value={player.chips} size="sm" />
        <span className="text-xs">{player.chips}</span>
      </div>

      {player.bet > 0 && (
        <div className="mt-2 flex flex-col items-center">
          <Chip value={player.bet} size="sm" />
          <span className="text-xs mt-0.5">{player.bet}</span>
        </div>
      )}

      <div className="flex space-x-1 mt-2">
        {player.cards.map((card, i) => (
          <Card key={i} card={card} className="w-10 h-14 transform scale-90" />
        ))}
      </div>

      {player.handResult && (
        <div className="mt-1 text-xs text-center bg-black/70 text-white px-2 py-0.5 rounded">
          {player.handResult.description}
        </div>
      )}

      {player.isAllIn && <div className="mt-1 text-xs bg-red-600 text-white px-2 py-0.5 rounded">ALL IN</div>}

      {player.folded && <div className="mt-1 text-xs bg-gray-600 text-white px-2 py-0.5 rounded">FOLD</div>}
    </div>
  )
})

PlayerSeat.displayName = "PlayerSeat"

