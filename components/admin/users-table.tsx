"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, Search, Ban, CheckCircle, Edit, Eye } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface User {
  id: string
  username: string
  telegram_id: string
  status: string
  role: string
  created_at: string
  last_login: string
  vip_status: string
}

export function UsersTable() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [dialogType, setDialogType] = useState<"view" | "edit" | "ban">("view")
  const [banReason, setBanReason] = useState("")
  const [editForm, setEditForm] = useState({
    username: "",
    role: "",
    vip_status: "",
  })

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("adminToken")
      const response = await fetch("/api/admin/users", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Ошибка загрузки пользователей")
      }

      const data = await response.json()
      setUsers(data)
    } catch (error) {
      console.error("Ошибка загрузки пользователей:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleBanUser = async () => {
    if (!selectedUser) return

    try {
      const token = localStorage.getItem("adminToken")
      const response = await fetch(`/api/admin/users/${selectedUser.id}/ban`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: banReason }),
      })

      if (!response.ok) {
        throw new Error("Ошибка блокировки пользователя")
      }

      // Обновляем список пользователей
      fetchUsers()
      setIsDialogOpen(false)
      setBanReason("")
    } catch (error) {
      console.error("Ошибка блокировки пользователя:", error)
    }
  }

  const handleUnbanUser = async (userId: string) => {
    try {
      const token = localStorage.getItem("adminToken")
      const response = await fetch(`/api/admin/users/${userId}/unban`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Ошибка разблокировки пользователя")
      }

      // Обновляем список пользователей
      fetchUsers()
    } catch (error) {
      console.error("Ошибка разблокировки пользователя:", error)
    }
  }

  const handleEditUser = async () => {
    if (!selectedUser) return

    try {
      const token = localStorage.getItem("adminToken")
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editForm),
      })

      if (!response.ok) {
        throw new Error("Ошибка обновления пользователя")
      }

      // Обновляем список пользователей
      fetchUsers()
      setIsDialogOpen(false)
    } catch (error) {
      console.error("Ошибка обновления пользователя:", error)
    }
  }

  const openDialog = (user: User, type: "view" | "edit" | "ban") => {
    setSelectedUser(user)
    setDialogType(type)

    if (type === "edit") {
      setEditForm({
        username: user.username,
        role: user.role,
        vip_status: user.vip_status,
      })
    }

    setIsDialogOpen(true)
  }

  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.telegram_id.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500">Активен</Badge>
      case "banned":
        return <Badge variant="destructive">Заблокирован</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getVipBadge = (vipStatus: string) => {
    if (vipStatus === "none") return null

    switch (vipStatus) {
      case "bronze":
        return <Badge className="bg-amber-700">Бронза</Badge>
      case "silver":
        return <Badge className="bg-gray-400">Серебро</Badge>
      case "gold":
        return <Badge className="bg-yellow-500">Золото</Badge>
      case "platinum":
        return <Badge className="bg-cyan-500">Платина</Badge>
      default:
        return <Badge variant="outline">{vipStatus}</Badge>
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
      <div className="flex items-center mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Поиск пользователей..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Имя пользователя</TableHead>
              <TableHead>Telegram ID</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead>Роль</TableHead>
              <TableHead>VIP статус</TableHead>
              <TableHead>Дата регистрации</TableHead>
              <TableHead>Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  Пользователи не найдены
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.telegram_id}</TableCell>
                  <TableCell>{getStatusBadge(user.status)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{user.role === "admin" ? "Администратор" : "Пользователь"}</Badge>
                  </TableCell>
                  <TableCell>{getVipBadge(user.vip_status)}</TableCell>
                  <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openDialog(user, "view")}>
                          <Eye className="h-4 w-4 mr-2" />
                          Просмотр
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openDialog(user, "edit")}>
                          <Edit className="h-4 w-4 mr-2" />
                          Редактировать
                        </DropdownMenuItem>
                        {user.status === "active" ? (
                          <DropdownMenuItem onClick={() => openDialog(user, "ban")}>
                            <Ban className="h-4 w-4 mr-2" />
                            Заблокировать
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => handleUnbanUser(user.id)}>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Разблокировать
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

      {/* Диалоговое окно для просмотра/редактирования/блокировки пользователя */}
      {selectedUser && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {dialogType === "view"
                  ? `Пользователь: ${selectedUser.username}`
                  : dialogType === "edit"
                    ? "Редактирование пользователя"
                    : "Блокировка пользователя"}
              </DialogTitle>
            </DialogHeader>

            {dialogType === "view" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Имя пользователя</Label>
                    <div className="mt-1">{selectedUser.username}</div>
                  </div>
                  <div>
                    <Label>Telegram ID</Label>
                    <div className="mt-1">{selectedUser.telegram_id}</div>
                  </div>
                  <div>
                    <Label>Статус</Label>
                    <div className="mt-1">{getStatusBadge(selectedUser.status)}</div>
                  </div>
                  <div>
                    <Label>Роль</Label>
                    <div className="mt-1">{selectedUser.role === "admin" ? "Администратор" : "Пользователь"}</div>
                  </div>
                  <div>
                    <Label>VIP статус</Label>
                    <div className="mt-1">{getVipBadge(selectedUser.vip_status) || "Нет"}</div>
                  </div>
                  <div>
                    <Label>Дата регистрации</Label>
                    <div className="mt-1">{new Date(selectedUser.created_at).toLocaleDateString()}</div>
                  </div>
                  <div>
                    <Label>Последний вход</Label>
                    <div className="mt-1">{new Date(selectedUser.last_login).toLocaleDateString()}</div>
                  </div>
                </div>
              </div>
            )}

            {dialogType === "edit" && (
              <div className="space-y-4">
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="username">Имя пользователя</Label>
                    <Input
                      id="username"
                      value={editForm.username}
                      onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="role">Роль</Label>
                    <Select value={editForm.role} onValueChange={(value) => setEditForm({ ...editForm, role: value })}>
                      <SelectTrigger id="role">
                        <SelectValue placeholder="Выберите роль" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">Пользователь</SelectItem>
                        <SelectItem value="admin">Администратор</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="vip_status">VIP статус</Label>
                    <Select
                      value={editForm.vip_status}
                      onValueChange={(value) => setEditForm({ ...editForm, vip_status: value })}
                    >
                      <SelectTrigger id="vip_status">
                        <SelectValue placeholder="Выберите VIP статус" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Нет</SelectItem>
                        <SelectItem value="bronze">Бронза</SelectItem>
                        <SelectItem value="silver">Серебро</SelectItem>
                        <SelectItem value="gold">Золото</SelectItem>
                        <SelectItem value="platinum">Платина</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {dialogType === "ban" && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="ban-reason">Причина блокировки</Label>
                  <Textarea
                    id="ban-reason"
                    placeholder="Укажите причину блокировки пользователя"
                    value={banReason}
                    onChange={(e) => setBanReason(e.target.value)}
                  />
                </div>
              </div>
            )}

            <DialogFooter>
              {dialogType === "edit" && <Button onClick={handleEditUser}>Сохранить</Button>}
              {dialogType === "ban" && (
                <Button variant="destructive" onClick={handleBanUser}>
                  Заблокировать
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

