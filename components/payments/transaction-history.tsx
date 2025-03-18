"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"
import { format } from "date-fns"
import { ru } from "date-fns/locale"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

interface Transaction {
  id: number
  type: string
  amount: number
  status: string
  description: string
  createdAt: string
  reference?: string
}

interface TransactionHistoryProps {
  userId: number
}

export default function TransactionHistory({ userId }: TransactionHistoryProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState<number>(1)
  const [totalPages, setTotalPages] = useState<number>(1)
  const [filter, setFilter] = useState<string>("all")

  const pageSize = 10

  useEffect(() => {
    fetchTransactions()
  }, [userId, page, filter])

  const fetchTransactions = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/wallet/transactions?userId=${userId}&page=${page}&pageSize=${pageSize}&filter=${filter}`,
      )
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Ошибка при получении истории транзакций")
      }

      setTransactions(data.transactions)
      setTotalPages(data.totalPages)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Произошла неизвестная ошибка")
    } finally {
      setLoading(false)
    }
  }

  const getTransactionTypeText = (type: string): string => {
    const types: Record<string, string> = {
      deposit: "Пополнение",
      withdraw: "Вывод",
      game_win: "Выигрыш",
      game_loss: "Проигрыш",
      tournament_entry: "Вход в турнир",
      tournament_win: "Выигрыш в турнире",
      bonus: "Бонус",
      referral: "Реферальное вознаграждение",
      admin_adjustment: "Корректировка администратором",
    }

    return types[type] || type
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      completed: "success",
      pending: "warning",
      failed: "destructive",
      cancelled: "outline",
    }

    const labels: Record<string, string> = {
      completed: "Завершено",
      pending: "В обработке",
      failed: "Ошибка",
      cancelled: "Отменено",
    }

    return <Badge variant={(variants[status] as any) || "default"}>{labels[status] || status}</Badge>
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd MMM yyyy, HH:mm", { locale: ru })
  }

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      setPage(newPage)
    }
  }

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilter(e.target.value)
    setPage(1) // Сбрасываем на первую страницу при изменении фильтра
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>История транзакций</CardTitle>
            <CardDescription>История всех финансовых операций на вашем аккаунте</CardDescription>
          </div>
          <div>
            <select value={filter} onChange={handleFilterChange} className="p-2 border rounded-md text-sm">
              <option value="all">Все операции</option>
              <option value="deposit">Пополнения</option>
              <option value="withdraw">Выводы</option>
              <option value="game">Игры</option>
              <option value="tournament">Турниры</option>
              <option value="bonus">Бонусы</option>
            </select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">{error}</div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">Транзакции не найдены</div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Дата</TableHead>
                  <TableHead>Тип</TableHead>
                  <TableHead>Сумма</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Описание</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="whitespace-nowrap">{formatDate(transaction.createdAt)}</TableCell>
                    <TableCell>{getTransactionTypeText(transaction.type)}</TableCell>
                    <TableCell className={transaction.amount > 0 ? "text-green-600" : "text-red-600"}>
                      {transaction.amount > 0 ? "+" : ""}
                      {transaction.amount}
                    </TableCell>
                    <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                    <TableCell className="max-w-xs truncate" title={transaction.description}>
                      {transaction.description}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

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
          </>
        )}
      </CardContent>
    </Card>
  )
}

