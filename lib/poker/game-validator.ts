import type { GameState, PlayerAction, PlayerState } from "@/types/poker"

// Validate that a player can perform an action
export function validatePlayerAction(
  gameState: GameState,
  playerId: number,
  action: PlayerAction,
  amount?: number,
): { valid: boolean; error?: string } {
  try {
    // Check if the player exists in the game
    const playerIndex = gameState.players.findIndex((p) => p.id === playerId)
    if (playerIndex === -1) {
      return { valid: false, error: "Player not found in the game" }
    }

    const player = gameState.players[playerIndex]

    // Check if it's the player's turn
    if (!player.isTurn) {
      return { valid: false, error: "Not your turn" }
    }

    // Check if the player is active
    if (!player.isActive || player.folded || player.isAllIn) {
      return { valid: false, error: "Player cannot act" }
    }

    // Validate specific actions
    switch (action) {
      case "fold":
        // Anyone can fold
        return { valid: true }

      case "check":
        // Can only check if no bet to call
        if (player.bet < gameState.currentBet) {
          return { valid: false, error: "Cannot check when there is a bet to call" }
        }
        return { valid: true }

      case "call":
        // Can only call if there's a bet to call
        if (player.bet >= gameState.currentBet) {
          return { valid: false, error: "No bet to call" }
        }
        // Check if player has enough chips
        if (player.chips === 0) {
          return { valid: false, error: "No chips to call" }
        }
        return { valid: true }

      case "bet":
        // Can only bet if no current bet
        if (gameState.currentBet > 0) {
          return { valid: false, error: "Cannot bet when there is already a bet" }
        }
        // Check amount
        if (!amount || amount <= 0) {
          return { valid: false, error: "Invalid bet amount" }
        }
        // Check minimum bet
        if (amount < gameState.tableSettings.bigBlind && amount < player.chips) {
          return { valid: false, error: `Minimum bet is ${gameState.tableSettings.bigBlind}` }
        }
        // Check if player has enough chips
        if (amount > player.chips) {
          return { valid: false, error: "Not enough chips" }
        }
        return { valid: true }

      case "raise":
        // Can only raise if there's a bet to raise
        if (gameState.currentBet === 0) {
          return { valid: false, error: "No bet to raise" }
        }
        // Check amount
        if (!amount || amount <= 0) {
          return { valid: false, error: "Invalid raise amount" }
        }
        // Check minimum raise
        const minRaiseAmount = gameState.currentBet + gameState.minRaise
        if (amount < minRaiseAmount && amount < player.chips) {
          return { valid: false, error: `Minimum raise is ${minRaiseAmount}` }
        }
        // Check if player has enough chips
        if (amount > player.chips + player.bet) {
          return { valid: false, error: "Not enough chips" }
        }
        return { valid: true }

      case "all-in":
        // Anyone can go all-in if they have chips
        if (player.chips === 0) {
          return { valid: false, error: "No chips to go all-in" }
        }
        return { valid: true }

      default:
        return { valid: false, error: "Invalid action" }
    }
  } catch (error) {
    console.error("Error validating player action:", error)
    return { valid: false, error: "Error validating action" }
  }
}

// Validate the integrity of the game state
export function validateGameState(gameState: GameState): { valid: boolean; error?: string } {
  try {
    // Check if the game has a valid table ID
    if (!gameState.tableId) {
      return { valid: false, error: "Invalid table ID" }
    }

    // Check if the game has valid table settings
    if (!gameState.tableSettings || !gameState.tableSettings.maxPlayers) {
      return { valid: false, error: "Invalid table settings" }
    }

    // Check if the number of players is valid
    if (gameState.players.length > gameState.tableSettings.maxPlayers) {
      return { valid: false, error: "Too many players" }
    }

    // Check if the active player index is valid
    if (gameState.activePlayerIndex >= 0 && gameState.activePlayerIndex >= gameState.players.length) {
      return { valid: false, error: "Invalid active player index" }
    }

    // Check if the dealer index is valid
    if (gameState.dealerIndex >= 0 && gameState.dealerIndex >= gameState.players.length) {
      return { valid: false, error: "Invalid dealer index" }
    }

    // Check if the pot is valid
    if (gameState.pot < 0) {
      return { valid: false, error: "Invalid pot" }
    }

    // Check if the current bet is valid
    if (gameState.currentBet < 0) {
      return { valid: false, error: "Invalid current bet" }
    }

    // Check if the minimum raise is valid
    if (gameState.minRaise < 0) {
      return { valid: false, error: "Invalid minimum raise" }
    }

    // Check if the community cards are valid
    if (gameState.communityCards.length > 5) {
      return { valid: false, error: "Too many community cards" }
    }

    // Check if each player's state is valid
    for (const player of gameState.players) {
      if (!validatePlayerState(player)) {
        return { valid: false, error: "Invalid player state" }
      }
    }

    return { valid: true }
  } catch (error) {
    console.error("Error validating game state:", error)
    return { valid: false, error: "Error validating game state" }
  }
}

// Validate a player's state
function validatePlayerState(player: PlayerState): boolean {
  try {
    // Check if the player has a valid ID
    if (!player.id) return false

    // Check if the player has a valid name
    if (!player.name) return false

    // Check if the player has valid chips
    if (player.chips < 0) return false

    // Check if the player has a valid bet
    if (player.bet < 0) return false

    // Check if the player has valid cards
    if (player.cards.length > 2) return false

    // Check if the player has a valid seat index
    if (player.seatIndex < 0) return false

    return true
  } catch (error) {
    console.error("Error validating player state:", error)
    return false
  }
}

