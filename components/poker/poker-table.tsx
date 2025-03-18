"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import type { GameState, PlayerAction } from "@/types/poker"
import { PlayerSeat } from "./player-seat"
import { CommunityCards } from "./community-cards"
import { Pot } from "./pot"
import { BettingControls } from "./betting-controls"
import { Timer } from "./timer"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"
import { getBetLimits } from "@/lib/socket-client"
import { AlertCircle } from 'lucide-react'

interface PokerTableProps {
  gameState: GameState
  currentPlayerId: number
  onAction: (action: PlayerAction, amount?: number) => void
  className?: string
}

export function PokerTable({ gameState, currentPlayerId, onAction, className }: PokerTableProps) {
  const [betLimits, setBetLimits] = useState({ min: 0, max: 0 })
  const [isActionInProgress, setIsActionInProgress] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState("connected")

  // Get the current player
  const currentPlayer = useMemo(
    () => gameState.players.find((p) => p.id === currentPlayerId),
    [gameState.players, currentPlayerId]
  )

  // Determine if the current player can act
  const isPlayerTurn = useMemo(() => currentPlayer?.isTurn || false, [currentPlayer])

  // Determine available actions
  const { canCheck, canCall, canBet, canRaise, callAmount } = useMemo(() => {
    const canCheck = isPlayerTurn && currentPlayer?.bet === gameState.currentBet
    const canCall = isPlayerTurn && currentPlayer && currentPlayer.bet < gameState.currentBet && currentPlayer.chips > 0
    const canBet = isPlayerTurn && gameState.currentBet === 0 && currentPlayer && currentPlayer.chips > 0
    const canRaise = isPlayerTurn && gameState.currentBet > 0 && currentPlayer && currentPlayer.chips > 0
    const callAmount = currentPlayer ? gameState.currentBet - currentPlayer.bet : 0

    return { canCheck, canCall, canBet, canRaise, callAmount }
  }, [isPlayerTurn, currentPlayer, gameState.currentBet])

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
    [isActionInProgress, onAction, callAmount, connectionStatus]
  )

  // Arrange players in a circle
  const arrangedPlayers = useMemo(() => {
    // Find the current player's index
    const currentPlayerIndex = gameState.players.findIndex((p) => p.id === currentPlayerId)

    if (currentPlayerIndex === -1) {
      return gameState.players
    }

    // Arrange players so that the current player is at the bottom
    return [...gameState.players.slice(currentPlayerIndex), ...gameState.players.slice(0, currentPlayerIndex)]
  }, [gameState.players, currentPlayerId])

  // Position players around the table
  const getPlayerPosition = useCallback((index: number, totalPlayers: number) => {
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
  }, [])

  return (
    <div
      className={cn(
        "relative w-full max-w-4xl h-[600px] mx-auto bg-green-700 dark:bg-green-900 rounded-full p-4",
        "flex flex-col items-center justify-center border-8 border-green-800 dark:border-green-950",
        "shadow-xl",
        className
      )}
    >
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
          />
        ))}
      </div>

      {/* Center of the table */}
      <div className="flex flex-col items-center space-y-6 z-10">
        <CommunityCards cards={gameState.communityCards} />
        <Pot amount={gameState.pot} />
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

