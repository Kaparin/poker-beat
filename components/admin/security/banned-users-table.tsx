"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { format, formatDistanceToNow } from "date-fns"
import { ru } from "date-fns/locale"
import { ChevronLeft, ChevronRight, Search, UserCheck } from "lucide-react"
import { toast } from "@/hooks/use-toast"

type User = {
  id: string
  username: string
  telegram_id?: string
  avatar_url?: string
  created_at: string
  last_login?: string
}

export default function BannedUsersTable() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [banReason, setBanReason] = useState("")
  const [isBanDialogOpen, setIsBanDialogOpen] = useState(false)
  const [isUnbanDialogOpen, setIsUnbanDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchUsers = async () => {
    setLoading(true)

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      })

      if (searchQuery) {
        params.append("search", searchQuery)
      }

      const response = await fetch(`/api/admin/security/banned-users?${params.toString()}`)

      if (!response.ok) {
        throw new Error("Failed to fetch banned users")
      }

      const data = await response.json()
      setUsers(data.users)
      setTotal(data.total)
    } catch (error) {
      console.error("Error fetching banned users:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить список заблокированных пользователей",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [page, limit])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchUsers()
  }

  const handleUnbanUser = async () => {
    if (!selectedUser) return

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/admin/security/banned-users?userId=${selectedUser.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to unban user")
      }

      toast({
        title: "Успешно",
        description: `Пользователь ${selectedUser.username} разблокирован`,
        variant: "default",
      })

      // Обновляем список пользователей
      fetchUsers()
    } catch (error) {
      console.error("Error unbanning user:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось разблокировать пользователя",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
      setIsUnbanDialogOpen(false)
      setSelectedUser(null)
    }
  }

  const getInitials = (username: string) => {
    return username.substring(0, 2).toUpperCase()
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <Input
              placeholder="Поиск по имени пользователя"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Поиск
            </Button>
          </form>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Пользователь</TableHead>
                  <TableHead>Дата регистрации</TableHead>
                  <TableHead>Последний вход</TableHead>
                  <TableHead>Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={4} className="h-16">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4 text-gray-500 dark:text-gray-400">
                      Нет заблокированных пользователей
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={user.avatar_url} />
                            <AvatarFallback>{getInitials(user.username)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{user.username}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">ID: {user.id}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{format(new Date(user.created_at), "dd.MM.yyyy")}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDistanceToNow(new Date(user.created_at), { addSuffix: true, locale: ru })}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.last_login ? (
                          <div className="flex flex-col">
                            <span>{format(new Date(user.last_login), "dd.MM.yyyy HH:mm")}</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {formatDistanceToNow(new Date(user.last_login), { addSuffix: true, locale: ru })}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-500 dark:text-gray-400">Никогда</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1"
                          onClick={() => {
                            setSelectedUser(user)
                            setIsUnbanDialogOpen(true)
                          }}
                        >
                          <UserCheck className="h-4 w-4" />
                          Разблокировать
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Показано {users.length} из {total} пользователей
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1 || loading}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <span className="text-sm">
                Страница {page} из {totalPages || 1}
              </span>

              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages || loading}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>

      {/* Диалог разблокировки пользователя */}
      <Dialog open={isUnbanDialogOpen} onOpenChange={setIsUnbanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Разблокировать пользователя</DialogTitle>
            <DialogDescription>
              Вы уверены, что хотите разблокировать пользователя {selectedUser?.username}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUnbanDialogOpen(false)} disabled={isSubmitting}>
              Отмена
            </Button>
            <Button onClick={handleUnbanUser} disabled={isSubmitting}>
              {isSubmitting ? "Разблокировка..." : "Разблокировать"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

