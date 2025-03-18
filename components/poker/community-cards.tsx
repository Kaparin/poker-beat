"use client"
import type { Card as CardType } from "@/types/poker"
import { Card } from "./card"
import { cn } from "@/lib/utils"

interface CommunityCardsProps {
  cards: CardType[]
  registerCardRef?: (card: CardType, element: HTMLDivElement | null) => void
  className?: string
}

export function CommunityCards({ cards, registerCardRef, className }: CommunityCardsProps) {
  // Fill with empty cards if less than 5
  const displayCards = [...cards]
  while (displayCards.length < 5) {
    displayCards.push(undefined as any)
  }

  return (
    <div className={cn("flex justify-center space-x-2", className)}>
      {displayCards.map((card, i) => (
        <Card key={i} card={card} ref={card ? (el) => registerCardRef?.(card, el) : undefined} />
      ))}
    </div>
  )
}

