"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Gift, Calendar, Clock } from "lucide-react"
import { formatDistance } from "date-fns"
import { ru } from "date-fns/locale"

export const DailyBonus: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [claimed, setClaimed] = useState(false)
  const [nextAvailable, setNextAvailable] = useState<Date | null>(null)
  const [streak, setStreak] = useState(0)
  const { toast } = useToast()

  useEffect(() => {
    // Проверяем, получал ли пользователь бонус сегодня
    const checkDailyBonusStatus = async () => {
      try {
        const response = await fetch("/api/bonuses/daily/status")
        if (response.ok) {
          const data = await response.json()
          setClaimed(data.claimed)
          if (data.claimed && data.nextAvailable) {
            setNextAvailable(new Date(data.nextAvailable))
          }
          setStreak(data.consecutiveLoginDays || 0)
        }
      } catch (error) {
        console.error("Ошибка при проверке статуса ежедневного бонуса:", error)
      }
    }

    checkDailyBonusStatus()
  }, [])

  const handleClaimDailyBonus = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/bonuses/daily", {
        method: "POST",
      })

      const data = await response.json()

      if (response.ok) {
        setClaimed(true)
        setNextAvailable(new Date(data.nextAvailable))
        setStreak(data.consecutiveLoginDays)

        toast({
          title: "Бонус получен!",
          description: data.message,
        })
      } else {
        toast({
          title: "Ошибка",
          description: data.message,
          variant: "destructive",
        })

        if (data.nextAvailable) {
          setNextAvailable(new Date(data.nextAvailable))
        }
      }
    } catch (error) {
      console.error("Ошибка при получении ежедневного бонуса:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось получить ежедневный бонус. Пожалуйста, попробуйте позже.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-amber-500 to-yellow-400 pb-2 text-white">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold">Ежедневный бонус</CardTitle>
          <Gift className="h-6 w-6" />
        </div>
        <CardDescription className="text-white/80">Получайте бонус каждый день</CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        {streak > 0 && (
          <div className="mb-3 flex items-center">
            <Calendar className="mr-2 h-5 w-5 text-amber-500" />
            <span className="text-sm">
              Серия входов:{" "}
              <strong>
                {streak} {streak === 1 ? "день" : streak < 5 ? "дня" : "дней"}
              </strong>
            </span>
          </div>
        )}

        <p className="text-sm">
          Заходите каждый день, чтобы получать бонусы. Чем дольше серия ежедневных входов, тем больше бонус!
        </p>

        {claimed && nextAvailable && (
          <div className="mt-3 flex items-center text-sm text-muted-foreground">
            <Clock className="mr-1 h-4 w-4" />
            <span>Следующий бонус доступен через {formatDistance(nextAvailable, new Date(), { locale: ru })}</span>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button
          variant={claimed ? "outline" : "default"}
          className="w-full"
          onClick={handleClaimDailyBonus}
          disabled={loading || claimed}
        >
          {loading ? "Загрузка..." : claimed ? "Уже получено сегодня" : "Получить бонус"}
        </Button>
      </CardFooter>
    </Card>
  )
}

