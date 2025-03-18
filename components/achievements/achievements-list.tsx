"use client"

import { useState, useEffect } from "react"
import { AchievementCard } from "./achievement-card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { Search, Award, Loader2 } from "lucide-react"
import type { Achievement } from "@/types/statistics"

interface UserAchievement extends Achievement {
  progress?: number
  maxProgress?: number
  isUnlocked: boolean
}

export function AchievementsList() {
  const { token } = useAuth()
  const [achievements, setAchievements] = useState<UserAchievement[]>([])
  const [filteredAchievements, setFilteredAchievements] = useState<UserAchievement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [activeTab, setActiveTab] = useState("all")

  // Fetch achievements on component mount
  useEffect(() => {
    if (token) {
      fetchAchievements()
    }
  }, [token])

  // Apply filters when dependencies change
  useEffect(() => {
    applyFilters()
  }, [achievements, searchQuery, categoryFilter, statusFilter, activeTab])

  const fetchAchievements = async () => {
    if (!token) return

    setIsLoading(true)
    try {
      const response = await fetch("/api/achievements", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch achievements")
      }

      const data = await response.json()
      setAchievements(data.achievements || [])
    } catch (error) {
      console.error("Error fetching achievements:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить список достижений",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...achievements]

    // Apply tab filter
    if (activeTab === "unlocked") {
      filtered = filtered.filter((a) => a.isUnlocked)
    } else if (activeTab === "locked") {
      filtered = filtered.filter((a) => !a.isUnlocked)
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (a) => a.name.toLowerCase().includes(query) || a.description.toLowerCase().includes(query),
      )
    }

    // Apply category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter((a) => a.category === categoryFilter)
    }

    // Apply status filter
    if (statusFilter === "unlocked") {
      filtered = filtered.filter((a) => a.isUnlocked)
    } else if (statusFilter === "locked") {
      filtered = filtered.filter((a) => !a.isUnlocked)
    }

    setFilteredAchievements(filtered)
  }

  const getAchievementCategories = () => {
    const categories = new Set<string>()
    achievements.forEach((a) => categories.add(a.category))
    return Array.from(categories)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center">
          <Award className="h-6 w-6 mr-2" />
          Достижения
        </h2>
        <div className="text-sm text-gray-500">
          Разблокировано: {achievements.filter((a) => a.isUnlocked).length} из {achievements.length}
        </div>
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="all">Все</TabsTrigger>
          <TabsTrigger value="unlocked">Полученные</TabsTrigger>
          <TabsTrigger value="locked">Не полученные</TabsTrigger>
        </TabsList>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-grow">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
            <Input
              placeholder="Поиск достижений..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>

          <div className="flex gap-2">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Категория" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все категории</SelectItem>
                {getAchievementCategories().map((category) => (
                  <SelectItem key={category} value={category}>
                    {category === "general" && "Общие"}
                    {category === "cash_games" && "Кэш-игры"}
                    {category === "tournaments" && "Турниры"}
                    {category === "social" && "Социальные"}
                    {category === "special" && "Особые"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Статус" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все статусы</SelectItem>
                <SelectItem value="unlocked">Полученные</SelectItem>
                <SelectItem value="locked">Не полученные</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <TabsContent value="all" className="mt-0">
          {renderAchievementsList()}
        </TabsContent>

        <TabsContent value="unlocked" className="mt-0">
          {renderAchievementsList()}
        </TabsContent>

        <TabsContent value="locked" className="mt-0">
          {renderAchievementsList()}
        </TabsContent>
      </Tabs>
    </div>
  )

  function renderAchievementsList() {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )
    }

    if (filteredAchievements.length === 0) {
      return (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <Award className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p>Достижения не найдены</p>
          {searchQuery && (
            <button className="text-primary hover:underline mt-2" onClick={() => setSearchQuery("")}>
              Сбросить поиск
            </button>
          )}
        </div>
      )
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAchievements.map((achievement) => (
          <AchievementCard
            key={achievement.id}
            achievement={achievement}
            isUnlocked={achievement.isUnlocked}
            progress={achievement.progress}
            maxProgress={achievement.maxProgress}
          />
        ))}
      </div>
    )
  }
}

