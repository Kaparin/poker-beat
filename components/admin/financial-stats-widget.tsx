"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { dashboardApi } from "@/lib/api-client"

export function FinancialStatsWidget() {
  const [financialData, setFinancialData] = useState({
    totalDeposits: 0,
    totalWithdrawals: 0,
    totalRake: 0,
    profitToday: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchFinancialData = async () => {
      try {
        const response = await dashboardApi.getFinancialStatsData()

        if (response.error) {
          console.error("Ошибка при загрузке финансовых данных:", response.error)
          return
        }

        if (response.data) {
          setFinancialData(response.data)
        }
      } catch (error) {
        console.error("Ошибка при загрузке финансовых данных:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchFinancialData()
  }, [])

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Всего депозитов</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {loading ? "Загрузка..." : `${financialData.totalDeposits.toLocaleString()} фишек`}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Всего выводов</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {loading ? "Загрузка..." : `${financialData.totalWithdrawals.toLocaleString()} фишек`}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Всего рейка</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {loading ? "Загрузка..." : `${financialData.totalRake.toLocaleString()} фишек`}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Прибыль сегодня</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {loading ? "Загрузка..." : `${financialData.profitToday.toLocaleString()} фишек`}
          </div>
        </CardContent>
      </Card>
    </>
  )
}

