"use client"

import { forwardRef } from "react"
import type { Card as CardType } from "@/types/poker"
import { cn } from "@/lib/utils"

interface CardProps {
  card?: CardType
  className?: string
}

export const Card = forwardRef<HTMLDivElement, CardProps>(({ card, className }, ref) => {
  if (!card) {
    return (
      <div
        ref={ref}
        className={cn("w-16 h-24 rounded-md bg-gray-200 dark:bg-gray-700 flex items-center justify-center", className)}
      >
        <span className="text-gray-400 dark:text-gray-500">?</span>
      </div>
    )
  }

  if (card.faceDown) {
    return (
      <div
        ref={ref}
        className={cn(
          "w-16 h-24 rounded-md bg-blue-600 dark:bg-blue-800 border-2 border-white dark:border-gray-700",
          "flex items-center justify-center relative overflow-hidden",
          className,
        )}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-10 h-16 rounded-md bg-blue-500 dark:bg-blue-700 flex items-center justify-center">
            <div className="w-6 h-10 rounded border-2 border-blue-400 dark:border-blue-600"></div>
          </div>
        </div>
      </div>
    )
  }

  const suitColor =
    card.suit === "hearts" || card.suit === "diamonds" ? "text-red-600 dark:text-red-400" : "text-black dark:text-white"

  const suitSymbol = {
    hearts: "♥",
    diamonds: "♦",
    clubs: "♣",
    spades: "♠",
  }[card.suit]

  return (
    <div
      ref={ref}
      className={cn(
        "w-16 h-24 rounded-md bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600",
        "flex flex-col p-1 relative",
        className,
      )}
    >
      <div className="flex justify-between items-center">
        <div className={`text-sm font-bold ${suitColor}`}>{card.rank}</div>
        <div className={`text-sm ${suitColor}`}>{suitSymbol}</div>
      </div>
      <div className={`flex-grow flex items-center justify-center text-2xl ${suitColor}`}>{suitSymbol}</div>
      <div className="flex justify-between items-center rotate-180">
        <div className={`text-sm font-bold ${suitColor}`}>{card.rank}</div>
        <div className={`text-sm ${suitColor}`}>{suitSymbol}</div>
      </div>
    </div>
  )
})

Card.displayName = "Card"

