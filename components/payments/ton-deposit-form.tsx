"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Check, Loader2 } from "lucide-react"
import QRCode from "react-qr-code"

interface TonDepositFormProps {
  userId: number
  onSuccess?: (amount: number) => void
}

export default function TonDepositForm({ userId, onSuccess }: TonDepositFormProps) {
  const [amount, setAmount] = useState<number>(0)
  const [tonAmount, setTonAmount] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<boolean>(false)
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [transactionId, setTransactionId] = useState<string | null>(null)

  const TON_TO_CHIPS_RATE = process.env.NEXT_PUBLIC_TON_TO_CHIPS_RATE || 100

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseInt(e.target.value) || 0
    setAmount(value)
    setTonAmount(value / Number.parseInt(TON_TO_CHIPS_RATE.toString()))
  }

  const handleTonAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseFloat(e.target.value) || 0
    setTonAmount(value)
    setAmount(Math.floor(value * Number.parseInt(TON_TO_CHIPS_RATE.toString())))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (amount <= 0) {
      setError("Пожалуйста, введите сумму больше 0")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/wallet/ton-deposit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          amount,
          tonAmount,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Произошла ошибка при создании депозита")
      }

      setWalletAddress(data.walletAddress)
      setTransactionId(data.transactionId)

      // Начинаем проверять статус транзакции
      checkTransactionStatus(data.transactionId)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Произошла неизвестная ошибка")
      setLoading(false)
    }
  }

  const checkTransactionStatus = async (txId: string) => {
    try {
      const response = await fetch(`/api/wallet/ton-deposit/status?transactionId=${txId}`)
      const data = await response.json()

      if (data.status === "completed") {
        setSuccess(true)
        setLoading(false)
        if (onSuccess) {
          onSuccess(amount)
        }
      } else if (data.status === "pending") {
        // Проверяем снова через 10 секунд
        setTimeout(() => checkTransactionStatus(txId), 10000)
      } else {
        throw new Error(data.message || "Ошибка при проверке статуса транзакции")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Произошла ошибка при проверке статуса")
      setLoading(false)
    }
  }

  const resetForm = () => {
    setAmount(0)
    setTonAmount(0)
    setSuccess(false)
    setWalletAddress(null)
    setTransactionId(null)
    setError(null)
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Пополнение через TON</CardTitle>
        <CardDescription>Пополните свой баланс с помощью криптовалюты TON</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Ошибка</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success ? (
          <div className="flex flex-col items-center space-y-4">
            <div className="rounded-full bg-green-100 p-3">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-center">Депозит успешно зачислен!</h3>
            <p className="text-center text-muted-foreground">На ваш счет зачислено {amount} фишек</p>
            <Button onClick={resetForm} className="mt-4">
              Новый депозит
            </Button>
          </div>
        ) : walletAddress ? (
          <div className="flex flex-col items-center space-y-4">
            <h3 className="text-lg font-medium">Отправьте {tonAmount.toFixed(2)} TON на адрес:</h3>
            <div className="p-4 bg-gray-100 rounded-md break-all text-sm">{walletAddress}</div>
            <div className="my-4">
              <QRCode value={`ton://transfer/${walletAddress}?amount=${tonAmount * 1000000000}`} size={200} />
            </div>
            <p className="text-sm text-muted-foreground text-center">
              После отправки TON, фишки будут автоматически зачислены на ваш счет. Не закрывайте эту страницу до
              завершения транзакции.
            </p>
            {loading && (
              <div className="flex items-center space-x-2 mt-4">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span>Ожидание подтверждения...</span>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="chips">Количество фишек</Label>
                <Input
                  id="chips"
                  type="number"
                  min="0"
                  value={amount || ""}
                  onChange={handleAmountChange}
                  placeholder="Введите количество фишек"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ton">Сумма в TON</Label>
                <Input
                  id="ton"
                  type="number"
                  min="0"
                  step="0.01"
                  value={tonAmount || ""}
                  onChange={handleTonAmountChange}
                  placeholder="Введите сумму в TON"
                />
              </div>

              <div className="text-sm text-muted-foreground">Курс обмена: 1 TON = {TON_TO_CHIPS_RATE} фишек</div>
            </div>

            <Button type="submit" className="w-full mt-6" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Обработка...
                </>
              ) : (
                "Создать депозит"
              )}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  )
}

