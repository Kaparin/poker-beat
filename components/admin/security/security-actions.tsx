"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Ban, UserCheck, Shield, RefreshCw } from "lucide-react"

export default function SecurityActions() {
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefreshSecurityStats = async () => {
    setIsRefreshing(true)

    try {
      // Здесь можно добавить логику для обновления статистики безопасности
      // Например, вызов API для инвалидации кэша
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Перезагружаем страницу для обновления данных
      window.location.reload()
    } catch (error) {
      console.error("Error refreshing security stats:", error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const actions = [
    {
      title: "Заблокированные пользователи",
      description: "Управление заблокированными пользователями",
      icon: <Ban className="h-5 w-5" />,
      href: "/admin/security/banned-users",
    },
    {
      title: "Разблокировать пользователя",
      description: "Разблокировать ранее заблокированного пользователя",
      icon: <UserCheck className="h-5 w-5" />,
      href: "/admin/security/banned-users",
    },
    {
      title: "Журнал безопасности",
      description: "Просмотр всех событий безопасности",
      icon: <Shield className="h-5 w-5" />,
      href: "/admin/security/logs",
    },
  ]

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">Действия безопасности</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {actions.map((action, index) => (
            <Link key={index} href={action.href}>
              <Button variant="outline" className="w-full justify-start text-left h-auto py-3">
                <div className="flex items-center gap-3">
                  {action.icon}
                  <div>
                    <p className="font-medium">{action.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{action.description}</p>
                  </div>
                </div>
              </Button>
            </Link>
          ))}

          <Button
            variant="outline"
            className="w-full justify-start text-left h-auto py-3"
            onClick={handleRefreshSecurityStats}
            disabled={isRefreshing}
          >
            <div className="flex items-center gap-3">
              <RefreshCw className={`h-5 w-5 ${isRefreshing ? "animate-spin" : ""}`} />
              <div>
                <p className="font-medium">Обновить статистику</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Обновить данные безопасности</p>
              </div>
            </div>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

