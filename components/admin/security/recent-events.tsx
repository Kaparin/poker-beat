"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatDistanceToNow } from "date-fns"
import { ru } from "date-fns/locale"

type SecurityEvent = {
  id: string
  action: string
  user_id?: string
  ip_address?: string
  details?: any
  created_at: string
}

export default function RecentSecurityEvents() {
  const [events, setEvents] = useState<SecurityEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch("/api/admin/security/dashboard")

        if (!response.ok) {
          throw new Error("Failed to fetch security events")
        }

        const data = await response.json()
        setEvents(data.recentEvents || [])
      } catch (error) {
        console.error("Error fetching security events:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [])

  const getActionBadge = (action: string) => {
    switch (action) {
      case "admin_login_failed":
        return <Badge variant="destructive">Неудачный вход</Badge>
      case "admin_login_success":
        return <Badge className="bg-green-500">Успешный вход</Badge>
      case "user_banned":
        return <Badge variant="destructive">Блокировка пользователя</Badge>
      case "user_unbanned":
        return <Badge className="bg-green-500">Разблокировка пользователя</Badge>
      case "rate_limit_exceeded":
        return (
          <Badge variant="outline" className="text-yellow-500 border-yellow-500">
            Превышение лимита
          </Badge>
        )
      case "api_error":
        return <Badge variant="destructive">Ошибка API</Badge>
      case "slow_request":
        return (
          <Badge variant="outline" className="text-orange-500 border-orange-500">
            Медленный запрос
          </Badge>
        )
      case "suspicious_activity":
        return <Badge variant="destructive">Подозрительная активность</Badge>
      default:
        return <Badge variant="outline">{action}</Badge>
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">Недавние события безопасности</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
                <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {events.length === 0 ? (
              <p className="text-center py-4 text-gray-500 dark:text-gray-400">Нет недавних событий безопасности</p>
            ) : (
              events.map((event) => (
                <div key={event.id} className="flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">{getActionBadge(event.action)}</div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <span>{formatDistanceToNow(new Date(event.created_at), { addSuffix: true, locale: ru })}</span>
                      {event.ip_address && <span>IP: {event.ip_address}</span>}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Link href="/admin/security/logs">
            <Button variant="outline" className="w-full">
              Все события безопасности
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

