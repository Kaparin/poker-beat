"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format, formatDistanceToNow } from "date-fns"
import { ru } from "date-fns/locale"
import { ChevronLeft, ChevronRight, Search, Filter } from "lucide-react"

type SecurityLog = {
  id: string
  action: string
  user_id?: string
  ip_address?: string
  user_agent?: string
  details?: any
  created_at: string
}

export default function SecurityLogsTable() {
  const [logs, setLogs] = useState<SecurityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [action, setAction] = useState<string>("")
  const [userId, setUserId] = useState<string>("")
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")

  const fetchLogs = async () => {
    setLoading(true)

    try {
      // Формируем URL с параметрами
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      })

      if (action) {
        params.append("action", action)
      }

      if (userId) {
        params.append("userId", userId)
      }

      if (startDate) {
        params.append("startDate", startDate)
      }

      if (endDate) {
        params.append("endDate", endDate)
      }

      const response = await fetch(`/api/admin/security/logs?${params.toString()}`)

      if (!response.ok) {
        throw new Error("Failed to fetch security logs")
      }

      const data = await response.json()
      setLogs(data.logs)
      setTotal(data.total)
    } catch (error) {
      console.error("Error fetching security logs:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [page, limit])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1) // Сбрасываем страницу при новом поиске
    fetchLogs()
  }

  const handleReset = () => {
    setAction("")
    setUserId("")
    setStartDate("")
    setEndDate("")
    setPage(1)
    fetchLogs()
  }

  const getActionBadge = (action: string) => {
    switch (action) {
      case "admin_login_failed":
        return <Badge variant="destructive">Неудачный вход</Badge>
      case "admin_login_success":
        return <Badge className="bg-green-500">Успешный вход</Badge>
      case "user_banned":
        return <Badge variant="destructive">Блокировка пользователя</Badge>
      case "user_unbanned":
        return <Badge className="bg-green-500">Разблокировка пользователя</Badge>
      case "rate_limit_exceeded":
        return (
          <Badge variant="outline" className="text-yellow-500 border-yellow-500">
            Превышение лимита
          </Badge>
        )
      case "api_error":
        return <Badge variant="destructive">Ошибка API</Badge>
      case "slow_request":
        return (
          <Badge variant="outline" className="text-orange-500 border-orange-500">
            Медленный запрос
          </Badge>
        )
      case "suspicious_activity":
        return <Badge variant="destructive">Подозрительная активность</Badge>
      case "redis_error":
        return <Badge variant="destructive">Ошибка Redis</Badge>
      default:
        return <Badge variant="outline">{action}</Badge>
    }
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Select value={action} onValueChange={setAction}>
                <SelectTrigger>
                  <SelectValue placeholder="Тип события" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все типы</SelectItem>
                  <SelectItem value="admin_login_failed">Неудачный вход</SelectItem>
                  <SelectItem value="admin_login_success">Успешный вход</SelectItem>
                  <SelectItem value="user_banned">Блокировка пользователя</SelectItem>
                  <SelectItem value="user_unbanned">Разблокировка пользователя</SelectItem>
                  <SelectItem value="rate_limit_exceeded">Превышение лимита</SelectItem>
                  <SelectItem value="api_error">Ошибка API</SelectItem>
                  <SelectItem value="slow_request">Медленный запрос</SelectItem>
                  <SelectItem value="suspicious_activity">Подозрительная активность</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Input placeholder="ID пользователя" value={userId} onChange={(e) => setUserId(e.target.value)} />
            </div>

            <div>
              <Input
                type="date"
                placeholder="Начальная дата"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div>
              <Input
                type="date"
                placeholder="Конечная дата"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2 md:col-span-4">
              <Button type="submit" className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                Поиск
              </Button>
              <Button type="button" variant="outline" onClick={handleReset} className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Сбросить фильтры
              </Button>
            </div>
          </form>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Тип события</TableHead>
                  <TableHead>Дата и время</TableHead>
                  <TableHead>ID пользователя</TableHead>
                  <TableHead>IP-адрес</TableHead>
                  <TableHead>Детали</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={5} className="h-16">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4 text-gray-500 dark:text-gray-400">
                      Нет данных для отображения
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>{getActionBadge(log.action)}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{format(new Date(log.created_at), "dd.MM.yyyy HH:mm:ss")}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: ru })}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{log.user_id || "-"}</TableCell>
                      <TableCell>{log.ip_address || "-"}</TableCell>
                      <TableCell>
                        {log.details ? (
                          <pre className="text-xs overflow-auto max-w-xs max-h-20">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Показано {logs.length} из {total} записей
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

              <Select
                value={limit.toString()}
                onValueChange={(value) => {
                  setLimit(Number.parseInt(value))
                  setPage(1)
                }}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

