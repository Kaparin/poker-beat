"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatDistanceToNow } from "date-fns"
import { ru } from "date-fns/locale"
import type { ChatMessage } from "@/lib/socket-client"
import { Send } from "lucide-react"

interface TableChatProps {
  messages: ChatMessage[]
  onSendMessage: (message: string) => void
}

export function TableChat({ messages, onSendMessage }: TableChatProps) {
  const [message, setMessage] = useState("")
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Прокрутка вниз при получении новых сообщений
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  const handleSendMessage = () => {
    if (message.trim()) {
      onSendMessage(message)
      setMessage("")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSendMessage()
    }
  }

  return (
    <div className="flex flex-col h-[400px]">
      <ScrollArea className="flex-1 p-2" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-4">Нет сообщений</div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className="flex items-start space-x-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={msg.avatarUrl || ""} alt={msg.username} />
                  <AvatarFallback>{msg.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center">
                    <span className="text-sm font-medium">{msg.username}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true, locale: ru })}
                    </span>
                  </div>
                  <p className="text-sm">{msg.message}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
      <div className="flex items-center space-x-2 p-2 border-t">
        <Input
          placeholder="Введите сообщение..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <Button size="icon" onClick={handleSendMessage} disabled={!message.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

