"use client"

import type React from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Clock, Gift, Award, Zap } from "lucide-react"
import { formatDistance } from "date-fns"
import { ru } from "date-fns/locale"

interface BonusCardProps {
  id: number
  title: string
  description: string
  type: "welcome" | "deposit" | "daily" | "loyalty" | "special"
  amount: number
  progress?: number
  requiredAction?: string
  expiresAt?: Date
  isActive: boolean
  isCompleted: boolean
  onActivate?: (id: number) => void
  onClaim?: (id: number) => void
}

export const BonusCard: React.FC<BonusCardProps> = ({
  id,
  title,
  description,
  type,
  amount,
  progress = 0,
  requiredAction,
  expiresAt,
  isActive,
  isCompleted,
  onActivate,
  onClaim,
}) => {
  const getIcon = () => {
    switch (type) {
      case "welcome":
        return <Gift className="h-6 w-6 text-green-500" />
      case "deposit":
        return <Zap className="h-6 w-6 text-blue-500" />
      case "daily":
        return <Clock className="h-6 w-6 text-amber-500" />
      case "loyalty":
        return <Award className="h-6 w-6 text-purple-500" />
      case "special":
        return <Gift className="h-6 w-6 text-red-500" />
      default:
        return <Gift className="h-6 w-6" />
    }
  }

  const getTypeLabel = () => {
    switch (type) {
      case "welcome":
        return "Приветственный бонус"
      case "deposit":
        return "Бонус за депозит"
      case "daily":
        return "Ежедневный бонус"
      case "loyalty":
        return "Бонус лояльности"
      case "special":
        return "Специальный бонус"
      default:
        return "Бонус"
    }
  }

  const getStatusText = () => {
    if (isCompleted) {
      return "Получено"
    }
    if (isActive) {
      return requiredAction || "В процессе"
    }
    return "Не активировано"
  }

  return (
    <Card className="w-full overflow-hidden transition-all duration-200 hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold">{title}</CardTitle>
          {getIcon()}
        </div>
        <CardDescription className="text-xs text-muted-foreground">{getTypeLabel()}</CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <p className="mb-2 text-sm">{description}</p>

        {isActive && !isCompleted && progress > 0 && (
          <div className="mb-3 space-y-1">
            <div className="flex justify-between text-xs">
              <span>Прогресс</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Награда:</span>
          <span className="font-bold text-green-600">{amount.toLocaleString()} фишек</span>
        </div>

        {expiresAt && (
          <div className="mt-2 flex items-center text-xs text-muted-foreground">
            <Clock className="mr-1 h-3 w-3" />
            <span>Истекает через {formatDistance(expiresAt, new Date(), { locale: ru })}</span>
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-2">
        {isCompleted ? (
          <Button variant="outline" className="w-full" disabled>
            Получено
          </Button>
        ) : isActive ? (
          <Button variant="default" className="w-full" onClick={() => onClaim && onClaim(id)} disabled={progress < 100}>
            {progress >= 100 ? "Получить награду" : getStatusText()}
          </Button>
        ) : (
          <Button variant="outline" className="w-full" onClick={() => onActivate && onActivate(id)}>
            Активировать
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}

