"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import type { Player, Game } from "@/lib/socket-client"

interface BettingControlsProps {
  game: Game
  player: Player
  onAction: (action: { type: string; amount?: number }) => void
}

export function BettingControls({ game, player, onAction }: BettingControlsProps) {
  const [betAmount, setBetAmount] = useState<number>(0)
  const [timeLeft, setTimeLeft] = useState<number>(game.timebank || 30)

  // Расчет минимальной и максимальной ставки
  const minBet = game.currentBet > 0 ? game.currentBet * 2 : game.currentBet + 1
  const maxBet = player.chips

  // Получение доступных действий
  const getAvailableActions = () => {
    const actions = []

    // Фолд всегда доступен
    actions.push("fold")

    // Чек доступен, если нет текущей ставки или игрок уже сделал ставку равную текущей
    if (game.currentBet === 0 || (player.bet && player.bet === game.currentBet)) {
      actions.push("check")
    }

    // Колл доступен, если есть текущая ставка и у игрока достаточно фишек
    if (game.currentBet > 0 && (player.bet || 0) < game.currentBet && player.chips > 0) {
      actions.push("call")
    }

    // Бет доступен, если нет текущей ставки и у игрока достаточно фишек
    if (game.currentBet === 0 && player.chips > 0) {
      actions.push("bet")
    }

    // Рейз доступен, если есть текущая ставка и у игрока достаточно фишек для минимального рейза
    if (game.currentBet > 0 && player.chips >= minBet) {
      actions.push("raise")
    }

    // Олл-ин всегда доступен, если у игрока есть фишки
    if (player.chips > 0) {
      actions.push("all-in")
    }

    return actions
  }

  const availableActions = getAvailableActions()

  // Обработчики действий
  const handleFold = () => onAction({ type: "fold" })
  const handleCheck = () => onAction({ type: "check" })
  const handleCall = () => onAction({ type: "call" })
  const handleBet = () => onAction({ type: "bet", amount: betAmount })
  const handleRaise = () => onAction({ type: "raise", amount: betAmount })
  const handleAllIn = () => onAction({ type: "all-in" })

  // Расчет суммы для колла
  const callAmount = Math.min(game.currentBet - (player.bet || 0), player.chips)

  // Инициализация суммы ставки
  useEffect(() => {
    if (availableActions.includes("bet")) {
      setBetAmount(Math.min(player.chips, game.currentBet + 1))
    } else if (availableActions.includes("raise")) {
      setBetAmount(Math.min(player.chips, minBet))
    }
  }, [game.currentBet, player.chips, minBet, availableActions])

  // Таймер для хода
  useEffect(() => {
    if (player.isCurrentPlayer) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            // Автоматический фолд или чек при истечении времени
            if (availableActions.includes("check")) {
              handleCheck()
            } else {
              handleFold()
            }
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [player.isCurrentPlayer, availableActions])

  return (
    <div className="mt-4 p-4 bg-background rounded-md border">
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm">
          Ваши фишки: <span className="font-bold">{player.chips.toLocaleString()}</span>
        </div>
        <div className="text-sm">
          Текущая ставка: <span className="font-bold">{game.currentBet.toLocaleString()}</span>
        </div>
        <div className="text-sm">
          Время: <span className="font-bold">{timeLeft}с</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {availableActions.includes("fold") && (
          <Button variant="destructive" onClick={handleFold}>
            Фолд
          </Button>
        )}

        {availableActions.includes("check") && (
          <Button variant="outline" onClick={handleCheck}>
            Чек
          </Button>
        )}

        {availableActions.includes("call") && (
          <Button variant="default" onClick={handleCall}>
            Колл {callAmount.toLocaleString()}
          </Button>
        )}

        {availableActions.includes("bet") && (
          <Button variant="secondary" onClick={handleBet}>
            Бет {betAmount.toLocaleString()}
          </Button>
        )}

        {availableActions.includes("raise") && (
          <Button variant="secondary" onClick={handleRaise}>
            Рейз до {betAmount.toLocaleString()}
          </Button>
        )}

        {availableActions.includes("all-in") && (
          <Button variant="secondary" onClick={handleAllIn}>
            Олл-ин {player.chips.toLocaleString()}
          </Button>
        )}
      </div>

      {(availableActions.includes("bet") || availableActions.includes("raise")) && (
        <div className="mt-4 space-y-2">
          <div className="flex items-center space-x-2">
            <Slider
              value={[betAmount]}
              min={availableActions.includes("bet") ? 1 : minBet}
              max={maxBet}
              step={1}
              onValueChange={(value) => setBetAmount(value[0])}
            />
            <Input
              type="number"
              value={betAmount}
              onChange={(e) => {
                const value = Number.parseInt(e.target.value)
                if (!isNaN(value)) {
                  const min = availableActions.includes("bet") ? 1 : minBet
                  const clamped = Math.max(min, Math.min(maxBet, value))
                  setBetAmount(clamped)
                }
              }}
              className="w-24"
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{availableActions.includes("bet") ? "1" : minBet}</span>
            <span>{maxBet}</span>
          </div>
        </div>
      )}
    </div>
  )
}

