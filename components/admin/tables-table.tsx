"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, Search, Edit, Eye, Plus, X } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface PokerTable {
  id: string
  name: string
  game_type: string
  stakes: string
  min_buy_in: number
  max_buy_in: number
  max_players: number
  status: string
  created_at: string
  updated_at: string
}

export function TablesTable() {
  const [tables, setTables] = useState<PokerTable[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTable, setSelectedTable] = useState<PokerTable | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [dialogType, setDialogType] = useState<"view" | "edit" | "create">("view")
  const [editForm, setEditForm] = useState({
    name: "",
    game_type: "",
    stakes: "",
    min_buy_in: 0,
    max_buy_in: 0,
    max_players: 0,
    status: "",
  })

  useEffect(() => {
    fetchTables()
  }, [])

  const fetchTables = async () => {
    try {
      const token = localStorage.getItem("adminToken")
      const response = await fetch("/api/admin/tables", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Ошибка загрузки столов")
      }

      const data = await response.json()
      setTables(data)
    } catch (error) {
      console.error("Ошибка загрузки столов:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateTable = async () => {
    try {
      const token = localStorage.getItem("adminToken")
      const response = await fetch("/api/admin/tables", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editForm),
      })

      if (!response.ok) {
        throw new Error("Ошибка создания стола")
      }

      // Обновляем список столов
      fetchTables()
      setIsDialogOpen(false)
    } catch (error) {
      console.error("Ошибка создания стола:", error)
    }
  }

  const handleEditTable = async () => {
    if (!selectedTable) return

    try {
      const token = localStorage.getItem("adminToken")
      const response = await fetch(`/api/admin/tables/${selectedTable.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editForm),
      })

      if (!response.ok) {
        throw new Error("Ошибка обновления стола")
      }

      // Обновляем список столов
      fetchTables()
      setIsDialogOpen(false)
    } catch (error) {
      console.error("Ошибка обновления стола:", error)
    }
  }

  const handleCloseTable = async (tableId: string) => {
    try {
      const token = localStorage.getItem("adminToken")
      const response = await fetch(`/api/admin/tables/${tableId}/close`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Ошибка закрытия стола")
      }

      // Обновляем список столов
      fetchTables()
    } catch (error) {
      console.error("Ошибка закрытия стола:", error)
    }
  }

  const openDialog = (table: PokerTable | null, type: "view" | "edit" | "create") => {
    setSelectedTable(table)
    setDialogType(type)

    if (type === "create") {
      setEditForm({
        name: "",
        game_type: "texas_holdem",
        stakes: "1/2",
        min_buy_in: 100,
        max_buy_in: 200,
        max_players: 9,
        status: "active",
      })
    } else if (type === "edit" && table) {
      setEditForm({
        name: table.name,
        game_type: table.game_type,
        stakes: table.stakes,
        min_buy_in: table.min_buy_in,
        max_buy_in: table.max_buy_in,
        max_players: table.max_players,
        status: table.status,
      })
    }

    setIsDialogOpen(true)
  }

  const filteredTables = tables.filter(
    (table) =>
      table.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      table.game_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      table.stakes.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500">Активен</Badge>
      case "closed":
        return <Badge variant="destructive">Закрыт</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getGameTypeName = (gameType: string) => {
    switch (gameType) {
      case "texas_holdem":
        return "Техасский холдем"
      case "omaha":
        return "Омаха"
      case "stud":
        return "Стад"
      default:
        return gameType
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Поиск столов..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button onClick={() => openDialog(null, "create")}>
          <Plus className="h-4 w-4 mr-2" />
          Создать стол
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Название</TableHead>
              <TableHead>Тип игры</TableHead>
              <TableHead>Ставки</TableHead>
              <TableHead>Мин. бай-ин</TableHead>
              <TableHead>Макс. бай-ин</TableHead>
              <TableHead>Макс. игроков</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead>Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTables.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center">
                  Столы не найдены
                </TableCell>
              </TableRow>
            ) : (
              filteredTables.map((table) => (
                <TableRow key={table.id}>
                  <TableCell>{table.name}</TableCell>
                  <TableCell>{getGameTypeName(table.game_type)}</TableCell>
                  <TableCell>{table.stakes}</TableCell>
                  <TableCell>{table.min_buy_in}</TableCell>
                  <TableCell>{table.max_buy_in}</TableCell>
                  <TableCell>{table.max_players}</TableCell>
                  <TableCell>{getStatusBadge(table.status)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openDialog(table, "view")}>
                          <Eye className="h-4 w-4 mr-2" />
                          Просмотр
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openDialog(table, "edit")}>
                          <Edit className="h-4 w-4 mr-2" />
                          Редактировать
                        </DropdownMenuItem>
                        {table.status === "active" && (
                          <DropdownMenuItem onClick={() => handleCloseTable(table.id)}>
                            <X className="h-4 w-4 mr-2" />
                            Закрыть стол
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Диалоговое окно для просмотра/редактирования/создания стола */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogType === "view"
                ? `Стол: ${selectedTable?.name}`
                : dialogType === "edit"
                  ? "Редактирование стола"
                  : "Создание нового стола"}
            </DialogTitle>
          </DialogHeader>

          {dialogType === "view" && selectedTable && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Название</Label>
                  <div className="mt-1">{selectedTable.name}</div>
                </div>
                <div>
                  <Label>Тип игры</Label>
                  <div className="mt-1">{getGameTypeName(selectedTable.game_type)}</div>
                </div>
                <div>
                  <Label>Ставки</Label>
                  <div className="mt-1">{selectedTable.stakes}</div>
                </div>
                <div>
                  <Label>Мин. бай-ин</Label>
                  <div className="mt-1">{selectedTable.min_buy_in}</div>
                </div>
                <div>
                  <Label>Макс. бай-ин</Label>
                  <div className="mt-1">{selectedTable.max_buy_in}</div>
                </div>
                <div>
                  <Label>Макс. игроков</Label>
                  <div className="mt-1">{selectedTable.max_players}</div>
                </div>
                <div>
                  <Label>Статус</Label>
                  <div className="mt-1">{getStatusBadge(selectedTable.status)}</div>
                </div>
                <div>
                  <Label>Дата создания</Label>
                  <div className="mt-1">{new Date(selectedTable.created_at).toLocaleDateString()}</div>
                </div>
              </div>
            </div>
          )}

          {(dialogType === "edit" || dialogType === "create") && (
            <div className="space-y-4">
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="name">Название</Label>
                  <Input
                    id="name"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="game_type">Тип игры</Label>
                  <Select
                    value={editForm.game_type}
                    onValueChange={(value) => setEditForm({ ...editForm, game_type: value })}
                  >
                    <SelectTrigger id="game_type">
                      <SelectValue placeholder="Выберите тип игры" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="texas_holdem">Техасский холдем</SelectItem>
                      <SelectItem value="omaha">Омаха</SelectItem>
                      <SelectItem value="stud">Стад</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="stakes">Ставки</Label>
                  <Input
                    id="stakes"
                    value={editForm.stakes}
                    onChange={(e) => setEditForm({ ...editForm, stakes: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="min_buy_in">Мин. бай-ин</Label>
                    <Input
                      id="min_buy_in"
                      type="number"
                      value={editForm.min_buy_in}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          min_buy_in: Number.parseInt(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="max_buy_in">Макс. бай-ин</Label>
                    <Input
                      id="max_buy_in"
                      type="number"
                      value={editForm.max_buy_in}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          max_buy_in: Number.parseInt(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="max_players">Макс. игроков</Label>
                  <Select
                    value={editForm.max_players.toString()}
                    onValueChange={(value) =>
                      setEditForm({
                        ...editForm,
                        max_players: Number.parseInt(value),
                      })
                    }
                  >
                    <SelectTrigger id="max_players">
                      <SelectValue placeholder="Выберите макс. количество игроков" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">2</SelectItem>
                      <SelectItem value="6">6</SelectItem>
                      <SelectItem value="9">9</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {dialogType === "edit" && (
                  <div>
                    <Label htmlFor="status">Статус</Label>
                    <Select
                      value={editForm.status}
                      onValueChange={(value) => setEditForm({ ...editForm, status: value })}
                    >
                      <SelectTrigger id="status">
                        <SelectValue placeholder="Выберите статус" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Активен</SelectItem>
                        <SelectItem value="closed">Закрыт</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            {dialogType === "edit" && <Button onClick={handleEditTable}>Сохранить</Button>}
            {dialogType === "create" && <Button onClick={handleCreateTable}>Создать</Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

