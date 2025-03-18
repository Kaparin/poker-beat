"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { UserPlus, Check, X, UserX, Clock, User, Users } from "lucide-react"
import type { Friend, FriendRequest } from "@/types/friends"
import { formatDistanceToNow } from "date-fns"
import { ru } from "date-fns/locale"

export function FriendList() {
  const { token, user } = useAuth()
  const [friends, setFriends] = useState<Friend[]>([])
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isAddFriendDialogOpen, setIsAddFriendDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("friends")

  // Fetch friends and pending requests on component mount
  useEffect(() => {
    if (token) {
      fetchFriends()
      fetchPendingRequests()
    }
  }, [token])

  const fetchFriends = async () => {
    if (!token) return

    try {
      const response = await fetch("/api/friends", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch friends")
      }

      const data = await response.json()
      setFriends(data.friends || [])
    } catch (error) {
      console.error("Error fetching friends:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить список друзей",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchPendingRequests = async () => {
    if (!token) return

    try {
      const response = await fetch("/api/friends/requests", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch friend requests")
      }

      const data = await response.json()
      setPendingRequests(data.requests || [])
    } catch (error) {
      console.error("Error fetching friend requests:", error)
    }
  }

  const handleSearch = async () => {
    if (!token || !searchQuery.trim()) return

    setIsSearching(true)
    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to search users")
      }

      const data = await response.json()
      setSearchResults(data.users || [])
    } catch (error) {
      console.error("Error searching users:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось выполнить поиск пользователей",
        variant: "destructive",
      })
    } finally {
      setIsSearching(false)
    }
  }

  const handleAddFriend = async (userId: number) => {
    if (!token) return

    try {
      const response = await fetch("/api/friends/requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to send friend request")
      }

      toast({
        title: "Успешно",
        description: "Запрос на добавление в друзья отправлен",
      })

      // Update search results to show pending status
      setSearchResults((prev) => prev.map((user) => (user.id === userId ? { ...user, friendStatus: "PENDING" } : user)))
    } catch (error) {
      console.error("Error sending friend request:", error)
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось отправить запрос",
        variant: "destructive",
      })
    }
  }

  const handleAcceptRequest = async (requestId: number) => {
    if (!token) return

    try {
      const response = await fetch(`/api/friends/requests/${requestId}/accept`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to accept friend request")
      }

      toast({
        title: "Успешно",
        description: "Запрос на добавление в друзья принят",
      })

      // Refresh friends and pending requests
      fetchFriends()
      fetchPendingRequests()
    } catch (error) {
      console.error("Error accepting friend request:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось принять запрос",
        variant: "destructive",
      })
    }
  }

  const handleDeclineRequest = async (requestId: number) => {
    if (!token) return

    try {
      const response = await fetch(`/api/friends/requests/${requestId}/decline`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to decline friend request")
      }

      toast({
        title: "Успешно",
        description: "Запрос на добавление в друзья отклонен",
      })

      // Refresh pending requests
      fetchPendingRequests()
    } catch (error) {
      console.error("Error declining friend request:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось отклонить запрос",
        variant: "destructive",
      })
    }
  }

  const handleRemoveFriend = async (friendId: number) => {
    if (!token) return

    try {
      const response = await fetch(`/api/friends/${friendId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to remove friend")
      }

      toast({
        title: "Успешно",
        description: "Друг удален из списка",
      })

      // Refresh friends list
      fetchFriends()
    } catch (error) {
      console.error("Error removing friend:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось удалить друга",
        variant: "destructive",
      })
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Друзья</h2>
        <Button onClick={() => setIsAddFriendDialogOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Добавить друга
        </Button>
      </div>

      <Tabs defaultValue="friends" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 mb-4">
          <TabsTrigger value="friends">
            <Users className="h-4 w-4 mr-2" />
            Друзья ({friends.length})
          </TabsTrigger>
          <TabsTrigger value="requests">
            <Clock className="h-4 w-4 mr-2" />
            Запросы ({pendingRequests.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="friends" className="mt-0">
          {isLoading ? (
            <div className="text-center py-8">
              <p>Загрузка списка друзей...</p>
            </div>
          ) : friends.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <User className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500 dark:text-gray-400">У вас пока нет друзей</p>
                <Button variant="link" onClick={() => setIsAddFriendDialogOpen(true)} className="mt-2">
                  Добавить друга
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {friends.map((friend) => (
                <Card key={friend.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Avatar className="h-10 w-10 mr-4">
                          <AvatarImage src={friend.friend.avatarUrl || ""} alt={friend.friend.username} />
                          <AvatarFallback>{friend.friend.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{friend.friend.username}</p>
                          <div className="flex items-center mt-1">
                            {friend.friend.isOnline ? (
                              <Badge
                                variant="outline"
                                className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                              >
                                Онлайн
                              </Badge>
                            ) : (
                              <span className="text-xs text-gray-500">
                                {friend.friend.lastActive
                                  ? `Был в сети ${formatDistanceToNow(new Date(friend.friend.lastActive), { addSuffix: true, locale: ru })}`
                                  : "Не в сети"}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          Пригласить играть
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleRemoveFriend(friend.friendId)}>
                          <UserX className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="requests" className="mt-0">
          {pendingRequests.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Clock className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500 dark:text-gray-400">У вас нет входящих запросов на добавление в друзья</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pendingRequests.map((request) => (
                <Card key={request.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Avatar className="h-10 w-10 mr-4">
                          <AvatarImage src={request.sender.avatarUrl || ""} alt={request.sender.username} />
                          <AvatarFallback>{request.sender.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{request.sender.username}</p>
                          <p className="text-xs text-gray-500">
                            Запрос отправлен{" "}
                            {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true, locale: ru })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleAcceptRequest(request.id)}>
                          <Check className="h-4 w-4 mr-2" />
                          Принять
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeclineRequest(request.id)}>
                          <X className="h-4 w-4 mr-2" />
                          Отклонить
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Friend Dialog */}
      <Dialog open={isAddFriendDialogOpen} onOpenChange={setIsAddFriendDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Добавить друга</DialogTitle>
            <DialogDescription>
              Найдите пользователя по имени и отправьте запрос на добавление в друзья.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2">
            <div className="grid flex-1 gap-2">
              <Input
                placeholder="Введите имя пользователя"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>
            <Button onClick={handleSearch} disabled={isSearching || !searchQuery.trim()}>
              {isSearching ? "Поиск..." : "Найти"}
            </Button>
          </div>

          <div className="max-h-60 overflow-y-auto">
            {searchResults.length > 0 ? (
              <div className="space-y-2">
                {searchResults.map((result) => (
                  <div key={result.id} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center">
                      <Avatar className="h-8 w-8 mr-2">
                        <AvatarImage src={result.photoUrl || ""} alt={result.username} />
                        <AvatarFallback>{result.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span>{result.username}</span>
                    </div>
                    {result.id !== user?.id && (
                      <div>
                        {result.friendStatus === "ACCEPTED" ? (
                          <Badge variant="outline" className="bg-green-100 text-green-800">
                            Уже в друзьях
                          </Badge>
                        ) : result.friendStatus === "PENDING" ? (
                          <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                            Запрос отправлен
                          </Badge>
                        ) : (
                          <Button size="sm" onClick={() => handleAddFriend(result.id)}>
                            Добавить
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : searchQuery && !isSearching ? (
              <p className="text-center py-4 text-gray-500">Пользователи не найдены</p>
            ) : null}
          </div>

          <DialogFooter className="sm:justify-end">
            <Button variant="secondary" onClick={() => setIsAddFriendDialogOpen(false)}>
              Закрыть
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

