"use client"

import { PlayingCard } from "@/components/table/playing-card"

interface CommunityCardsProps {
  cards: string[]
  stage: string
}

export function CommunityCards({ cards, stage }: CommunityCardsProps) {
  const formatStageName = (stage: string) => {
    switch (stage) {
      case "PREFLOP":
        return "Префлоп"
      case "FLOP":
        return "Флоп"
      case "TURN":
        return "Тёрн"
      case "RIVER":
        return "Ривер"
      case "SHOWDOWN":
        return "Вскрытие"
      default:
        return stage
    }
  }

  // Определяем, сколько карт показывать в зависимости от стадии
  const visibleCards = (() => {
    switch (stage) {
      case "PREFLOP":
        return 0
      case "FLOP":
        return 3
      case "TURN":
        return 4
      case "RIVER":
      case "SHOWDOWN":
        return 5
      default:
        return 0
    }
  })()

  if (visibleCards === 0) {
    return null
  }

  return (
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
      <div className="text-white text-sm mb-2">{formatStageName(stage)}</div>
      <div className="flex space-x-2">
        {cards.slice(0, visibleCards).map((card, index) => (
          <PlayingCard key={index} card={card} />
        ))}
      </div>
    </div>
  )
}

