"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Search, Filter, X } from "lucide-react"

interface LobbyFiltersProps {
  onFilterChange: (filters: {
    search: string
    gameType: string
    blinds: string
    players: [number, number]
  }) => void
}

export function LobbyFilters({ onFilterChange }: LobbyFiltersProps) {
  const [search, setSearch] = useState("")
  const [gameType, setGameType] = useState("all")
  const [blinds, setBlinds] = useState("all")
  const [players, setPlayers] = useState<[number, number]>([0, 9])
  const [isFiltersVisible, setIsFiltersVisible] = useState(false)

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
    applyFilters(e.target.value, gameType, blinds, players)
  }

  const handleGameTypeChange = (value: string) => {
    setGameType(value)
    applyFilters(search, value, blinds, players)
  }

  const handleBlindsChange = (value: string) => {
    setBlinds(value)
    applyFilters(search, gameType, value, players)
  }

  const handlePlayersChange = (value: number[]) => {
    const newPlayers: [number, number] = [value[0], value[1]]
    setPlayers(newPlayers)
    applyFilters(search, gameType, blinds, newPlayers)
  }

  const applyFilters = (
    searchValue: string,
    gameTypeValue: string,
    blindsValue: string,
    playersValue: [number, number],
  ) => {
    onFilterChange({
      search: searchValue,
      gameType: gameTypeValue === "all" ? "" : gameTypeValue,
      blinds: blindsValue === "all" ? "" : blindsValue,
      players: playersValue,
    })
  }

  const resetFilters = () => {
    setSearch("")
    setGameType("all")
    setBlinds("all")
    setPlayers([0, 9])
    onFilterChange({
      search: "",
      gameType: "",
      blinds: "",
      players: [0, 9],
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Поиск столов..." value={search} onChange={handleSearchChange} className="pl-8" />
        </div>
        <Button variant="outline" size="icon" onClick={() => setIsFiltersVisible(!isFiltersVisible)}>
          <Filter className="h-4 w-4" />
        </Button>
        {(search || gameType !== "all" || blinds !== "all" || players[0] > 0 || players[1] < 9) && (
          <Button variant="ghost" size="icon" onClick={resetFilters} title="Сбросить фильтры">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {isFiltersVisible && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-md">
          <div className="space-y-2">
            <Label htmlFor="gameType">Тип игры</Label>
            <Select value={gameType} onValueChange={handleGameTypeChange}>
              <SelectTrigger id="gameType">
                <SelectValue placeholder="Выберите тип игры" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все типы</SelectItem>
                <SelectItem value="CASH">Кэш</SelectItem>
                <SelectItem value="TOURNAMENT">Турнир</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="blinds">Блайнды</Label>
            <Select value={blinds} onValueChange={handleBlindsChange}>
              <SelectTrigger id="blinds">
                <SelectValue placeholder="Выберите блайнды" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все блайнды</SelectItem>
                <SelectItem value="1/2">1/2</SelectItem>
                <SelectItem value="2/5">2/5</SelectItem>
                <SelectItem value="5/10">5/10</SelectItem>
                <SelectItem value="10/20">10/20</SelectItem>
                <SelectItem value="25/50">25/50</SelectItem>
                <SelectItem value="50/100">50/100</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Количество игроков</Label>
              <span className="text-sm text-muted-foreground">
                {players[0]} - {players[1]}
              </span>
            </div>
            <Slider
              defaultValue={[0, 9]}
              value={[players[0], players[1]]}
              min={0}
              max={9}
              step={1}
              onValueChange={handlePlayersChange}
            />
          </div>
        </div>
      )}
    </div>
  )
}

