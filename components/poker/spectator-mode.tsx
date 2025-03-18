"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Eye, X, Users } from "lucide-react"
import { cn } from "@/lib/utils"

interface Spectator {
  id: number
  name: string
  avatarUrl?: string
}

interface SpectatorModeProps {
  tableId: string
  spectators: Spectator[]
  isSpectating: boolean
  onToggleSpectate: () => void
  className?: string
}

export function SpectatorMode({ tableId, spectators, isSpectating, onToggleSpectate, className }: SpectatorModeProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!isExpanded) {
    return (
      <Button
        variant={isSpectating ? "default" : "outline"}
        size="sm"
        className={cn("fixed top-4 right-4 shadow-lg", className)}
        onClick={() => setIsExpanded(true)}
      >
        <Eye className="h-4 w-4 mr-2" />
        Spectators
        <Badge variant="secondary" className="ml-2">
          {spectators.length}
        </Badge>
      </Button>
    )
  }

  return (
    <Card className={cn("fixed top-4 right-4 w-64 shadow-lg", className)}>
      <CardHeader className="p-3 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium flex items-center">
          <Users className="h-4 w-4 mr-2" />
          Spectators ({spectators.length})
        </CardTitle>
        <Button variant="ghost" size="icon" onClick={() => setIsExpanded(false)}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="p-3">
        {spectators.length > 0 ? (
          <ScrollArea className="h-40">
            <div className="space-y-2">
              {spectators.map((spectator) => (
                <div key={spectator.id} className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs overflow-hidden">
                    {spectator.avatarUrl ? (
                      <img
                        src={spectator.avatarUrl || "/placeholder.svg"}
                        alt={spectator.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      spectator.name.charAt(0)
                    )}
                  </div>
                  <span className="text-sm truncate">{spectator.name}</span>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No spectators watching</p>
        )}

        <Button
          variant={isSpectating ? "destructive" : "default"}
          size="sm"
          className="w-full mt-3"
          onClick={onToggleSpectate}
        >
          {isSpectating ? "Stop Spectating" : "Spectate Table"}
        </Button>
      </CardContent>
    </Card>
  )
}

