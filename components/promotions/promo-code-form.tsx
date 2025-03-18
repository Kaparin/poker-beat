"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Check, Loader2 } from "lucide-react"

interface PromoCodeFormProps {
  userId: number
  onSuccess?: (amount: number) => void
}

export default function PromoCodeForm({ userId, onSuccess }: PromoCodeFormProps) {
  const [promoCode, setPromoCode] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<boolean>(false)
  const [reward, setReward] = useState<number>(0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!promoCode.trim()) {
      setError("Пожалуйста, введите промокод")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/promotions/redeem-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          promoCode: promoCode.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Произошла ошибка при активации промокода")
      }

      setSuccess(true)
      setReward(data.reward)

      if (onSuccess) {
        onSuccess(data.reward)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Произошла неизвестная ошибка")
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setPromoCode("")
    setSuccess(false)
    setError(null)
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Активация промокода</CardTitle>
        <CardDescription>Введите промокод для получения бонуса</CardDescription>
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
            <h3 className="text-xl font-semibold text-center">Промокод активирован!</h3>
            <p className="text-center text-muted-foreground">На ваш счет зачислено {reward} фишек</p>
            <Button onClick={resetForm} className="mt-4">
              Активировать другой промокод
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="promo-code">Промокод</Label>
                <Input
                  id="promo-code"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  placeholder="Введите промокод"
                />
              </div>
            </div>

            <Button type="submit" className="w-full mt-6" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Проверка...
                </>
              ) : (
                "Активировать"
              )}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  )
}

