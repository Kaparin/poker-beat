"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, Search, Eye, CheckCircle, X } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Transaction {
  id: string
  user_id: string
  username: string
  type: string
  amount: number
  status: string
  created_at: string
  updated_at: string
  details: any
}

export function TransactionsTable() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [filterType, setFilterType] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")

  useEffect(() => {
    fetchTransactions()
  }, [])

  const fetchTransactions = async () => {
    try {
      const token = localStorage.getItem("adminToken")
      const response = await fetch("/api/admin/transactions", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Ошибка загрузки транзакций")
      }

      const data = await response.json()
      setTransactions(data)
    } catch (error) {
      console.error("Ошибка загрузки транзакций:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleApproveTransaction = async (transactionId: string) => {
    try {
      const token = localStorage.getItem("adminToken")
      const response = await fetch(`/api/admin/transactions/${transactionId}/approve`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Ошибка подтверждения транзакции")
      }

      // Обновляем список транзакций
      fetchTransactions()
    } catch (error) {
      console.error("Ошибка подтверждения транзакции:", error)
    }
  }

  const handleRejectTransaction = async (transactionId: string) => {
    try {
      const token = localStorage.getItem("adminToken")
      const response = await fetch(`/api/admin/transactions/${transactionId}/reject`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Ошибка отклонения транзакции")
      }

      // Обновляем список транзакций
      fetchTransactions()
    } catch (error) {
      console.error("Ошибка отклонения транзакции:", error)
    }
  }

  const openDialog = (transaction: Transaction) => {
    setSelectedTransaction(transaction)
    setIsDialogOpen(true)
  }

  const filteredTransactions = transactions.filter((transaction) => {
    // Фильтр по типу транзакции
    if (filterType !== "all" && transaction.type !== filterType) {
      return false
    }

    // Фильтр по статусу
    if (filterStatus !== "all" && transaction.status !== filterStatus) {
      return false
    }

    // Поиск по имени пользователя или ID транзакции
    return (
      transaction.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.id.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500">Завершена</Badge>
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-500 text-black">
            Ожидает
          </Badge>
        )
      case "rejected":
        return <Badge variant="destructive">Отклонена</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "deposit":
        return <Badge className="bg-blue-500">Депозит</Badge>
      case "withdrawal":
        return <Badge className="bg-orange-500">Вывод</Badge>
      case "game_win":
        return <Badge className="bg-green-500">Выигрыш</Badge>
      case "game_loss":
        return <Badge className="bg-red-500">Проигрыш</Badge>
      case "bonus":
        return <Badge className="bg-purple-500">Бонус</Badge>
      case "referral":
        return <Badge className="bg-indigo-500">Реферал</Badge>
      default:
        return <Badge variant="outline">{type}</Badge>
    }
  }

  const formatAmount = (amount: number) => {
    return (amount / 100).toFixed(2)
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
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
        <div className="relative flex-1 max-w-sm w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Поиск транзакций..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Тип транзакции" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все типы</SelectItem>
              <SelectItem value="deposit">Депозит</SelectItem>
              <SelectItem value="withdrawal">Вывод</SelectItem>
              <SelectItem value="game_win">Выигрыш</SelectItem>
              <SelectItem value="game_loss">Проигрыш</SelectItem>
              <SelectItem value="bonus">Бонус</SelectItem>
              <SelectItem value="referral">Реферал</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Статус" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все статусы</SelectItem>
              <SelectItem value="completed">Завершена</SelectItem>
              <SelectItem value="pending">Ожидает</SelectItem>
              <SelectItem value="rejected">Отклонена</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Пользователь</TableHead>
              <TableHead>Тип</TableHead>
              <TableHead>Сумма</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead>Дата</TableHead>
              <TableHead>Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTransactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  Транзакции не найдены
                </TableCell>
              </TableRow>
            ) : (
              filteredTransactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="font-mono text-xs">{transaction.id.substring(0, 8)}...</TableCell>
                  <TableCell>{transaction.username}</TableCell>
                  <TableCell>{getTypeBadge(transaction.type)}</TableCell>
                  <TableCell>{formatAmount(transaction.amount)} TON</TableCell>
                  <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                  <TableCell>{new Date(transaction.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openDialog(transaction)}>
                          <Eye className="h-4 w-4 mr-2" />
                          Детали
                        </DropdownMenuItem>
                        {transaction.status === "pending" && (
                          <>
                            <DropdownMenuItem onClick={() => handleApproveTransaction(transaction.id)}>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Подтвердить
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleRejectTransaction(transaction.id)}>
                              <X className="h-4 w-4 mr-2" />
                              Отклонить
                            </DropdownMenuItem>
                          </>
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

      {/* Диалоговое окно для просмотра деталей транзакции */}
      {selectedTransaction && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Детали транзакции</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>ID транзакции</Label>
                  <div className="mt-1 font-mono text-xs break-all">{selectedTransaction.id}</div>
                </div>
                <div>
                  <Label>Пользователь</Label>
                  <div className="mt-1">{selectedTransaction.username}</div>
                </div>
                <div>
                  <Label>Тип</Label>
                  <div className="mt-1">{getTypeBadge(selectedTransaction.type)}</div>
                </div>
                <div>
                  <Label>Сумма</Label>
                  <div className="mt-1">{formatAmount(selectedTransaction.amount)} TON</div>
                </div>
                <div>
                  <Label>Статус</Label>
                  <div className="mt-1">{getStatusBadge(selectedTransaction.status)}</div>
                </div>
                <div>
                  <Label>Дата создания</Label>
                  <div className="mt-1">{new Date(selectedTransaction.created_at).toLocaleString()}</div>
                </div>
                <div>
                  <Label>Дата обновления</Label>
                  <div className="mt-1">{new Date(selectedTransaction.updated_at).toLocaleString()}</div>
                </div>
              </div>

              {selectedTransaction.details && (
                <div>
                  <Label>Дополнительная информация</Label>
                  <div className="mt-1 p-2 bg-gray-100 dark:bg-gray-800 rounded-md">
                    <pre className="text-xs overflow-auto">{JSON.stringify(selectedTransaction.details, null, 2)}</pre>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              {selectedTransaction.status === "pending" && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => handleRejectTransaction(selectedTransaction.id)}
                    className="mr-2"
                  >
                    Отклонить
                  </Button>
                  <Button onClick={() => handleApproveTransaction(selectedTransaction.id)}>Подтвердить</Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

