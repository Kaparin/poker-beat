"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"
import { Users, DollarSign } from "lucide-react"

interface TableCardProps {
  id: string
  name: string
  gameType: string
  blinds: string
  currentPlayers: number
  maxPlayers: number
}

export function TableCard({ id, name, gameType, blinds, currentPlayers, maxPlayers }: TableCardProps) {
  const router = useRouter()
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false)
  const [selectedSeat, setSelectedSeat] = useState<string>("")
  const [buyIn, setBuyIn] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)

  // Получение минимального бай-ина из строки блайндов
  const getMinBuyIn = () => {
    const blindsValues = blinds.split("/")
    if (blindsValues.length === 2) {
      const bigBlind = Number.parseInt(blindsValues[1])
      return bigBlind * 20 // Минимальный бай-ин обычно 20 больших блайндов
    }
    return 1000 // Значение по умолчанию
  }

  const handleJoin = async () => {
    if (!selectedSeat || !buyIn) {
      toast({
        title: "Ошибка",
        description: "Выберите место и укажите сумму бай-ина",
        variant: "destructive",
      })
      return
    }

    const buyInAmount = Number.parseInt(buyIn)
    const minBuyIn = getMinBuyIn()

    if (buyInAmount < minBuyIn) {
      toast({
        title: "Ошибка",
        description: `Минимальный бай-ин: ${minBuyIn} фишек`,
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(`/api/tables/${id}/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          seatNumber: Number.parseInt(selectedSeat),
          buyIn: buyInAmount,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Не удалось присоединиться к столу")
      }

      toast({
        title: "Успешно",
        description: "Вы присоединились к столу",
      })

      // Перенаправление на страницу стола
      router.push(`/tables/${id}`)
    } catch (error) {
      console.error("Error joining table:", error)
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось присоединиться к столу",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setIsJoinDialogOpen(false)
    }
  }

  const handleSpectate = () => {
    router.push(`/tables/${id}/spectate`)
  }

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="flex justify-between items-center">
            <span>{name}</span>
            <Badge variant={gameType === "CASH" ? "default" : "secondary"}>
              {gameType === "CASH" ? "Кэш" : "Турнир"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-2">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center">
              <DollarSign className="h-4 w-4 mr-1 text-muted-foreground" />
              <span>Блайнды: {blinds}</span>
            </div>
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-1 text-muted-foreground" />
              <span>
                {currentPlayers}/{maxPlayers}
              </span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between pt-2">
          <Button variant="outline" size="sm" onClick={handleSpectate}>
            Наблюдать
          </Button>
          <Button size="sm" onClick={() => setIsJoinDialogOpen(true)} disabled={currentPlayers >= maxPlayers}>
            Присоединиться
          </Button>
        </CardFooter>
      </Card>

      <Dialog open={isJoinDialogOpen} onOpenChange={setIsJoinDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Присоединиться к столу</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="seat" className="text-right">
                Место
              </Label>
              <Select value={selectedSeat} onValueChange={setSelectedSeat}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Выберите место" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: maxPlayers }, (_, i) => (
                    <SelectItem key={i + 1} value={(i + 1).toString()}>
                      Место {i + 1}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="buyIn" className="text-right">
                Бай-ин
              </Label>
              <Input
                id="buyIn"
                type="number"
                min={getMinBuyIn()}
                value={buyIn}
                onChange={(e) => setBuyIn(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="col-span-4 text-sm text-muted-foreground">Минимальный бай-ин: {getMinBuyIn()} фишек</div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsJoinDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleJoin} disabled={isLoading}>
              {isLoading ? "Загрузка..." : "Присоединиться"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

