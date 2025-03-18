"use client"

interface PlayingCardProps {
  card: string
  size?: "sm" | "md" | "lg"
}

export function PlayingCard({ card, size = "md" }: PlayingCardProps) {
  const sizeClasses = {
    sm: "w-8 h-12",
    md: "w-12 h-16",
    lg: "w-16 h-24",
  }

  const fontSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  }

  // Если карта скрыта (рубашкой вверх)
  if (card === "back" || card === "?") {
    return (
      <div
        className={`${sizeClasses[size]} bg-blue-800 rounded-md flex items-center justify-center border-2 border-white`}
      >
        <div className="bg-white/20 w-3/4 h-3/4 rounded-sm"></div>
      </div>
    )
  }

  // Парсинг карты (например, "AS" -> туз пик)
  const value = card.charAt(0)
  const suit = card.charAt(1)

  const displayValue = (() => {
    switch (value) {
      case "A":
        return "A"
      case "K":
        return "K"
      case "Q":
        return "Q"
      case "J":
        return "J"
      case "T":
        return "10"
      default:
        return value
    }
  })()

  const suitSymbol = (() => {
    switch (suit) {
      case "S":
        return "♠" // пики
      case "H":
        return "♥" // червы
      case "D":
        return "♦" // бубны
      case "C":
        return "♣" // трефы
      default:
        return suit
    }
  })()

  const suitColor = (() => {
    switch (suit) {
      case "H": // червы
      case "D": // бубны
        return "text-red-500"
      default:
        return "text-black"
    }
  })()

  return (
    <div
      className={`${sizeClasses[size]} bg-white rounded-md flex flex-col items-center justify-center border-2 border-gray-300`}
    >
      <div className={`${fontSizeClasses[size]} font-bold ${suitColor}`}>{displayValue}</div>
      <div className={`${fontSizeClasses[size]} ${suitColor}`}>{suitSymbol}</div>
    </div>
  )
}

