"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Send, MessageSquare, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"

interface ChatMessage {
  id: string
  userId: number
  userName: string
  message: string
  timestamp: Date
  isSystem?: boolean
}

interface TableChatProps {
  tableId: string
  onSendMessage: (message: string) => void
  messages: ChatMessage[]
  className?: string
}

export function TableChat({ tableId, onSendMessage, messages, className }: TableChatProps) {
  const [message, setMessage] = useState("")
  const [isExpanded, setIsExpanded] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { user } = useAuth()

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  const handleSendMessage = () => {
    if (message.trim()) {
      onSendMessage(message.trim())
      setMessage("")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSendMessage()
    }
  }

  // Format timestamp to local time
  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  if (!isExpanded) {
    return (
      <Button
        variant="outline"
        size="icon"
        className={cn("fixed bottom-4 right-4 h-12 w-12 rounded-full shadow-lg", className)}
        onClick={() => setIsExpanded(true)}
      >
        <MessageSquare className="h-6 w-6" />
        {messages.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {messages.length > 9 ? "9+" : messages.length}
          </span>
        )}
      </Button>
    )
  }

  return (
    <Card className={cn("fixed bottom-4 right-4 w-80 h-96 shadow-lg", className)}>
      <CardHeader className="p-3 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium">Table Chat</CardTitle>
        <Button variant="ghost" size="icon" onClick={() => setIsExpanded(false)}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="p-0 flex flex-col h-[calc(100%-56px)]">
        <ScrollArea className="flex-1 p-3">
          <div className="space-y-2">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "p-2 rounded-lg max-w-[90%]",
                  msg.isSystem
                    ? "bg-gray-100 dark:bg-gray-800 text-center mx-auto text-xs text-gray-500 dark:text-gray-400"
                    : msg.userId === user?.id
                      ? "bg-blue-500 text-white ml-auto"
                      : "bg-gray-200 dark:bg-gray-700 mr-auto",
                )}
              >
                {!msg.isSystem && (
                  <div className="text-xs font-medium mb-1">{msg.userId === user?.id ? "You" : msg.userName}</div>
                )}
                <div className="break-words">{msg.message}</div>
                <div className="text-xs opacity-70 text-right mt-1">{formatTime(msg.timestamp)}</div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        <div className="p-3 border-t">
          <div className="flex space-x-2">
            <Input
              placeholder="Type a message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1"
            />
            <Button size="icon" onClick={handleSendMessage} disabled={!message.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

