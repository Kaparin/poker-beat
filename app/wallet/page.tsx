"use client"

import { useEffect, useState } from "react"
import { WalletOverview } from "@/components/wallet/wallet-overview"
import { DepositSection } from "@/components/wallet/deposit-section"
import { WithdrawalForm } from "@/components/wallet/withdrawal-form"
import { TransactionHistory } from "@/components/wallet/transaction-history"
import type { WalletBalance, Transaction } from "@/types/wallet"
import { getTelegramUser, isTelegramWebApp } from "@/lib/telegram-utils"
import { generateTonAddress, generateQrCodeUrl } from "@/lib/ton-utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2 } from "lucide-react"

export default function WalletPage() {
  const [balance, setBalance] = useState<WalletBalance>({
    chips: 0,
    ton: 0,
    pendingDeposits: 0,
    pendingWithdrawals: 0,
  })
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDeposit, setShowDeposit] = useState(false)
  const [showWithdraw, setShowWithdraw] = useState(false)
  const [userId, setUserId] = useState<number | null>(null)
  const [tonAddress, setTonAddress] = useState<string>("")
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("")

  useEffect(() => {
    // Notify Telegram that the WebApp is ready
    if (isTelegramWebApp()) {
      window.Telegram.WebApp.ready()
      window.Telegram.WebApp.expand()
    }

    // Get the user ID
    const telegramUser = getTelegramUser()
    const uid = telegramUser?.id || 12345678 // Use a default ID for development
    setUserId(uid)

    // Generate TON address and QR code
    const address = generateTonAddress(uid)
    setTonAddress(address)
    setQrCodeUrl(generateQrCodeUrl(address))

    // Fetch initial data
    fetchWalletData(uid)
  }, [])

  const fetchWalletData = async (uid: number) => {
    try {
      setLoading(true)

      // Fetch balance
      const balanceResponse = await fetch(`/api/wallet/balance?userId=${uid}`)
      const balanceData = await balanceResponse.json()

      if (!balanceResponse.ok) {
        throw new Error(balanceData.error || "Failed to fetch balance")
      }

      setBalance(balanceData.balance)

      // Fetch transactions
      const transactionsResponse = await fetch(`/api/wallet/transactions?userId=${uid}`)
      const transactionsData = await transactionsResponse.json()

      if (!transactionsResponse.ok) {
        throw new Error(transactionsData.error || "Failed to fetch transactions")
      }

      setTransactions(transactionsData.transactions || [])

      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load wallet data")
      console.error("Error loading wallet data:", err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    if (refreshing || !userId) return

    setRefreshing(true)
    fetchWalletData(userId)
  }

  const handleDeposit = () => {
    setShowDeposit(true)
    setShowWithdraw(false)
  }

  const handleWithdraw = () => {
    setShowWithdraw(true)
    setShowDeposit(false)
  }

  const handleCloseDeposit = () => {
    setShowDeposit(false)
  }

  const handleCloseWithdraw = () => {
    setShowWithdraw(false)
  }

  const handleDepositSimulate = async (amount: number) => {
    if (!userId) return

    try {
      const response = await fetch("/api/wallet/deposit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          amount,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Deposit failed")
      }

      // Add the transaction to the list
      setTransactions((prev) => [data.transaction, ...prev])

      // Refresh after a delay to see the pending deposit
      setTimeout(() => {
        handleRefresh()
      }, 1000)

      return data.transaction
    } catch (error) {
      console.error("Deposit error:", error)
      throw error
    }
  }

  const handleWithdrawSubmit = async (amount: number, address: string) => {
    if (!userId) return

    try {
      const response = await fetch("/api/wallet/withdraw", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          amount,
          address,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Withdrawal failed")
      }

      // Add the transaction to the list
      setTransactions((prev) => [data.transaction, ...prev])

      // Update the balance immediately
      setBalance((prev) => ({
        ...prev,
        chips: prev.chips - amount,
      }))

      // Refresh after a delay to see the pending withdrawal
      setTimeout(() => {
        handleRefresh()
      }, 1000)

      return data.transaction
    } catch (error) {
      console.error("Withdrawal error:", error)
      throw error
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Loader2 className="w-12 h-12 animate-spin text-blue-500 mb-4" />
        <p className="text-lg">Loading your wallet...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="p-4 bg-red-100 text-red-700 rounded-lg max-w-md">
          <h2 className="text-lg font-bold mb-2">Error Loading Wallet</h2>
          <p>{error}</p>
          <button
            onClick={() => userId && fetchWalletData(userId)}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl mx-auto p-4 pb-20">
      <h1 className="text-2xl font-bold mb-6">Wallet</h1>

      {showDeposit ? (
        <DepositSection
          tonAddress={tonAddress}
          qrCodeUrl={qrCodeUrl}
          onClose={handleCloseDeposit}
          onDepositSimulate={handleDepositSimulate}
        />
      ) : showWithdraw ? (
        <WithdrawalForm balance={balance} onClose={handleCloseWithdraw} onWithdraw={handleWithdrawSubmit} />
      ) : (
        <>
          <WalletOverview
            balance={balance}
            onDeposit={handleDeposit}
            onWithdraw={handleWithdraw}
            onRefresh={handleRefresh}
            isRefreshing={refreshing}
          />

          <div className="mt-8">
            <Tabs defaultValue="transactions">
              <TabsList className="grid w-full grid-cols-1">
                <TabsTrigger value="transactions">Transaction History</TabsTrigger>
              </TabsList>

              <TabsContent value="transactions" className="mt-4">
                <TransactionHistory transactions={transactions} />
              </TabsContent>
            </Tabs>
          </div>
        </>
      )}
    </div>
  )
}

