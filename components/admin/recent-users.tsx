"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatDistanceToNow } from "date-fns"
import { ru } from "date-fns/locale"

type User = {
  id: string
  username: string
  avatar_url?: string
  status: "active" | "banned" | "suspended"
  created_at: string
}

export default function RecentUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch("/api/admin/users?limit=5")

        if (!response.ok) {
          throw new Error("Failed to fetch users")
        }

        const data = await response.json()
        setUsers(data)
      } catch (error) {
        console.error("Error fetching users:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500">Активен</Badge>
      case "banned":
        return <Badge variant="destructive">Заблокирован</Badge>
      case "suspended":
        return (
          <Badge variant="outline" className="text-yellow-500 border-yellow-500">
            Приостановлен
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getInitials = (username: string) => {
    return username.substring(0, 2).toUpperCase()
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">Недавние пользователи</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {users.map((user) => (
              <div key={user.id} className="flex items-center gap-4">
                <Avatar>
                  <AvatarImage src={user.avatar_url} />
                  <AvatarFallback>{getInitials(user.username)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{user.username}</p>
                    {getStatusBadge(user.status)}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Создан {formatDistanceToNow(new Date(user.created_at), { addSuffix: true, locale: ru })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Link href="/admin/users">
            <Button variant="outline" className="w-full">
              Все пользователи
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

