"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { formatDate } from "@/lib/utils"

export default function TreasuryDashboard() {
  const { toast } = useToast()
  const [treasuryData, setTreasuryData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [allocateAmount, setAllocateAmount] = useState("")
  const [allocatePurpose, setAllocatePurpose] = useState("")
  const [allocateDescription, setAllocateDescription] = useState("")
  const [allocating, setAllocating] = useState(false)

  // Загрузка данных о Treasury Pool
  useEffect(() => {
    const fetchTreasuryData = async () => {
      try {
        const response = await fetch("/api/admin/treasury")
        if (!response.ok) throw new Error("Ошибка при загрузке данных")
        const data = await response.json()
        setTreasuryData(data)
      } catch (error) {
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить данные о Treasury Pool",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchTreasuryData()
  }, [toast])

  // Выделение средств из Treasury Pool
  const handleAllocateFunds = async () => {
    if (!allocateAmount || !allocatePurpose || !allocateDescription) {
      toast({
        title: "Ошибка",
        description: "Заполните все поля",
        variant: "destructive",
      })
      return
    }

    setAllocating(true)
    try {
      const response = await fetch("/api/admin/treasury", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: Number.parseInt(allocateAmount),
          purpose: allocatePurpose,
          description: allocateDescription,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Ошибка при выделении средств")
      }

      toast({
        title: "Успешно",
        description: "Средства успешно выделены из Treasury Pool",
      })

      // Обновляем данные
      const updatedResponse = await fetch("/api/admin/treasury")
      const updatedData = await updatedResponse.json()
      setTreasuryData(updatedData)

      // Сбрасываем форму
      setAllocateAmount("")
      setAllocatePurpose("")
      setAllocateDescription("")
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setAllocating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>Загрузка данных...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Баланс Treasury Pool</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{treasuryData?.treasuryPool?.totalAmount.toLocaleString()} фишек</div>
            <p className="text-xs text-muted-foreground mt-1">
              Обновлено: {formatDate(treasuryData?.treasuryPool?.lastUpdated)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Джекпот</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{treasuryData?.jackpot?.amount.toLocaleString()} фишек</div>
            <p className="text-xs text-muted-foreground mt-1">
              Обновлено: {formatDate(treasuryData?.jackpot?.lastUpdated)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Всего рейка собрано</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{treasuryData?.statistics?.totalRakeAmount.toLocaleString()} фишек</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Всего в Treasury Pool</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {treasuryData?.statistics?.totalTreasuryAmount.toLocaleString()} фишек
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="allocations">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="allocations">Выделение средств</TabsTrigger>
          <TabsTrigger value="history">История выделений</TabsTrigger>
          <TabsTrigger value="distributions">Распределение банков</TabsTrigger>
        </TabsList>

        <TabsContent value="allocations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Выделение средств из Treasury Pool</CardTitle>
              <CardDescription>Выделите средства из Treasury Pool на определенную цель</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Сумма (фишки)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Введите сумму"
                  value={allocateAmount}
                  onChange={(e) => setAllocateAmount(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="purpose">Цель</Label>
                <Input
                  id="purpose"
                  placeholder="Например: турнир, акция, лидерборд"
                  value={allocatePurpose}
                  onChange={(e) => setAllocatePurpose(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Описание</Label>
                <Textarea
                  id="description"
                  placeholder="Подробное описание цели выделения средств"
                  value={allocateDescription}
                  onChange={(e) => setAllocateDescription(e.target.value)}
                />
              </div>
              <Button
                onClick={handleAllocateFunds}
                disabled={allocating || !allocateAmount || !allocatePurpose || !allocateDescription}
                className="w-full"
              >
                {allocating ? "Выделение средств..." : "Выделить средства"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>История выделения средств</CardTitle>
              <CardDescription>Последние 50 операций выделения средств из Treasury Pool</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Дата</TableHead>
                    <TableHead>Сумма</TableHead>
                    <TableHead>Цель</TableHead>
                    <TableHead className="hidden md:table-cell">Описание</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {treasuryData?.allocations?.length > 0 ? (
                    treasuryData.allocations.map((allocation: any) => (
                      <TableRow key={allocation.id}>
                        <TableCell>{formatDate(allocation.timestamp)}</TableCell>
                        <TableCell>{allocation.amount.toLocaleString()} фишек</TableCell>
                        <TableCell>{allocation.purpose}</TableCell>
                        <TableCell className="hidden md:table-cell">{allocation.description}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center">
                        Нет данных о выделении средств
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distributions">
          <Card>
            <CardHeader>
              <CardTitle>Распределение банков</CardTitle>
              <CardDescription>Последние 50 операций распределения банков</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Дата</TableHead>
                    <TableHead>Банк</TableHead>
                    <TableHead>Рейк</TableHead>
                    <TableHead>Treasury</TableHead>
                    <TableHead>Джекпот</TableHead>
                    <TableHead className="hidden md:table-cell">Стол</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {treasuryData?.potDistributions?.length > 0 ? (
                    treasuryData.potDistributions.map((distribution: any) => (
                      <TableRow key={distribution.id}>
                        <TableCell>{formatDate(distribution.timestamp)}</TableCell>
                        <TableCell>{distribution.potAmount.toLocaleString()}</TableCell>
                        <TableCell>{distribution.rakeAmount.toLocaleString()}</TableCell>
                        <TableCell>{distribution.treasuryAmount.toLocaleString()}</TableCell>
                        <TableCell>{distribution.jackpotAmount.toLocaleString()}</TableCell>
                        <TableCell className="hidden md:table-cell">{distribution.tableId}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">
                        Нет данных о распределении банков
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

