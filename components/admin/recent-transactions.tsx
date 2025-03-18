"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatDistanceToNow } from "date-fns"
import { ru } from "date-fns/locale"

type Transaction = {
  id: string
  user_id: string
  username: string
  amount: number
  type: "deposit" | "withdrawal" | "game_win" | "game_loss" | "bonus"
  status: "pending" | "completed" | "rejected"
  created_at: string
}

export default function RecentTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await fetch("/api/admin/transactions?limit=5")

        if (!response.ok) {
          throw new Error("Failed to fetch transactions")
        }

        const data = await response.json()
        setTransactions(data)
      } catch (error) {
        console.error("Error fetching transactions:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchTransactions()
  }, [])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500">Завершена</Badge>
      case "pending":
        return (
          <Badge variant="outline" className="text-yellow-500 border-yellow-500">
            Ожидает
          </Badge>
        )
      case "rejected":
        return <Badge variant="destructive">Отклонена</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "deposit":
        return "Пополнение"
      case "withdrawal":
        return "Вывод"
      case "game_win":
        return "Выигрыш"
      case "game_loss":
        return "Проигрыш"
      case "bonus":
        return "Бонус"
      default:
        return type
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">Недавние транзакции</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
                <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{transaction.username}</p>
                    <span className="text-sm text-gray-500 dark:text-gray-400">{getTypeLabel(transaction.type)}</span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {formatDistanceToNow(new Date(transaction.created_at), { addSuffix: true, locale: ru })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`font-medium ${transaction.type === "deposit" || transaction.type === "game_win" || transaction.type === "bonus" ? "text-green-500" : "text-red-500"}`}
                  >
                    {transaction.type === "withdrawal" || transaction.type === "game_loss" ? "-" : "+"}
                    {transaction.amount.toLocaleString()} ₽
                  </span>
                  {getStatusBadge(transaction.status)}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Link href="/admin/transactions">
            <Button variant="outline" className="w-full">
              Все транзакции
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

