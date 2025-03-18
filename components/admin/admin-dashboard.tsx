"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Overview } from "@/components/admin/overview"
import { RecentUsers } from "@/components/admin/recent-users"
import { RecentGames } from "@/components/admin/recent-games"
import { RecentTransactions } from "@/components/admin/recent-transactions"
import { TreasuryWidget } from "@/components/admin/treasury-widget"
import { JackpotWidget } from "@/components/admin/jackpot-widget"
import { ActiveTablesWidget } from "@/components/admin/active-tables-widget"
import { ActiveTournamentsWidget } from "@/components/admin/active-tournaments-widget"
import { UserStatsWidget } from "@/components/admin/user-stats-widget"
import { FinancialStatsWidget } from "@/components/admin/financial-stats-widget"

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview")

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Админ панель</h2>
      </div>

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Обзор</TabsTrigger>
          <TabsTrigger value="users">Пользователи</TabsTrigger>
          <TabsTrigger value="games">Игры</TabsTrigger>
          <TabsTrigger value="finances">Финансы</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <TreasuryWidget />
            <JackpotWidget />
            <ActiveTablesWidget />
            <ActiveTournamentsWidget />
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Обзор</CardTitle>
                <CardDescription>Статистика платформы за последние 30 дней</CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <Overview />
              </CardContent>
            </Card>

            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Недавние пользователи</CardTitle>
                <CardDescription>Последние 5 зарегистрированных пользователей</CardDescription>
              </CardHeader>
              <CardContent>
                <RecentUsers />
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Недавние игры</CardTitle>
                <CardDescription>Последние 5 завершенных игр</CardDescription>
              </CardHeader>
              <CardContent>
                <RecentGames />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Недавние транзакции</CardTitle>
                <CardDescription>Последние 5 финансовых операций</CardDescription>
              </CardHeader>
              <CardContent>
                <RecentTransactions />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <UserStatsWidget />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Управление пользователями</CardTitle>
              <CardDescription>Просмотр и управление пользователями платформы</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Здесь будет компонент управления пользователями */}
              <p>Компонент управления пользователями будет добавлен позже</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="games" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <ActiveTablesWidget />
            <ActiveTournamentsWidget />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Управление столами</CardTitle>
              <CardDescription>Просмотр и управление игровыми столами</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Здесь будет компонент управления столами */}
              <p>Компонент управления столами будет добавлен позже</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Управление турнирами</CardTitle>
              <CardDescription>Просмотр и управление турнирами</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Здесь будет компонент управления турнирами */}
              <p>Компонент управления турнирами будет добавлен позже</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="finances" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <TreasuryWidget />
            <JackpotWidget />
            <FinancialStatsWidget />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Управление Treasury Pool</CardTitle>
              <CardDescription>Просмотр и управление средствами Treasury Pool</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Здесь будет компонент управления Treasury Pool */}
              <p>Компонент управления Treasury Pool будет добавлен позже</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Управление бонусами и акциями</CardTitle>
              <CardDescription>Просмотр и управление бонусами и акциями</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Здесь будет компонент управления бонусами и акциями */}
              <p>Компонент управления бонусами и акциями будет добавлен позже</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

