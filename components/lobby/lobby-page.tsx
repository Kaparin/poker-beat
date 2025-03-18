"use client"

import { useEffect, useState } from "react"
import { TableCard } from "@/components/lobby/table-card"
import { LobbyFilters } from "@/components/lobby/lobby-filters"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/hooks/use-toast"
import { RefreshCw } from "lucide-react"

interface Table {
  id: string
  name: string
  gameType: string
  blinds: string
  currentPlayers: number
  maxPlayers: number
}

export function LobbyPage() {
  const [tables, setTables] = useState<Table[]>([])
  const [filteredTables, setFilteredTables] = useState<Table[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchTables()
  }, [])

  const fetchTables = async () => {
    try {
      const response = await fetch("/api/tables")

      if (!response.ok) {
        throw new Error("Failed to fetch tables")
      }

      const data = await response.json()
      setTables(data)
      setFilteredTables(data)
    } catch (error) {
      console.error("Error fetching tables:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить список столов",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    fetchTables()
  }

  const handleFilterChange = (filters: {
    search: string
    gameType: string
    blinds: string
    players: [number, number]
  }) => {
    const filtered = tables.filter((table) => {
      // Фильтр по поиску
      if (filters.search && !table.name.toLowerCase().includes(filters.search.toLowerCase())) {
        return false
      }

      // Фильтр по типу игры
      if (filters.gameType && table.gameType !== filters.gameType) {
        return false
      }

      // Фильтр по блайндам
      if (filters.blinds && table.blinds !== filters.blinds) {
        return false
      }

      // Фильтр по количеству игроков
      if (table.currentPlayers < filters.players[0] || table.currentPlayers > filters.players[1]) {
        return false
      }

      return true
    })

    setFilteredTables(filtered)
  }

  const renderTableList = (gameType: string) => {
    const tabTables = filteredTables.filter((table) => gameType === "all" || table.gameType === gameType)

    if (tabTables.length === 0) {
      return <div className="text-center py-8 text-muted-foreground">Нет доступных столов</div>
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tabTables.map((table) => (
          <TableCard
            key={table.id}
            id={table.id}
            name={table.name}
            gameType={table.gameType}
            blinds={table.blinds}
            currentPlayers={table.currentPlayers}
            maxPlayers={table.maxPlayers}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Лобби</h1>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          Обновить
        </Button>
      </div>

      <LobbyFilters onFilterChange={handleFilterChange} />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-[150px] rounded-md" />
          ))}
        </div>
      ) : (
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">Все столы</TabsTrigger>
            <TabsTrigger value="CASH">Кэш</TabsTrigger>
            <TabsTrigger value="TOURNAMENT">Турниры</TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="mt-6">
            {renderTableList("all")}
          </TabsContent>
          <TabsContent value="CASH" className="mt-6">
            {renderTableList("CASH")}
          </TabsContent>
          <TabsContent value="TOURNAMENT" className="mt-6">
            {renderTableList("TOURNAMENT")}
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}

