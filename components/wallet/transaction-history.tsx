import type { Transaction } from "@/types/wallet"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"
import { ArrowDownToLine, ArrowUpFromLine, Trophy, AlertCircle, Gift, ExternalLink } from "lucide-react"

interface TransactionHistoryProps {
  transactions: Transaction[]
}

export function TransactionHistory({ transactions }: TransactionHistoryProps) {
  if (transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-gray-500">
            <p>No transactions yet</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getTransactionIcon = (type: Transaction["type"]) => {
    switch (type) {
      case "deposit":
        return <ArrowDownToLine className="h-4 w-4 text-green-500" />
      case "withdrawal":
        return <ArrowUpFromLine className="h-4 w-4 text-blue-500" />
      case "game_win":
        return <Trophy className="h-4 w-4 text-yellow-500" />
      case "game_loss":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case "bonus":
        return <Gift className="h-4 w-4 text-purple-500" />
      default:
        return null
    }
  }

  const getStatusBadge = (status: Transaction["status"]) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
            Pending
          </Badge>
        )
      case "completed":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            Completed
          </Badge>
        )
      case "failed":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400">
            Failed
          </Badge>
        )
      default:
        return null
    }
  }

  const getTransactionTitle = (transaction: Transaction) => {
    switch (transaction.type) {
      case "deposit":
        return "Deposit"
      case "withdrawal":
        return "Withdrawal"
      case "game_win":
        return "Game Win"
      case "game_loss":
        return "Game Loss"
      case "bonus":
        return "Bonus"
      default:
        return "Transaction"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transaction History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-start justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-start space-x-3">
                <div className="mt-0.5">{getTransactionIcon(transaction.type)}</div>
                <div>
                  <h3 className="font-medium">{getTransactionTitle(transaction)}</h3>
                  <p className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(transaction.timestamp), { addSuffix: true })}
                  </p>
                  {transaction.memo && <p className="text-xs text-gray-500 mt-1">{transaction.memo}</p>}
                  {transaction.txHash && (
                    <a
                      href={`https://tonscan.org/tx/${transaction.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-xs text-blue-500 hover:underline mt-1"
                    >
                      View on Explorer
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center space-x-2">
                  <p
                    className={`font-medium ${
                      transaction.type === "deposit" || transaction.type === "game_win" || transaction.type === "bonus"
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {transaction.type === "deposit" || transaction.type === "game_win" || transaction.type === "bonus"
                      ? `+${transaction.amount}`
                      : `-${transaction.amount}`}{" "}
                    chips
                  </p>
                  {getStatusBadge(transaction.status)}
                </div>
                {(transaction.type === "deposit" || transaction.type === "withdrawal") && (
                  <p className="text-xs text-gray-500 mt-1">{transaction.tonAmount.toFixed(4)} TON</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

