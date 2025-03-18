"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { Bell, Check, Trash2, UserPlus, Trophy, Calendar, Wallet, Info } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ru } from "date-fns/locale"

interface Notification {
  id: string
  userId: number
  type: "friend_request" | "tournament" | "achievement" | "system" | "transaction"
  title: string
  message: string
  read: boolean
  actionUrl?: string
  createdAt: Date
}

export function NotificationCenter() {
  const { token } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("all")

  // Fetch notifications on component mount and when popover opens
  useEffect(() => {
    if (token) {
      fetchNotifications()

      // Set up polling for new notifications
      const interval = setInterval(fetchUnreadCount, 60000) // Check every minute
      return () => clearInterval(interval)
    }
  }, [token])

  useEffect(() => {
    if (isOpen) {
      fetchNotifications()
    }
  }, [isOpen])

  const fetchNotifications = async () => {
    if (!token) return

    try {
      const response = await fetch("/api/notifications", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch notifications")
      }

      const data = await response.json()
      setNotifications(data.notifications || [])
      setUnreadCount(data.notifications.filter((n: Notification) => !n.read).length)
    } catch (error) {
      console.error("Error fetching notifications:", error)
    }
  }

  const fetchUnreadCount = async () => {
    if (!token) return

    try {
      const response = await fetch("/api/notifications/unread-count", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch unread count")
      }

      const data = await response.json()
      setUnreadCount(data.count)
    } catch (error) {
      console.error("Error fetching unread count:", error)
    }
  }

  const markAsRead = async (notificationId: string) => {
    if (!token) return

    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to mark notification as read")
      }

      setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)))
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  const markAllAsRead = async () => {
    if (!token) return

    try {
      const response = await fetch("/api/notifications/mark-all-read", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to mark all notifications as read")
      }

      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      setUnreadCount(0)

      toast({
        title: "Успешно",
        description: "Все уведомления отмечены как прочитанные",
      })
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось отметить уведомления как прочитанные",
        variant: "destructive",
      })
    }
  }

  const deleteNotification = async (notificationId: string) => {
    if (!token) return

    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to delete notification")
      }

      setNotifications((prev) => prev.filter((n) => n.id !== notificationId))

      const wasUnread = notifications.find((n) => n.id === notificationId)?.read === false
      if (wasUnread) {
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error("Error deleting notification:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось удалить уведомление",
        variant: "destructive",
      })
    }
  }

  const clearAllNotifications = async () => {
    if (!token) return

    try {
      const response = await fetch("/api/notifications/clear-all", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to clear all notifications")
      }

      setNotifications([])
      setUnreadCount(0)

      toast({
        title: "Успешно",
        description: "Все уведомления удалены",
      })
    } catch (error) {
      console.error("Error clearing all notifications:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось удалить все уведомления",
        variant: "destructive",
      })
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id)
    }

    if (notification.actionUrl) {
      window.location.href = notification.actionUrl
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "friend_request":
        return <UserPlus className="h-5 w-5 text-blue-500" />
      case "tournament":
        return <Calendar className="h-5 w-5 text-purple-500" />
      case "achievement":
        return <Trophy className="h-5 w-5 text-yellow-500" />
      case "transaction":
        return <Wallet className="h-5 w-5 text-green-500" />
      case "system":
      default:
        return <Info className="h-5 w-5 text-gray-500" />
    }
  }

  const filteredNotifications = notifications.filter((notification) => {
    if (activeTab === "all") return true
    if (activeTab === "unread") return !notification.read
    return notification.type === activeTab
  })

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-red-500 text-[10px] font-medium text-white flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[380px] p-0" align="end">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-medium">Уведомления</h3>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={markAllAsRead}>
                <Check className="h-3.5 w-3.5 mr-1" />
                Прочитать все
              </Button>
            )}
            <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={clearAllNotifications}>
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              Очистить
            </Button>
          </div>
        </div>

        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <div className="border-b">
            <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
              <TabsTrigger
                value="all"
                className="rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                Все
              </TabsTrigger>
              <TabsTrigger
                value="unread"
                className="rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                Непрочитанные
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="max-h-[300px] overflow-y-auto">
            <TabsContent value="all" className="m-0">
              {renderNotificationsList()}
            </TabsContent>
            <TabsContent value="unread" className="m-0">
              {renderNotificationsList()}
            </TabsContent>
            <TabsContent value="friend_request" className="m-0">
              {renderNotificationsList()}
            </TabsContent>
            <TabsContent value="tournament" className="m-0">
              {renderNotificationsList()}
            </TabsContent>
            <TabsContent value="achievement" className="m-0">
              {renderNotificationsList()}
            </TabsContent>
            <TabsContent value="system" className="m-0">
              {renderNotificationsList()}
            </TabsContent>
          </div>
        </Tabs>
      </PopoverContent>
    </Popover>
  )

  function renderNotificationsList() {
    if (filteredNotifications.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Bell className="h-8 w-8 text-gray-400 mb-2" />
          <p className="text-sm text-gray-500">Нет уведомлений</p>
        </div>
      )
    }

    return filteredNotifications.map((notification) => (
      <div
        key={notification.id}
        className={`border-b last:border-0 p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
          !notification.read ? "bg-blue-50 dark:bg-blue-900/20" : ""
        }`}
        onClick={() => handleNotificationClick(notification)}
      >
        <div className="flex gap-3">
          <div className="mt-0.5">{getNotificationIcon(notification.type)}</div>
          <div className="flex-1">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium text-sm">{notification.title}</p>
                <p className="text-sm text-gray-500 mt-1">{notification.message}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0 rounded-full"
                onClick={(e) => {
                  e.stopPropagation()
                  deleteNotification(notification.id)
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span className="sr-only">Удалить</span>
              </Button>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <p className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: ru })}
              </p>
              {!notification.read && (
                <Badge
                  variant="outline"
                  className="text-[10px] px-1 py-0 h-4 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                >
                  Новое
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>
    ))
  }
}

