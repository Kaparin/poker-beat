"use client"

import { useState, useEffect } from "react"
import { TournamentCard } from "./tournament-card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Search } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import type { Tournament } from "@/types/tournament"

interface TournamentListProps {
  initialTournaments?: Tournament[]
}

export function TournamentList({ initialTournaments = [] }: TournamentListProps) {
  const { token, user } = useAuth()
  const [tournaments, setTournaments] = useState<Tournament[]>(initialTournaments)
  const [filteredTournaments, setFilteredTournaments] = useState<Tournament[]>(initialTournaments)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortBy, setSortBy] = useState("startTime")
  const [activeTab, setActiveTab] = useState("upcoming")
  const [registeredTournaments, setRegisteredTournaments] = useState<string[]>([])

  // Fetch tournaments on component mount
  useEffect(() => {
    if (token) {
      fetchTournaments()
      fetchRegisteredTournaments()
    }
  }, [token])

  // Apply filters when dependencies change
  useEffect(() => {
    applyFilters()
  }, [tournaments, searchQuery, statusFilter, sortBy, activeTab])

  const fetchTournaments = async () => {
    if (!token) return

    setIsLoading(true)
    try {
      const response = await fetch("/api/tournaments", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch tournaments")
      }

      const data = await response.json()
      setTournaments(data.tournaments || [])
    } catch (error) {
      console.error("Error fetching tournaments:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить список турниров",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchRegisteredTournaments = async () => {
    if (!token) return

    try {
      const response = await fetch("/api/tournaments/registered", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch registered tournaments")
      }

      const data = await response.json()
      setRegisteredTournaments(data.tournamentIds || [])
    } catch (error) {
      console.error("Error fetching registered tournaments:", error)
    }
  }

  const applyFilters = () => {
    let filtered = [...tournaments]

    // Apply tab filter
    if (activeTab === "upcoming") {
      filtered = filtered.filter((t) => ["SCHEDULED", "REGISTRATION_OPEN", "REGISTRATION_CLOSED"].includes(t.status))
    } else if (activeTab === "active") {
      filtered = filtered.filter((t) => ["RUNNING", "BREAK", "FINAL_TABLE"].includes(t.status))
    } else if (activeTab === "completed") {
      filtered = filtered.filter((t) => ["FINISHED", "CANCELLED"].includes(t.status))
    } else if (activeTab === "registered") {
      filtered = filtered.filter((t) => registeredTournaments.includes(t.id))
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (t) => t.name.toLowerCase().includes(query) || (t.description && t.description.toLowerCase().includes(query)),
      )
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((t) => t.status === statusFilter)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      if (sortBy === "startTime") {
        return new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      } else if (sortBy === "buyIn") {
        return a.buyIn + a.entryFee - (b.buyIn + b.entryFee)
      } else if (sortBy === "players") {
        return b.players.length - a.players.length
      } else if (sortBy === "prizePool") {
        return b.players.length * b.buyIn - a.players.length * a.buyIn
      }
      return 0
    })

    setFilteredTournaments(filtered)
  }

  const handleRegister = async (tournamentId: string, password?: string) => {
    if (!token) return

    try {
      const response = await fetch(`/api/tournaments/${tournamentId}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ password }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to register for tournament")
      }

      // Update registered tournaments list
      setRegisteredTournaments((prev) => [...prev, tournamentId])

      // Refresh tournaments data
      fetchTournaments()
    } catch (error) {
      console.error("Error registering for tournament:", error)
      throw error
    }
  }

  const handleUnregister = async (tournamentId: string) => {
    if (!token) return

    try {
      const response = await fetch(`/api/tournaments/${tournamentId}/unregister`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to unregister from tournament")
      }

      // Update registered tournaments list
      setRegisteredTournaments((prev) => prev.filter((id) => id !== tournamentId))

      // Refresh tournaments data
      fetchTournaments()
    } catch (error) {
      console.error("Error unregistering from tournament:", error)
      throw error
    }
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="upcoming" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="upcoming">Предстоящие</TabsTrigger>
          <TabsTrigger value="active">Активные</TabsTrigger>
          <TabsTrigger value="completed">Завершенные</TabsTrigger>
          <TabsTrigger value="registered">Мои турниры</TabsTrigger>
        </TabsList>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-grow">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
            <Input
              placeholder="Поиск турниров..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>

          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Статус" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все статусы</SelectItem>
                <SelectItem value="SCHEDULED">Запланированные</SelectItem>
                <SelectItem value="REGISTRATION_OPEN">Регистрация открыта</SelectItem>
                <SelectItem value="RUNNING">В процессе</SelectItem>
                <SelectItem value="FINISHED">Завершенные</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Сортировка" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="startTime">По времени начала</SelectItem>
                <SelectItem value="buyIn">По бай-ину</SelectItem>
                <SelectItem value="players">По количеству игроков</SelectItem>
                <SelectItem value="prizePool">По призовому фонду</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <TabsContent value="upcoming" className="mt-0">
          {renderTournamentList()}
        </TabsContent>

        <TabsContent value="active" className="mt-0">
          {renderTournamentList()}
        </TabsContent>

        <TabsContent value="completed" className="mt-0">
          {renderTournamentList()}
        </TabsContent>

        <TabsContent value="registered" className="mt-0">
          {renderTournamentList()}
        </TabsContent>
      </Tabs>
    </div>
  )

  function renderTournamentList() {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )
    }

    if (filteredTournaments.length === 0) {
      return (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <p>Турниры не найдены</p>
          {searchQuery && (
            <Button variant="link" onClick={() => setSearchQuery("")} className="mt-2">
              Сбросить поиск
            </Button>
          )}
        </div>
      )
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTournaments.map((tournament) => (
          <TournamentCard
            key={tournament.id}
            tournament={tournament}
            userBalance={user?.balance || 0}
            onRegister={handleRegister}
            onUnregister={handleUnregister}
            isRegistered={registeredTournaments.includes(tournament.id)}
          />
        ))}
      </div>
    )
  }
}

