"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Copy, Check, Users, Loader2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface ReferralProgramProps {
  userId: number
}

interface Referral {
  id: number
  referredUserId: number
  referredUsername: string
  status: string
  registeredAt: string
  earnings: number
}

export default function ReferralProgram({ userId }: ReferralProgramProps) {
  const [referralCode, setReferralCode] = useState<string>("")
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [totalEarnings, setTotalEarnings] = useState<number>(0)
  const [activeReferrals, setActiveReferrals] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState<boolean>(false)
  const [referralLink, setReferralLink] = useState<string>("")

  useEffect(() => {
    fetchReferralData()
  }, [userId])

  const fetchReferralData = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/referrals?userId=${userId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Ошибка при получении данных реферальной программы")
      }

      setReferralCode(data.referralCode)
      setReferrals(data.referrals)
      setTotalEarnings(data.totalEarnings)
      setActiveReferrals(data.activeReferrals)

      // Формируем реферальную ссылку
      const baseUrl = window.location.origin
      setReferralLink(`${baseUrl}/register?ref=${data.referralCode}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Произошла неизвестная ошибка")
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Реферальная программа</CardTitle>
        <CardDescription>Приглашайте друзей и получайте бонусы за их активность</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Ошибка</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <Tabs defaultValue="overview">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="overview">Обзор</TabsTrigger>
              <TabsTrigger value="referrals">Мои рефералы</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="p-4">
                    <CardTitle className="text-lg">Всего заработано</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <p className="text-3xl font-bold">{totalEarnings}</p>
                    <p className="text-sm text-muted-foreground">фишек</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="p-4">
                    <CardTitle className="text-lg">Активные рефералы</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <p className="text-3xl font-bold">{activeReferrals}</p>
                    <p className="text-sm text-muted-foreground">пользователей</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="p-4">
                    <CardTitle className="text-lg">Всего рефералов</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <p className="text-3xl font-bold">{referrals.length}</p>
                    <p className="text-sm text-muted-foreground">пользователей</p>
                  </CardContent>
                </Card>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-2">Ваш реферальный код</h3>
                <div className="flex space-x-2">
                  <Input value={referralCode} readOnly className="font-mono" />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(referralCode)}
                    title="Копировать код"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-2">Ваша реферальная ссылка</h3>
                <div className="flex space-x-2">
                  <Input value={referralLink} readOnly className="font-mono text-xs" />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(referralLink)}
                    title="Копировать ссылку"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-lg font-medium mb-2">Как это работает</h3>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Поделитесь своим реферальным кодом или ссылкой с друзьями</li>
                  <li>Когда они регистрируются, вы получаете 100 фишек</li>
                  <li>За каждое пополнение реферала вы получаете 5% от суммы</li>
                  <li>За активность рефералов в играх вы получаете дополнительные бонусы</li>
                </ul>
              </div>
            </TabsContent>

            <TabsContent value="referrals" className="mt-4">
              {referrals.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">У вас пока нет рефералов</h3>
                  <p className="text-muted-foreground mt-2">
                    Поделитесь своим реферальным кодом с друзьями, чтобы начать зарабатывать
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Пользователь</TableHead>
                      <TableHead>Статус</TableHead>
                      <TableHead>Дата регистрации</TableHead>
                      <TableHead>Заработано</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {referrals.map((referral) => (
                      <TableRow key={referral.id}>
                        <TableCell>{referral.referredUsername}</TableCell>
                        <TableCell>
                          {referral.status === "active" ? (
                            <span className="text-green-600">Активен</span>
                          ) : (
                            <span className="text-muted-foreground">Неактивен</span>
                          )}
                        </TableCell>
                        <TableCell>{new Date(referral.registeredAt).toLocaleDateString("ru-RU")}</TableCell>
                        <TableCell>{referral.earnings} фишек</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  )
}

