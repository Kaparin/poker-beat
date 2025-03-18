"use client"

import React from "react"

import { useState } from "react"
import type { PlayerAction } from "@/types/poker"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

interface BettingControlsProps {
  canCheck: boolean
  canCall: boolean
  canBet: boolean
  canRaise: boolean
  callAmount: number
  minBet: number
  maxBet: number
  onAction: (action: PlayerAction, amount?: number) => void
  disabled?: boolean
  className?: string
}

export function BettingControls({
  canCheck,
  canCall,
  canBet,
  canRaise,
  callAmount,
  minBet,
  maxBet,
  onAction,
  disabled = false,
  className,
}: BettingControlsProps) {
  const [betAmount, setBetAmount] = useState(minBet)
  const [showBetSlider, setShowBetSlider] = useState(false)

  const handleBetChange = (value: number[]) => {
    setBetAmount(value[0])
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseInt(e.target.value)
    if (!isNaN(value) && value >= minBet && value <= maxBet) {
      setBetAmount(value)
    }
  }

  const handleBetAction = () => {
    if (disabled) return

    if (canBet) {
      onAction("bet", betAmount)
    } else if (canRaise) {
      onAction("raise", betAmount)
    }
    setShowBetSlider(false)
  }

  // Обновляем betAmount при изменении minBet
  React.useEffect(() => {
    if (minBet > 0 && (!betAmount || betAmount < minBet)) {
      setBetAmount(minBet)
    }
  }, [minBet, betAmount])

  return (
    <div className={cn("flex flex-col space-y-4", className)}>
      {showBetSlider ? (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg">
          <div className="flex items-center space-x-2 mb-4">
            <Input
              type="number"
              min={minBet}
              max={maxBet}
              value={betAmount}
              onChange={handleInputChange}
              className="w-24"
              disabled={disabled}
            />
            <span className="text-sm">фишек</span>
          </div>

          <Slider
            value={[betAmount]}
            min={minBet}
            max={maxBet}
            step={5}
            onValueChange={handleBetChange}
            className="mb-4"
            disabled={disabled}
          />

          <div className="flex justify-between text-xs text-gray-500 mb-4">
            <span>Мин: {minBet}</span>
            <span>Макс: {maxBet}</span>
          </div>

          <div className="flex space-x-2">
            <Button onClick={handleBetAction} className="flex-1" disabled={disabled}>
              {disabled ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              {canBet ? "Ставка" : "Повысить"}
            </Button>
            <Button variant="outline" onClick={() => setShowBetSlider(false)} disabled={disabled}>
              Отмена
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex space-x-2">
          <Button variant="destructive" onClick={() => onAction("fold")} className="flex-1" disabled={disabled}>
            {disabled ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Фолд
          </Button>

          {canCheck && (
            <Button variant="outline" onClick={() => onAction("check")} className="flex-1" disabled={disabled}>
              {disabled ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Чек
            </Button>
          )}

          {canCall && (
            <Button variant="outline" onClick={() => onAction("call")} className="flex-1" disabled={disabled}>
              {disabled ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Колл {callAmount}
            </Button>
          )}

          {(canBet || canRaise) && (
            <Button variant="default" onClick={() => setShowBetSlider(true)} className="flex-1" disabled={disabled}>
              {disabled ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              {canBet ? "Ставка" : "Рейз"}
            </Button>
          )}

          <Button variant="secondary" onClick={() => onAction("all-in")} className="flex-1" disabled={disabled}>
            {disabled ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Ва-банк
          </Button>
        </div>
      )}
    </div>
  )
}

