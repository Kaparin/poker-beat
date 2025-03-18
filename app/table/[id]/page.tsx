"use client"

import { useEffect, useState, useCallback, useMemo, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, CornerLeftUp } from "lucide-react"
import { EnhancedPokerTable } from "@/components/poker/enhanced-poker-table"
import { TableChat } from "@/components/poker/table-chat"
import { HandHistory } from "@/components/poker/hand-history"
import { SpectatorMode } from "@/components/poker/spectator-mode"
import { UserSettings } from "@/components/poker/user-settings"
import { ActionConfirmation } from "@/components/poker/action-confirmation"
import { toast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import {
  getSocket,
  joinTable,
  leaveTable,
  sendPlayerAction,
  subscribeToGameState,
  subscribeToTableUpdates,
} from "@/lib/socket-client"
import { initAudio, playActionSound, playCardSound, toggleMute } from "@/lib/sounds"
import { loadUserPreferences, saveUserPreferences, DEFAULT_PREFERENCES } from "@/lib/user-preferences"

import type { GameState, PlayerAction } from "@/types/poker"

export default function TablePage() {
  const router = useRouter()
  const params = useParams()
  const { token, user, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState("Loading table...")
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [tableInfo, setTableInfo] = useState<any>(null)
  const [userPreferences, setUserPreferences] = useState(DEFAULT_PREFERENCES)
  const [chatMessages, setChatMessages] = useState<any[]>([])
  const [handHistory, setHandHistory] = useState<any[]>([])
  const [spectators, setSpectators] = useState<any[]>([])
  const [isSpectating, setIsSpectating] = useState(false)
  const [pendingAction, setPendingAction] = useState<{ action: PlayerAction; amount?: number } | null>(null)
  const lastActionRef = useRef<{ playerId: number; action: string } | null>(null)

  // Get table ID from URL params
  const tableId = params?.id as string

  // Load user preferences
  useEffect(() => {
    const prefs = loadUserPreferences()
    setUserPreferences(prefs)

    // Initialize audio on first user interaction
    const handleUserInteraction = () => {
      initAudio()
      document.removeEventListener("click", handleUserInteraction)
    }
    document.addEventListener("click", handleUserInteraction)

    return () => {
      document.removeEventListener("click", handleUserInteraction)
    }
  }, [])

  // Get table information when the component mounts
  useEffect(() => {
    if (!token || !tableId) return

    const fetchTableInfo = async () => {
      try {
        const response = await fetch(`/api/tables/${tableId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error("Failed to fetch table information")
        }

        const data = await response.json()
        setTableInfo(data.table)
      } catch (error) {
        console.error("Error fetching table:", error)
        toast({
          title: "Error",
          description: "Could not load table information",
          variant: "destructive",
        })
      }
    }

    fetchTableInfo()
  }, [tableId, token])

  // Subscribe to game state updates
  useEffect(() => {
    if (!token || !tableId) return

    // Initialize the socket
    const socket = getSocket(token)

    // Subscribe to game state updates
    const unsubscribeGameState = subscribeToGameState(token, (state) => {
      if (state.tableId === tableId) {
        // Play sounds based on game state changes
        if (
          userPreferences.soundEnabled &&
          gameState &&
          state.lastAction &&
          (!lastActionRef.current ||
            lastActionRef.current.playerId !== state.lastAction.playerId ||
            lastActionRef.current.action !== state.lastAction.action)
        ) {
          // Play action sound
          playActionSound(state.lastAction.action)

          // Play card sounds for new community cards
          if (gameState.communityCards.length < state.communityCards.length) {
            playCardSound("flip")
          }

          // Update last action reference
          lastActionRef.current = {
            playerId: state.lastAction.playerId,
            action: state.lastAction.action,
          }
        }

        setGameState(state)
        setLoading(false)
      }
    })

    // Subscribe to table updates
    const unsubscribeTableUpdates = subscribeToTableUpdates(token, (tableUpdate) => {
      if (tableUpdate.id === tableId) {
        setTableInfo(tableUpdate)
      }
    })

    // Connect socket to the table room
    socket.emit("joinTableWatcher", { tableId })

    // Fetch chat messages
    fetchChatMessages()

    // Fetch hand history
    fetchHandHistory()

    // Fetch spectators
    fetchSpectators()

    // Set up polling for updates
    const chatInterval = setInterval(fetchChatMessages, 10000)
    const historyInterval = setInterval(fetchHandHistory, 30000)
    const spectatorsInterval = setInterval(fetchSpectators, 15000)

    return () => {
      unsubscribeGameState()
      unsubscribeTableUpdates()
      clearInterval(chatInterval)
      clearInterval(historyInterval)
      clearInterval(spectatorsInterval)
    }
  }, [token, tableId, userPreferences.soundEnabled])

  // Fetch chat messages
  const fetchChatMessages = useCallback(async () => {
    if (!token || !tableId || !userPreferences.chatEnabled) return

    try {
      const response = await fetch(`/api/tables/${tableId}/chat`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch chat messages")
      }

      const data = await response.json()
      setChatMessages(data.messages || [])
    } catch (error) {
      console.error("Error fetching chat messages:", error)
    }
  }, [token, tableId, userPreferences.chatEnabled])

  // Fetch hand history
  const fetchHandHistory = useCallback(async () => {
    if (!token || !tableId || !userPreferences.showHandHistory) return

    try {
      const response = await fetch(`/api/tables/${tableId}/history`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch hand history")
      }

      const data = await response.json()
      setHandHistory(data.hands || [])
    } catch (error) {
      console.error("Error fetching hand history:", error)
    }
  }, [token, tableId, userPreferences.showHandHistory])

  // Fetch spectators
  const fetchSpectators = useCallback(async () => {
    if (!token || !tableId || !userPreferences.showSpectators) return

    try {
      const response = await fetch(`/api/tables/${tableId}/spectate`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch spectators")
      }

      const data = await response.json()
      setSpectators(data.spectators || [])
      setIsSpectating(data.isSpectating || false)
    } catch (error) {
      console.error("Error fetching spectators:", error)
    }
  }, [token, tableId, userPreferences.showSpectators])

  // Send chat message
  const handleSendMessage = useCallback(
    async (message: string) => {
      if (!token || !tableId) return

      try {
        const response = await fetch(`/api/tables/${tableId}/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ message }),
        })

        if (!response.ok) {
          throw new Error("Failed to send message")
        }

        const data = await response.json()
        setChatMessages((prev) => [...prev, data.message])
      } catch (error) {
        console.error("Error sending message:", error)
        toast({
          title: "Error",
          description: "Failed to send message",
          variant: "destructive",
        })
      }
    },
    [token, tableId],
  )

  // Toggle spectate mode
  const handleToggleSpectate = useCallback(async () => {
    if (!token || !tableId) return

    try {
      const action = isSpectating ? "stop" : "start"

      const response = await fetch(`/api/tables/${tableId}/spectate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action }),
      })

      if (!response.ok) {
        throw new Error(`Failed to ${action} spectating`)
      }

      const data = await response.json()
      setIsSpectating(data.isSpectating)

      // Refresh spectators list
      fetchSpectators()

      toast({
        title: isSpectating ? "Stopped spectating" : "Now spectating",
        description: isSpectating ? "You are no longer spectating this table" : "You are now spectating this table",
      })
    } catch (error) {
      console.error("Error toggling spectate mode:", error)
      toast({
        title: "Error",
        description: "Failed to update spectator status",
        variant: "destructive",
      })
    }
  }, [token, tableId, isSpectating, fetchSpectators])

  // Update user preferences
  const handleUpdatePreferences = useCallback((newPrefs: Partial<typeof DEFAULT_PREFERENCES>) => {
    setUserPreferences((prev) => {
      const updated = { ...prev, ...newPrefs }
      saveUserPreferences(updated)
      return updated
    })
  }, [])

  // Check if the current user is already at the table
  const isPlayerAtTable = useMemo(() => {
    if (!gameState || !user) return false
    return gameState.players.some((p) => p.id === user.id)
  }, [gameState, user])

  // Handle joining the table
  const handleJoinTable = useCallback(
    async (buyIn: number) => {
      if (!token || !tableId || joining) return

      setJoining(true)
      setLoadingMessage("Joining table...")

      try {
        await joinTable(token, tableId, buyIn)
        toast({
          title: "Success",
          description: "You've joined the table",
        })
      } catch (error) {
        console.error("Error joining table:", error)
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to join table",
          variant: "destructive",
        })
      } finally {
        setJoining(false)
      }
    },
    [token, tableId, joining],
  )

  // Handle leaving the table
  const handleLeaveTable = useCallback(async () => {
    if (!token || !tableId || leaving) return

    setLeaving(true)

    try {
      await leaveTable(token)
      toast({
        title: "Success",
        description: "You've left the table",
      })

      // Redirect to lobby after leaving
      router.push("/lobby")
    } catch (error) {
      console.error("Error leaving table:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to leave table",
        variant: "destructive",
      })
      setLeaving(false)
    }
  }, [token, tableId, leaving, router])

  // Handle player actions (fold, check, call, bet, raise, all-in)
  const handlePlayerAction = useCallback(
    async (action: PlayerAction, amount?: number) => {
      // If confirmation is enabled, set pending action
      if (userPreferences.confirmActions && action !== "check") {
        setPendingAction({ action, amount })
        return
      }

      // Otherwise, execute action immediately
      executePlayerAction(action, amount)
    },
    [userPreferences.confirmActions],
  )

  // Execute player action after confirmation (if needed)
  const executePlayerAction = useCallback(
    async (action: PlayerAction, amount?: number) => {
      if (!token) return

      try {
        await sendPlayerAction(token, action, amount)
      } catch (error) {
        console.error("Error sending player action:", error)
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to perform action",
          variant: "destructive",
        })
      }
    },
    [token],
  )

  // Handle action confirmation
  const handleConfirmAction = useCallback(() => {
    if (!pendingAction) return

    executePlayerAction(pendingAction.action, pendingAction.amount)
    setPendingAction(null)
  }, [pendingAction, executePlayerAction])

  // Handle action cancellation
  const handleCancelAction = useCallback(() => {
    setPendingAction(null)
  }, [])

  // Toggle sound
  const handleToggleSound = useCallback(() => {
    handleUpdatePreferences({ soundEnabled: !userPreferences.soundEnabled })
    toggleMute()
  }, [userPreferences.soundEnabled, handleUpdatePreferences])

  // Show loading states
  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Loader2 className="w-12 h-12 animate-spin text-blue-500 mb-4" />
        <p className="text-lg">Authenticating...</p>
      </div>
    )
  }

  if (!token) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Card className="p-6 max-w-md w-full text-center">
          <h1 className="text-xl font-bold mb-4">Authentication Required</h1>
          <p className="mb-4">Please log in to access this poker table.</p>
          <Button onClick={() => router.push("/")}>Go to Login</Button>
        </Card>
      </div>
    )
  }

  if (loading || joining) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Loader2 className="w-12 h-12 animate-spin text-blue-500 mb-4" />
        <p className="text-lg">{loadingMessage}</p>
      </div>
    )
  }

  return (
    <div className="container max-w-7xl mx-auto p-4 pb-20">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{tableInfo?.name || "Poker Table"}</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Blinds: {tableInfo?.smallBlind || 0}/{tableInfo?.bigBlind || 0}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <UserSettings settings={userPreferences} onUpdateSettings={handleUpdatePreferences} />
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleLeaveTable()}
            disabled={leaving}
            className="flex items-center"
          >
            {leaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CornerLeftUp className="h-4 w-4 mr-2" />}
            Leave Table
          </Button>
        </div>
      </div>

      {gameState ? (
        <EnhancedPokerTable
          gameState={gameState}
          currentPlayerId={user?.id || 0}
          onAction={handlePlayerAction}
          soundEnabled={userPreferences.soundEnabled}
          onToggleSound={handleToggleSound}
        />
      ) : (
        <div className="w-full h-[600px] bg-gray-200 dark:bg-gray-800 rounded-lg flex items-center justify-center">
          <p>Could not load game state</p>
        </div>
      )}

      {/* Join table UI for users not yet at the table */}
      {!isPlayerAtTable && tableInfo && (
        <Card className="mt-6 p-6">
          <h2 className="text-xl font-bold mb-4">Join This Table</h2>
          <p className="mb-4">
            Buy-in range: {tableInfo.minBuyIn} - {tableInfo.maxBuyIn} chips
          </p>
          <div className="flex flex-wrap gap-4">
            <Button
              onClick={() => handleJoinTable(tableInfo.minBuyIn)}
              disabled={joining || user?.balance < tableInfo.minBuyIn}
            >
              Min Buy-in ({tableInfo.minBuyIn})
            </Button>
            <Button
              onClick={() => handleJoinTable(Math.min(user?.balance || 0, tableInfo.maxBuyIn))}
              disabled={joining || user?.balance < tableInfo.minBuyIn}
            >
              Max Buy-in ({Math.min(user?.balance || 0, tableInfo.maxBuyIn)})
            </Button>
          </div>
          {user?.balance < tableInfo.minBuyIn && (
            <p className="text-red-500 mt-2">You don't have enough chips. Minimum buy-in is {tableInfo.minBuyIn}.</p>
          )}
        </Card>
      )}

      {/* Action confirmation dialog */}
      <ActionConfirmation
        action={pendingAction?.action || null}
        amount={pendingAction?.amount}
        onConfirm={handleConfirmAction}
        onCancel={handleCancelAction}
      />

      {/* Chat component */}
      {userPreferences.chatEnabled && (
        <TableChat tableId={tableId} onSendMessage={handleSendMessage} messages={chatMessages} />
      )}

      {/* Hand history component */}
      {userPreferences.showHandHistory && <HandHistory hands={handHistory} />}

      {/* Spectator mode component */}
      {userPreferences.showSpectators && (
        <SpectatorMode
          tableId={tableId}
          spectators={spectators}
          isSpectating={isSpectating}
          onToggleSpectate={handleToggleSpectate}
        />
      )}
    </div>
  )
}

