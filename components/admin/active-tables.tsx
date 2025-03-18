"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type PokerTable = {
  id: string
  name: string
  game_type: "texas_holdem" | "omaha" | "five_card_draw"
  stakes: string
  max_players: number
  current_players: number
  status: "active" | "inactive" | "full"
}

export default function ActiveTables() {
  const [tables, setTables] = useState<PokerTable[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTables = async () => {
      try {
        const response = await fetch("/api/admin/tables?status=active")

        if (!response.ok) {
          throw new Error("Failed to fetch tables")
        }

        const data = await response.json()
        setTables(data)
      } catch (error) {
        console.error("Error fetching tables:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchTables()
  }, [])

  const getGameTypeLabel = (type: string) => {
    switch (type) {
      case "texas_holdem":
        return "Техасский холдем"
      case "omaha":
        return "Омаха"
      case "five_card_draw":
        return "Пятикарточный дро-покер"
      default:
        return type
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500">Активен</Badge>
      case "inactive":
        return <Badge variant="outline">Неактивен</Badge>
      case "full":
        return <Badge className="bg-blue-500">Заполнен</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">Активные столы</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            ))}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Название</TableHead>
                <TableHead>Тип игры</TableHead>
                <TableHead>Ставки</TableHead>
                <TableHead>Игроки</TableHead>
                <TableHead>Статус</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tables.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4 text-gray-500 dark:text-gray-400">
                    Нет активных столов
                  </TableCell>
                </TableRow>
              ) : (
                tables.map((table) => (
                  <TableRow key={table.id}>
                    <TableCell className="font-medium">{table.name}</TableCell>
                    <TableCell>{getGameTypeLabel(table.game_type)}</TableCell>
                    <TableCell>{table.stakes}</TableCell>
                    <TableCell>
                      {table.current_players} / {table.max_players}
                    </TableCell>
                    <TableCell>{getStatusBadge(table.status)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}

        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Link href="/admin/tables">
            <Button variant="outline" className="w-full">
              Все столы
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

