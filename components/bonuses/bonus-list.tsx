"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BonusCard } from "./bonus-card"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"

type BonusType = "welcome" | "deposit" | "daily" | "loyalty" | "special"

interface Bonus {
  id: number
  title: string
  description: string
  type: BonusType
  amount: number
  progress?: number
  requiredAction?: string
  expiresAt?: Date
  isActive: boolean
  isCompleted: boolean
}

export const BonusList: React.FC = () => {
  const [bonuses, setBonuses] = useState<Bonus[]>([])
  const [activeTab, setActiveTab] = useState<string>("all")
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchBonuses = async () => {
      try {
        const response = await fetch("/api/bonuses")
        if (!response.ok) {
          throw new Error("Не удалось загрузить бонусы")
        }
        const data = await response.json()
        setBonuses(data.bonuses)
      } catch (error) {
        console.error("Ошибка при загрузке бонусов:", error)
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить бонусы. Пожалуйста, попробуйте позже.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchBonuses()
  }, [toast])

  const handleActivateBonus = async (id: number) => {
    try {
      const response = await fetch(`/api/bonuses/${id}/activate`, {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Не удалось активировать бонус")
      }

      const data = await response.json()

      // Обновляем состояние бонуса в списке
      setBonuses((prevBonuses) => prevBonuses.map((bonus) => (bonus.id === id ? { ...bonus, isActive: true } : bonus)))

      toast({
        title: "Бонус активирован",
        description: data.message || "Бонус успешно активирован",
      })
    } catch (error) {
      console.error("Ошибка при активации бонуса:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось активировать бонус. Пожалуйста, попробуйте позже.",
        variant: "destructive",
      })
    }
  }

  const handleClaimBonus = async (id: number) => {
    try {
      const response = await fetch(`/api/bonuses/${id}/claim`, {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Не удалось получить награду")
      }

      const data = await response.json()

      // Обновляем состояние бонуса в списке
      setBonuses((prevBonuses) =>
        prevBonuses.map((bonus) => (bonus.id === id ? { ...bonus, isCompleted: true } : bonus)),
      )

      toast({
        title: "Награда получена",
        description: data.message || `Вы получили ${data.amount} фишек!`,
      })
    } catch (error) {
      console.error("Ошибка при получении награды:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось получить награду. Пожалуйста, попробуйте позже.",
        variant: "destructive",
      })
    }
  }

  const filteredBonuses = bonuses.filter((bonus) => {
    if (activeTab === "all") return true
    if (activeTab === "active") return bonus.isActive && !bonus.isCompleted
    if (activeTab === "available") return !bonus.isActive && !bonus.isCompleted
    if (activeTab === "completed") return bonus.isCompleted
    return bonus.type === activeTab
  })

  return (
    <div className="space-y-4">
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 md:grid-cols-7">
          <TabsTrigger value="all">Все</TabsTrigger>
          <TabsTrigger value="active">Активные</TabsTrigger>
          <TabsTrigger value="available">Доступные</TabsTrigger>
          <TabsTrigger value="completed">Завершенные</TabsTrigger>
          <TabsTrigger value="daily" className="hidden md:block">
            Ежедневные
          </TabsTrigger>
          <TabsTrigger value="deposit" className="hidden md:block">
            Депозит
          </TabsTrigger>
          <TabsTrigger value="special" className="hidden md:block">
            Специальные
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {loading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="h-[200px] w-full rounded-lg" />
                </div>
              ))}
            </div>
          ) : filteredBonuses.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredBonuses.map((bonus) => (
                <BonusCard key={bonus.id} {...bonus} onActivate={handleActivateBonus} onClaim={handleClaimBonus} />
              ))}
            </div>
          ) : (
            <div className="flex h-40 items-center justify-center rounded-lg border border-dashed">
              <p className="text-center text-muted-foreground">Нет доступных бонусов в этой категории</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

