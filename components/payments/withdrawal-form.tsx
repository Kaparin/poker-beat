"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Check, Loader2 } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface WithdrawalFormProps {
  userId: number
  balance: number
  onSuccess?: (amount: number) => void
}

export default function WithdrawalForm({ userId, balance, onSuccess }: WithdrawalFormProps) {
  const [amount, setAmount] = useState<number>(0)
  const [tonAmount, setTonAmount] = useState<number>(0)
  const [walletAddress, setWalletAddress] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<boolean>(false)
  const [dailyLimit, setDailyLimit] = useState<number>(0)
  const [monthlyLimit, setMonthlyLimit] = useState<number>(0)
  const [dailyUsed, setDailyUsed] = useState<number>(0)
  const [monthlyUsed, setMonthlyUsed] = useState<number>(0)

  const TON_TO_CHIPS_RATE = process.env.NEXT_PUBLIC_TON_TO_CHIPS_RATE || 100

  useEffect(() => {
    // Получаем информацию о лимитах вывода
    const fetchLimits = async () => {
      try {
        const response = await fetch(`/api/wallet/withdrawal-limits?userId=${userId}`)
        const data = await response.json()

        if (response.ok) {
          setDailyLimit(data.dailyLimit)
          setMonthlyLimit(data.monthlyLimit)
          setDailyUsed(data.dailyUsed)
          setMonthlyUsed(data.monthlyUsed)
        }
      } catch (err) {
        console.error("Ошибка при получении лимитов:", err)
      }
    }

    fetchLimits()
  }, [userId])

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

    if (amount > balance) {
      setError("Недостаточно средств на балансе")
      return
    }

    if (!walletAddress) {
      setError("Пожалуйста, введите адрес кошелька TON")
      return
    }

    if (dailyUsed + amount > dailyLimit) {
      setError(`Превышен дневной лимит вывода (${dailyLimit} фишек)`)
      return
    }

    if (monthlyUsed + amount > monthlyLimit) {
      setError(`Превышен месячный лимит вывода (${monthlyLimit} фишек)`)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/wallet/withdraw", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          amount,
          tonAmount,
          walletAddress,
          withdrawalMethod: "ton",
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Произошла ошибка при создании заявки на вывод")
      }

      setSuccess(true)

      if (onSuccess) {
        onSuccess(amount)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Произошла неизвестная ошибка")
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setAmount(0)
    setTonAmount(0)
    setWalletAddress("")
    setSuccess(false)
    setError(null)
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Вывод средств</CardTitle>
        <CardDescription>Выведите фишки на свой TON кошелек</CardDescription>
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
            <h3 className="text-xl font-semibold text-center">Заявка на вывод создана!</h3>
            <p className="text-center text-muted-foreground">
              Ваша заявка на вывод {amount} фишек ({tonAmount.toFixed(2)} TON) успешно создана и будет обработана в
              ближайшее время.
            </p>
            <Button onClick={resetForm} className="mt-4">
              Новый вывод
            </Button>
          </div>
        ) : (
          <>
            <div className="mb-4 p-3 bg-blue-50 rounded-md">
              <h4 className="font-medium text-blue-800 mb-1">Информация о лимитах</h4>
              <div className="text-sm text-blue-700 space-y-1">
                <p>
                  Дневной лимит: {dailyUsed} / {dailyLimit} фишек
                </p>
                <p>
                  Месячный лимит: {monthlyUsed} / {monthlyLimit} фишек
                </p>
                <p>Доступно для вывода: {balance} фишек</p>
              </div>
            </div>

            <Tabs defaultValue="chips">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="chips">Фишки</TabsTrigger>
                <TabsTrigger value="ton">TON</TabsTrigger>
              </TabsList>

              <TabsContent value="chips">
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="chips-amount">Количество фишек</Label>
                    <Input
                      id="chips-amount"
                      type="number"
                      min="0"
                      max={balance}
                      value={amount || ""}
                      onChange={handleAmountChange}
                      placeholder="Введите количество фишек"
                    />
                    <p className="text-sm text-muted-foreground">Вы получите примерно {tonAmount.toFixed(2)} TON</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="wallet-address">Адрес TON кошелька</Label>
                    <Input
                      id="wallet-address"
                      value={walletAddress}
                      onChange={(e) => setWalletAddress(e.target.value)}
                      placeholder="Введите адрес TON кошелька"
                    />
                  </div>

                  <Button type="submit" className="w-full mt-6" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Обработка...
                      </>
                    ) : (
                      "Создать заявку на вывод"
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="ton">
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="ton-amount">Сумма в TON</Label>
                    <Input
                      id="ton-amount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={tonAmount || ""}
                      onChange={handleTonAmountChange}
                      placeholder="Введите сумму в TON"
                    />
                    <p className="text-sm text-muted-foreground">Будет списано {amount} фишек</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="wallet-address-ton">Адрес TON кошелька</Label>
                    <Input
                      id="wallet-address-ton"
                      value={walletAddress}
                      onChange={(e) => setWalletAddress(e.target.value)}
                      placeholder="Введите адрес TON кошелька"
                    />
                  </div>

                  <Button type="submit" className="w-full mt-6" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Обработка...
                      </>
                    ) : (
                      "Создать заявку на вывод"
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </>
        )}
      </CardContent>
    </Card>
  )
}

