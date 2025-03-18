"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { useToast } from "@/hooks/use-toast"
import { Search, RefreshCw, UserPlus, Edit, Ban, Shield, Eye } from "lucide-react"
import { format } from "date-fns"
import { ru } from "date-fns/locale"
import { usersApi } from "@/lib/api-client"

interface User {
  id: string
  username: string
  telegramId: string
  avatarUrl: string | null
  role: "USER" | "ADMIN" | "MODERATOR"
  status: "ACTIVE" | "BANNED" | "SUSPENDED"
  balance: number
  createdAt: string
  lastLogin: string | null
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isUserDetailsOpen, setIsUserDetailsOpen] = useState(false)
  const [isEditUserOpen, setIsEditUserOpen] = useState(false)
  const [editUserData, setEditUserData] = useState({
    username: "",
    role: "",
    status: "",
  })
  const { toast } = useToast()

  useEffect(() => {
    fetchUsers()
  }, [activeTab, page])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const params: any = {
        page,
        limit: 10,
      }

      if (activeTab === "active") {
        params.status = "ACTIVE"
      } else if (activeTab === "banned") {
        params.status = "BANNED"
      } else if (activeTab === "suspended") {
        params.status = "SUSPENDED"
      } else if (activeTab === "admins") {
        params.role = "ADMIN,MODERATOR"
      }

      if (searchQuery) {
        params.search = searchQuery
      }

      const response = await usersApi.getUsers(params)

      if (response.error) {
        console.error("Ошибка при загрузке пользователей:", response.error)
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить список пользователей",
          variant: "destructive",
        })
        return
      }

      if (response.data) {
        setUsers(response.data.users)
        setTotalPages(response.data.pagination.totalPages)
      }
    } catch (error) {
      console.error("Ошибка при загрузке пользователей:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить список пользователей",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchUsers()
  }

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      setPage(newPage)
    }
  }

  const handleViewUser = async (user: User) => {
    try {
      const response = await usersApi.getUserById(user.id)

      if (response.error) {
        console.error("Ошибка при загрузке данных пользователя:", response.error)
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить данные пользователя",
          variant: "destructive",
        })
        return
      }

      if (response.data) {
        setSelectedUser(response.data)
        setIsUserDetailsOpen(true)
      }
    } catch (error) {
      console.error("Ошибка при загрузке данных пользователя:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить данные пользователя",
        variant: "destructive",
      })
    }
  }

  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    setEditUserData({
      username: user.username,
      role: user.role,
      status: user.status,
    })
    setIsEditUserOpen(true)
  }

  const handleSaveUser = async () => {
    if (!selectedUser) return

    try {
      const response = await usersApi.updateUser(selectedUser.id, editUserData)

      if (response.error) {
        console.error("Ошибка при обновлении пользователя:", response.error)
        toast({
          title: "Ошибка",
          description: "Не удалось обновить данные пользователя",
          variant: "destructive",
        })
        return
      }

      // Обновляем пользователя в списке
      const updatedUsers = users.map((user) => {
        if (user.id === selectedUser.id) {
          return {
            ...user,
            username: editUserData.username,
            role: editUserData.role as "USER" | "ADMIN" | "MODERATOR",
            status: editUserData.status as "ACTIVE" | "BANNED" | "SUSPENDED",
          }
        }
        return user
      })

      setUsers(updatedUsers)

      toast({
        title: "Успех",
        description: "Данные пользователя успешно обновлены",
      })

      setIsEditUserOpen(false)
    } catch (error) {
      console.error("Ошибка при обновлении пользователя:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось обновить данные пользователя",
        variant: "destructive",
      })
    }
  }

  const handleBanUser = async (user: User) => {
    try {
      if (user.status === "BANNED") {
        const response = await usersApi.unbanUser(user.id)

        if (response.error) {
          console.error("Ошибка при разблокировке пользователя:", response.error)
          toast({
            title: "Ошибка",
            description: "Не удалось разблокировать пользователя",
            variant: "destructive",
          })
          return
        }

        // Обновляем пользователя в списке
        const updatedUsers = users.map((u) => {
          if (u.id === user.id) {
            return {
              ...u,
              status: "ACTIVE",
            }
          }
          return u
        })

        setUsers(updatedUsers)

        toast({
          title: "Успех",
          description: "Пользователь разблокирован",
        })
      } else {
        const response = await usersApi.banUser(user.id)

        if (response.error) {
          console.error("Ошибка при блокировке пользователя:", response.error)
          toast({
            title: "Ошибка",
            description: "Не удалось заблокировать пользователя",
            variant: "destructive",
          })
          return
        }

        // Обновляем пользователя в списке
        const updatedUsers = users.map((u) => {
          if (u.id === user.id) {
            return {
              ...u,
              status: "BANNED",
            }
          }
          return u
        })

        setUsers(updatedUsers)

        toast({
          title: "Успех",
          description: "Пользователь заблокирован",
        })
      }
    } catch (error) {
      console.error("Ошибка при изменении статуса пользователя:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось изменить статус пользователя",
        variant: "destructive",
      })
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Никогда"
    return format(new Date(dateString), "dd MMM yyyy, HH:mm", { locale: ru })
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "ADMIN":
        return <Badge variant="destructive">Администратор</Badge>
      case "MODERATOR":
        return <Badge variant="warning">Модератор</Badge>
      default:
        return <Badge variant="outline">Пользователь</Badge>
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <Badge variant="success">Активен</Badge>
      case "BANNED":
        return <Badge variant="destructive">Заблокирован</Badge>
      case "SUSPENDED":
        return <Badge variant="warning">Приостановлен</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-4 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Управление пользователями</h2>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Добавить пользователя
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle>Пользователи</CardTitle>
            <div className="flex items-center space-x-2">
              <form onSubmit={handleSearch} className="flex items-center space-x-2">
                <Input
                  placeholder="Поиск по имени или Telegram ID"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64"
                />
                <Button type="submit" variant="outline" size="icon">
                  <Search className="h-4 w-4" />
                </Button>
              </form>
              <Button variant="outline" size="icon" onClick={fetchUsers}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4 grid w-full grid-cols-5">
              <TabsTrigger value="all">Все</TabsTrigger>
              <TabsTrigger value="active">Активные</TabsTrigger>
              <TabsTrigger value="banned">Заблокированные</TabsTrigger>
              <TabsTrigger value="suspended">Приостановленные</TabsTrigger>
              <TabsTrigger value="admins">Администраторы</TabsTrigger>
            </TabsList>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Пользователь</TableHead>
                    <TableHead>Telegram ID</TableHead>
                    <TableHead>Роль</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Баланс</TableHead>
                    <TableHead>Дата регистрации</TableHead>
                    <TableHead>Последний вход</TableHead>
                    <TableHead>Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-4">
                        Загрузка...
                      </TableCell>
                    </TableRow>
                  ) : users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-4">
                        Пользователи не найдены
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={user.avatarUrl || ""} alt={user.username} />
                              <AvatarFallback>{user.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <span>{user.username}</span>
                          </div>
                        </TableCell>
                        <TableCell>{user.telegramId}</TableCell>
                        <TableCell>{getRoleBadge(user.role)}</TableCell>
                        <TableCell>{getStatusBadge(user.status)}</TableCell>
                        <TableCell>{user.balance.toLocaleString()} фишек</TableCell>
                        <TableCell>{formatDate(user.createdAt)}</TableCell>
                        <TableCell>{formatDate(user.lastLogin)}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleViewUser(user)}
                              title="Просмотреть"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleEditUser(user)}
                              title="Редактировать"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleBanUser(user)}
                              title={user.status === "BANNED" ? "Разблокировать" : "Заблокировать"}
                            >
                              <Ban className="h-4 w-4" />
                            </Button>
                            {user.role !== "ADMIN" && (
                              <Button variant="outline" size="icon" title="Изменить роль">
                                <Shield className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {totalPages > 1 && (
              <Pagination className="mt-4">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => handlePageChange(page - 1)}
                      className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>

                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    // Логика для отображения страниц вокруг текущей
                    let pageNum
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (page <= 3) {
                      pageNum = i + 1
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = page - 2 + i
                    }

                    return (
                      <PaginationItem key={i}>
                        <PaginationLink onClick={() => handlePageChange(pageNum)} isActive={pageNum === page}>
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    )
                  })}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() => handlePageChange(page + 1)}
                      className={page === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </Tabs>
        </CardContent>
      </Card>

      {/* Диалог просмотра пользователя */}
      <Dialog open={isUserDetailsOpen} onOpenChange={setIsUserDetailsOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Информация о пользователе</DialogTitle>
            <DialogDescription>Подробная информация о пользователе</DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedUser.avatarUrl || ""} alt={selectedUser.username} />
                  <AvatarFallback>{selectedUser.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-medium">{selectedUser.username}</h3>
                  <p className="text-sm text-muted-foreground">Telegram ID: {selectedUser.telegramId}</p>
                  <div className="flex space-x-2 mt-1">
                    {getRoleBadge(selectedUser.role)}
                    {getStatusBadge(selectedUser.status)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium">Баланс</h4>
                  <p className="text-lg">{selectedUser.balance.toLocaleString()} фишек</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Дата регистрации</h4>
                  <p>{formatDate(selectedUser.createdAt)}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Последний вход</h4>
                  <p>{formatDate(selectedUser.lastLogin)}</p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium">Статистика игр</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="rounded-md border p-3">
                    <p className="text-sm text-muted-foreground">Всего игр</p>
                    <p className="text-lg font-medium">{selectedUser.gamesStats?.totalGames || 0}</p>
                  </div>
                  <div className="rounded-md border p-3">
                    <p className="text-sm text-muted-foreground">Выигрыши</p>
                    <p className="text-lg font-medium">{selectedUser.gamesStats?.wins || 0}</p>
                  </div>
                  <div className="rounded-md border p-3">
                    <p className="text-sm text-muted-foreground">Винрейт</p>
                    <p className="text-lg font-medium">{selectedUser.gamesStats?.winRate || 0}%</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium">Финансовая статистика</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="rounded-md border p-3">
                    <p className="text-sm text-muted-foreground">Всего депозитов</p>
                    <p className="text-lg font-medium">
                      {selectedUser.financialStats?.totalDeposits.toLocaleString() || 0}
                    </p>
                  </div>
                  <div className="rounded-md border p-3">
                    <p className="text-sm text-muted-foreground">Всего выводов</p>
                    <p className="text-lg font-medium">
                      {selectedUser.financialStats?.totalWithdrawals.toLocaleString() || 0}
                    </p>
                  </div>
                  <div className="rounded-md border p-3">
                    <p className="text-sm text-muted-foreground">Прибыль/убыток</p>
                    <p
                      className={`text-lg font-medium ${selectedUser.financialStats?.profitLoss >= 0 ? "text-green-600" : "text-red-600"}`}
                    >
                      {selectedUser.financialStats?.profitLoss >= 0 ? "+" : ""}
                      {selectedUser.financialStats?.profitLoss.toLocaleString() || 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Диалог редактирования пользователя */}
      <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Редактирование пользователя</DialogTitle>
            <DialogDescription>Измените данные пользователя</DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="username">Имя пользователя</Label>
                <Input
                  id="username"
                  value={editUserData.username}
                  onChange={(e) => setEditUserData({ ...editUserData, username: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Роль</Label>
                <Select
                  value={editUserData.role}
                  onValueChange={(value) => setEditUserData({ ...editUserData, role: value })}
                >
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Выберите роль" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USER">Пользователь</SelectItem>
                    <SelectItem value="MODERATOR">Модератор</SelectItem>
                    <SelectItem value="ADMIN">Администратор</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Статус</Label>
                <Select
                  value={editUserData.status}
                  onValueChange={(value) => setEditUserData({ ...editUserData, status: value })}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Выберите статус" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Активен</SelectItem>
                    <SelectItem value="BANNED">Заблокирован</SelectItem>
                    <SelectItem value="SUSPENDED">Приостановлен</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditUserOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleSaveUser}>Сохранить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

