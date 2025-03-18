"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import type { GameState, PlayerAction, PlayerState, Card as CardType } from "@/types/poker"
import { PlayerSeat } from "./player-seat"
import { CommunityCards } from "./community-cards"
import { Pot } from "./pot"
import { BettingControls } from "./betting-controls"
import { Timer } from "./timer"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"
import { AlertCircle, Volume2, VolumeX } from "lucide-react"
import { playActionSound, playCardSound, playChipSound, playResultSound } from "@/lib/sounds"
import {
  animateCardDeal,
  animateChipsToPot,
  animatePlayerTurn,
  stopPlayerTurnAnimation,
  animateWinningHand,
} from "@/lib/animations"

interface EnhancedPokerTableProps {
  gameState: GameState
  currentPlayerId: number
  onAction: (action: PlayerAction, amount?: number) => void
  soundEnabled: boolean
  onToggleSound: () => void
  className?: string
}

export function EnhancedPokerTable({
  gameState,
  currentPlayerId,
  onAction,
  soundEnabled,
  onToggleSound,
  className,
}: EnhancedPokerTableProps) {
  const [betLimits, setBetLimits] = useState({ min: 0, max: 0 })
  const [isActionInProgress, setIsActionInProgress] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState("connected")
  const [previousCommunityCards, setPreviousCommunityCards] = useState<CardType[]>([])
  const [previousPlayers, setPreviousPlayers] = useState<PlayerState[]>([])

  // Refs for animations
  const tableRef = useRef<HTMLDivElement>(null)
  const playerRefs = useRef<Map<number, HTMLDivElement>>(new Map())
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const potRef = useRef<HTMLDivElement>(null)

  // Get the current player
  const currentPlayer = gameState.players.find((p) => p.id === currentPlayerId)

  // Determine if the current player can act
  const isPlayerTurn = currentPlayer?.isTurn || false

  // Determine available actions
  const { canCheck, canCall, canBet, canRaise, callAmount } = (() => {
    const canCheck = isPlayerTurn && currentPlayer?.bet === gameState.currentBet
    const canCall = isPlayerTurn && currentPlayer && currentPlayer.bet < gameState.currentBet && currentPlayer.chips > 0
    const canBet = isPlayerTurn && gameState.currentBet === 0 && currentPlayer && currentPlayer.chips > 0
    const canRaise = isPlayerTurn && gameState.currentBet > 0 && currentPlayer && currentPlayer.chips > 0
    const callAmount = currentPlayer ? gameState.currentBet - currentPlayer.bet : 0

    return { canCheck, canCall, canBet, canRaise, callAmount }
  })()

  // Update bet limits when it's the player's turn
  useEffect(() => {
    if (isPlayerTurn && (canBet || canRaise) && currentPlayer) {
      // For a more advanced implementation, we could fetch the bet limits from the server
      // This is a simple client-side calculation
      const min = canBet ? gameState.tableSettings.bigBlind : gameState.currentBet + gameState.minRaise
      const max = currentPlayer.chips
      setBetLimits({ min, max })
    }
  }, [isPlayerTurn, canBet, canRaise, gameState, currentPlayer])

  // Handle player turn animations
  useEffect(() => {
    // Clear previous animations
    gameState.players.forEach((player) => {
      const playerElement = playerRefs.current.get(player.id)
      if (playerElement) {
        stopPlayerTurnAnimation(playerElement)
      }
    })

    // Animate current player's turn
    const activePlayer = gameState.players.find((p) => p.isTurn)
    if (activePlayer) {
      const playerElement = playerRefs.current.get(activePlayer.id)
      if (playerElement) {
        animatePlayerTurn(playerElement)
      }
    }
  }, [gameState.players])

  // Handle community card animations
  useEffect(() => {
    if (previousCommunityCards.length < gameState.communityCards.length && soundEnabled) {
      // New cards were dealt
      const newCards = gameState.communityCards.slice(previousCommunityCards.length)

      // Play card sound
      playCardSound("flip")

      // Animate new cards
      newCards.forEach((card, index) => {
        const cardKey = `${card.suit}-${card.rank}`
        const cardElement = cardRefs.current.get(cardKey)
        if (cardElement && tableRef.current) {
          const delay = index * 0.3
          animateCardDeal(cardElement, delay, 0, 0)
        }
      })
    }

    setPreviousCommunityCards(gameState.communityCards)
  }, [gameState.communityCards, previousCommunityCards.length, soundEnabled])

  // Handle player bet animations
  useEffect(() => {
    if (previousPlayers.length > 0) {
      gameState.players.forEach((player) => {
        const prevPlayer = previousPlayers.find((p) => p.id === player.id)

        if (prevPlayer && prevPlayer.bet < player.bet && soundEnabled) {
          // Player placed a new bet
          playChipSound("bet")

          // Animate chips to pot
          const playerElement = playerRefs.current.get(player.id)
          const potElement = potRef.current

          if (playerElement && potElement && tableRef.current) {
            // Create a temporary chip element for animation
            const chipElement = document.createElement("div")
            chipElement.className = "absolute w-10 h-10 rounded-full bg-red-500 z-50"
            tableRef.current.appendChild(chipElement)

            // Get positions
            const playerRect = playerElement.getBoundingClientRect()
            const potRect = potElement.getBoundingClientRect()
            const tableRect = tableRef.current.getBoundingClientRect()

            // Calculate relative positions
            const startX = playerRect.left - tableRect.left + playerRect.width / 2
            const startY = playerRect.top - tableRect.top + playerRect.height / 2

            // Animate
            animateChipsToPot(chipElement, startX, startY, 0)

            // Clean up after animation
            setTimeout(() => {
              if (tableRef.current?.contains(chipElement)) {
                tableRef.current.removeChild(chipElement)
              }
            }, 1000)
          }
        }
      })
    }

    setPreviousPlayers(gameState.players)
  }, [gameState.players, previousPlayers, soundEnabled])

  // Handle winner animations
  useEffect(() => {
    if (gameState.winners && gameState.winners.length > 0 && soundEnabled) {
      // Play win sound
      const isCurrentPlayerWinner = gameState.winners.some((winner) => winner.playerId === currentPlayerId)
      playResultSound(isCurrentPlayerWinner)

      // Animate winning hands
      gameState.winners.forEach((winner) => {
        const playerElement = playerRefs.current.get(winner.playerId)
        if (playerElement) {
          animateWinningHand(playerElement)
        }
      })
    }
  }, [gameState.winners, currentPlayerId, soundEnabled])

  // Handle actions with protection against double-clicking
  const handleAction = useCallback(
    (action: PlayerAction, amount?: number) => {
      if (isActionInProgress) return
      if (connectionStatus !== "connected") {
        toast({
          title: "Connection Error",
          description: "No connection to the server. Please wait for the connection to be restored.",
          variant: "destructive",
        })
        return
      }

      setIsActionInProgress(true)

      try {
        // Play sound for the action
        if (soundEnabled) {
          playActionSound(action)
        }

        onAction(action, amount)

        // Show notification about the action
        const actionMessages = {
          fold: "You folded your hand",
          check: "You checked",
          call: `You called ${callAmount}`,
          bet: `You bet ${amount}`,
          raise: `You raised to ${amount}`,
          "all-in": "You went all-in!",
        }

        toast({
          title: "Action taken",
          description: actionMessages[action] || "Action taken",
        })
      } catch (error) {
        console.error("Error performing action:", error)
        toast({
          title: "Error",
          description: "Failed to perform action",
          variant: "destructive",
        })
      } finally {
        // Reset the flag after a short delay
        setTimeout(() => {
          setIsActionInProgress(false)
        }, 1000)
      }
    },
    [isActionInProgress, onAction, callAmount, connectionStatus, soundEnabled],
  )

  // Register player element refs
  const registerPlayerRef = useCallback((id: number, element: HTMLDivElement | null) => {
    if (element) {
      playerRefs.current.set(id, element)
    } else {
      playerRefs.current.delete(id)
    }
  }, [])

  // Register card element refs
  const registerCardRef = useCallback((card: CardType, element: HTMLDivElement | null) => {
    const key = `${card.suit}-${card.rank}`
    if (element) {
      cardRefs.current.set(key, element)
    } else {
      cardRefs.current.delete(key)
    }
  }, [])

  // Arrange players in a circle
  const arrangedPlayers = (() => {
    // Find the current player's index
    const currentPlayerIndex = gameState.players.findIndex((p) => p.id === currentPlayerId)

    if (currentPlayerIndex === -1) {
      return gameState.players
    }

    // Arrange players so that the current player is at the bottom
    return [...gameState.players.slice(currentPlayerIndex), ...gameState.players.slice(0, currentPlayerIndex)]
  })()

  // Position players around the table
  const getPlayerPosition = (index: number, totalPlayers: number) => {
    // Calculate positions in a circle
    const positions = {
      1: ["bottom"],
      2: ["bottom", "top"],
      3: ["bottom", "top-left", "top-right"],
      4: ["bottom", "left", "top", "right"],
      5: ["bottom", "bottom-left", "top-left", "top-right", "bottom-right"],
      6: ["bottom", "bottom-left", "top-left", "top", "top-right", "bottom-right"],
      7: ["bottom", "bottom-left", "left", "top-left", "top-right", "right", "bottom-right"],
      8: ["bottom", "bottom-left", "left", "top-left", "top", "top-right", "right", "bottom-right"],
      9: [
        "bottom",
        "bottom-left",
        "left",
        "top-left",
        "top",
        "top-right",
        "right",
        "bottom-right",
        "bottom-center-right",
      ],
    }

    const positionClasses = {
      bottom: "self-center mb-4",
      "bottom-center-right": "self-end mr-20 mb-4",
      "bottom-left": "self-start ml-4 mb-16",
      "bottom-right": "self-end mr-4 mb-16",
      left: "self-start ml-4",
      right: "self-end mr-4",
      top: "self-center mt-4",
      "top-left": "self-start ml-4 mt-16",
      "top-right": "self-end mr-4 mt-16",
    }

    const positionList = positions[Math.min(totalPlayers, 9) as keyof typeof positions]
    const position = positionList[index % positionList.length]

    return positionClasses[position as keyof typeof positionClasses]
  }

  return (
    <div
      ref={tableRef}
      className={cn(
        "relative w-full max-w-4xl h-[600px] mx-auto bg-green-700 dark:bg-green-900 rounded-full p-4",
        "flex flex-col items-center justify-center border-8 border-green-800 dark:border-green-950",
        "shadow-xl",
        className,
      )}
    >
      {/* Sound toggle button */}
      <button
        className="absolute top-2 left-2 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
        onClick={onToggleSound}
      >
        {soundEnabled ? <Volume2 className="h-4 w-4 text-white" /> : <VolumeX className="h-4 w-4 text-white" />}
      </button>

      {/* Connection status indicator */}
      {connectionStatus !== "connected" && (
        <div className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-full text-xs flex items-center">
          <AlertCircle className="w-3 h-3 mr-1" />
          {connectionStatus === "connecting" ? "Connecting..." : "No connection"}
        </div>
      )}

      {/* Game stage and info */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-4 py-1 rounded-full text-sm">
        {gameState.stage === "waiting"
          ? "Waiting for players"
          : gameState.stage === "pre-flop"
            ? "Pre-flop"
            : gameState.stage === "flop"
              ? "Flop"
              : gameState.stage === "turn"
                ? "Turn"
                : gameState.stage === "river"
                  ? "River"
                  : gameState.stage === "showdown"
                    ? "Showdown"
                    : gameState.stage}
      </div>

      {/* Players */}
      <div className="absolute inset-0 flex flex-col">
        {arrangedPlayers.map((player, i) => (
          <PlayerSeat
            key={player.id}
            player={player}
            isCurrentPlayer={player.id === currentPlayerId}
            className={getPlayerPosition(i, arrangedPlayers.length)}
            ref={(el) => registerPlayerRef(player.id, el)}
          />
        ))}
      </div>

      {/* Center of the table */}
      <div className="flex flex-col items-center space-y-6 z-10">
        <CommunityCards cards={gameState.communityCards} registerCardRef={registerCardRef} />
        <Pot amount={gameState.pot} ref={potRef} />
      </div>

      {/* Winners */}
      {gameState.winners && gameState.winners.length > 0 && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/80 text-white p-4 rounded-lg z-20">
          <h3 className="text-lg font-bold mb-2">Winner{gameState.winners.length > 1 ? "s" : ""}</h3>
          <div className="space-y-2">
            {gameState.winners.map((winner) => {
              const player = gameState.players.find((p) => p.id === winner.playerId)
              return (
                <div key={winner.playerId} className="flex items-center justify-between">
                  <span>{player?.name}</span>
                  <span className="font-bold text-green-400">+{winner.amount} chips</span>
                </div>
              )
            })}
          </div>
          <div className="mt-4 text-sm text-center">Next hand starting soon...</div>
        </div>
      )}

      {/* Last action */}
      {gameState.lastAction && (
        <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded text-sm">
          {gameState.players.find((p) => p.id === gameState.lastAction?.playerId)?.name}{" "}
          {gameState.lastAction.action === "fold"
            ? "folded"
            : gameState.lastAction.action === "check"
              ? "checked"
              : gameState.lastAction.action === "call"
                ? "called"
                : gameState.lastAction.action === "bet"
                  ? "bet"
                  : gameState.lastAction.action === "raise"
                    ? "raised to"
                    : gameState.lastAction.action === "all-in"
                      ? "went all-in"
                      : gameState.lastAction.action}
          {gameState.lastAction.amount ? ` ${gameState.lastAction.amount}` : ""}
        </div>
      )}

      {/* Betting controls */}
      {isPlayerTurn && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-full max-w-md px-4">
          <div className="mb-2">
            <Timer seconds={gameState.timeLeft} onTimeout={() => handleAction("fold")} />
          </div>
          <BettingControls
            canCheck={canCheck}
            canCall={canCall}
            canBet={canBet}
            canRaise={canRaise}
            callAmount={callAmount}
            minBet={betLimits.min}
            maxBet={betLimits.max}
            onAction={handleAction}
            disabled={isActionInProgress || connectionStatus !== "connected"}
          />
        </div>
      )}
    </div>
  )
}

