"use client"

// Обновим компонент для отображения статуса транзакций в реальном времени

import { useEffect, useCallback } from "react"
import { subscribeToTransactionUpdates } from "@/lib/socket-client"
import { useAuth } from "@/contexts/auth-context"

// В компоненте WalletOverview добавим:

// Внутри функционального компонента, перед return:
const { token } = useAuth()

const WalletOverview = () => {
  const { token } = useAuth()

  const onRefresh = useCallback(() => {
    // Refresh logic here.  This is a placeholder.
    console.log("Refreshing wallet data...")
  }, [])

  useEffect(() => {
    if (!token) return

    // Подписываемся на обновления транзакций
    const unsubscribe = subscribeToTransactionUpdates(token, (transaction) => {
      // Если транзакция завершена или не удалась, обновляем баланс
      if (transaction.status === "completed" || transaction.status === "failed") {
        onRefresh()
      }
    })

    // Отписываемся при размонтировании
    return () => {
      unsubscribe()
    }
  }, [token, onRefresh])

  return <div>{/* Your wallet overview content here */}</div>
}

export default WalletOverview

