import type { GameState, GameStage, PlayerAction, PlayerState, TableSettings } from "@/types/poker"
import { createDeck, dealCards, shuffleDeck } from "./deck"
import { determineWinners, findBestHand } from "./hand-evaluator"

// Initialize a new game state
export function initializeGameState(tableSettings: TableSettings): GameState {
  return {
    tableId: tableSettings.id,
    tableSettings,
    players: [],
    communityCards: [],
    deck: [],
    pot: 0,
    sidePots: [],
    currentBet: 0,
    stage: "waiting",
    activePlayerIndex: -1,
    dealerIndex: -1,
    lastRaiseIndex: -1,
    minRaise: tableSettings.bigBlind,
    timeLeft: 0,
  }
}

// Add a player to the game
export function addPlayer(
  state: GameState,
  playerId: number,
  playerName: string,
  avatarUrl: string | undefined,
  buyIn: number,
): GameState {
  // Find an empty seat
  const availableSeats = Array.from({ length: state.tableSettings.maxPlayers }, (_, i) => i).filter(
    (seatIndex) => !state.players.some((p) => p.seatIndex === seatIndex),
  )

  if (availableSeats.length === 0) {
    throw new Error("No available seats")
  }

  const seatIndex = availableSeats[0]

  // Create a new player
  const newPlayer: PlayerState = {
    id: playerId,
    name: playerName,
    avatarUrl,
    chips: buyIn,
    bet: 0,
    folded: false,
    cards: [],
    isAllIn: false,
    isDealer: false,
    isSmallBlind: false,
    isBigBlind: false,
    isActive: true,
    isTurn: false,
    seatIndex,
  }

  // Add the player to the game
  return {
    ...state,
    players: [...state.players, newPlayer],
  }
}

// Remove a player from the game
export function removePlayer(state: GameState, playerId: number): GameState {
  const playerIndex = state.players.findIndex((p) => p.id === playerId)

  if (playerIndex === -1) {
    return state
  }

  // Create a new array without the player
  const newPlayers = state.players.filter((p) => p.id !== playerId)

  // If the game is in progress and the player was active, handle their departure
  if (state.stage !== "waiting" && state.players[playerIndex].isActive) {
    // If it was their turn, move to the next player
    if (state.players[playerIndex].isTurn) {
      return advanceTurn({
        ...state,
        players: newPlayers,
      })
    }

    // If they were the dealer, adjust the dealer position
    if (state.players[playerIndex].isDealer && newPlayers.length > 0) {
      const newDealerIndex = findNextActivePlayerIndex({ ...state, players: newPlayers }, state.dealerIndex)

      if (newDealerIndex !== -1) {
        newPlayers[newDealerIndex].isDealer = true
      }
    }
  }

  return {
    ...state,
    players: newPlayers,
  }
}

// Start a new hand
export function startNewHand(state: GameState): GameState {
  if (state.players.length < 2) {
    throw new Error("Need at least 2 players to start a hand")
  }

  // Reset game state
  let newState = {
    ...state,
    communityCards: [],
    pot: 0,
    sidePots: [],
    currentBet: 0,
    stage: "pre-flop" as GameStage,
    lastRaiseIndex: -1,
    minRaise: state.tableSettings.bigBlind,
    timeLeft: 30, // 30 seconds per turn
    winners: undefined,
    lastAction: undefined,
  }

  // Reset player states
  newState.players = state.players.map((player) => ({
    ...player,
    bet: 0,
    folded: false,
    cards: [],
    isAllIn: false,
    isDealer: false,
    isSmallBlind: false,
    isBigBlind: false,
    isTurn: false,
    handResult: undefined,
  }))

  // Set dealer position
  if (state.dealerIndex === -1) {
    // First hand, randomly select dealer
    newState.dealerIndex = Math.floor(Math.random() * newState.players.length)
  } else {
    // Move dealer button to the next player
    newState.dealerIndex = findNextActivePlayerIndex(newState, state.dealerIndex)
  }

  newState.players[newState.dealerIndex].isDealer = true

  // Дополнительная обработка для heads-up (2 игрока)
  if (newState.players.filter((p) => p.isActive).length === 2) {
    // В heads-up дилер всегда должен быть SB, а второй игрок - BB
    const dealerPlayer = newState.players[newState.dealerIndex]
    const otherPlayerIndex = newState.players.findIndex((p) => p.isActive && p.id !== dealerPlayer.id)

    // Устанавливаем блайнды для heads-up
    newState.players[newState.dealerIndex].isSmallBlind = true
    newState.players[otherPlayerIndex].isBigBlind = true

    // Ставим блайнды
    newState = placeBet(newState, newState.dealerIndex, state.tableSettings.smallBlind)
    newState = placeBet(newState, otherPlayerIndex, state.tableSettings.bigBlind)

    // В префлопе первым ходит SB (дилер)
    const firstToActIndex = newState.dealerIndex
    newState.activePlayerIndex = firstToActIndex
    newState.players[firstToActIndex].isTurn = true
  } else {
    // Стандартная логика для 3+ игроков
    // Существующий код для определения блайндов и первого хода
    const smallBlindIndex = findNextActivePlayerIndex(newState, newState.dealerIndex)
    const bigBlindIndex = findNextActivePlayerIndex(newState, smallBlindIndex)

    newState.players[smallBlindIndex].isSmallBlind = true
    newState.players[bigBlindIndex].isBigBlind = true

    // Post blinds
    newState = placeBet(newState, smallBlindIndex, state.tableSettings.smallBlind)
    newState = placeBet(newState, bigBlindIndex, state.tableSettings.bigBlind)

    // First to act is after the big blind
    const firstToActIndex = findNextActivePlayerIndex(newState, bigBlindIndex)
    newState.activePlayerIndex = firstToActIndex
    newState.players[firstToActIndex].isTurn = true
  }

  // Устанавливаем текущую ставку равной большому блайнду
  newState.currentBet = state.tableSettings.bigBlind

  // Create and shuffle deck
  const { shuffledDeck, seedUsed } = shuffleDeck(createDeck())
  newState.deck = shuffledDeck
  newState.seed = seedUsed // Сохраняем seed для возможной верификации честности

  // Deal cards to players
  for (let i = 0; i < newState.players.length; i++) {
    if (newState.players[i].isActive) {
      const { cards, remainingDeck } = dealCards(newState.deck, 2, true)
      newState.players[i].cards = cards
      newState.deck = remainingDeck
    }
  }

  // Set the active player (after the big blind)
  const bigBlindIndex = newState.players.findIndex((p) => p.isBigBlind)
  const firstToActIndex = findNextActivePlayerIndex(newState, bigBlindIndex)
  newState.activePlayerIndex = firstToActIndex
  newState.players[firstToActIndex].isTurn = true

  return newState
}

// Find the next active player
function findNextActivePlayerIndex(state: GameState, currentIndex: number): number {
  const { players } = state

  for (let i = 1; i <= players.length; i++) {
    const nextIndex = (currentIndex + i) % players.length
    if (players[nextIndex].isActive && !players[nextIndex].folded && !players[nextIndex].isAllIn) {
      return nextIndex
    }
  }

  return -1 // No active players found
}

// Place a bet for a player
export function placeBet(state: GameState, playerIndex: number, amount: number): GameState {
  const player = state.players[playerIndex]

  // Ensure the player has enough chips
  const actualAmount = Math.min(amount, player.chips)

  // Update player state
  const updatedPlayer = {
    ...player,
    chips: player.chips - actualAmount,
    bet: player.bet + actualAmount,
    isAllIn: player.chips - actualAmount === 0,
  }

  // Update players array
  const updatedPlayers = [...state.players]
  updatedPlayers[playerIndex] = updatedPlayer

  // Update pot
  const updatedPot = state.pot + actualAmount

  return {
    ...state,
    players: updatedPlayers,
    pot: updatedPot,
    currentBet: Math.max(state.currentBet, updatedPlayer.bet),
  }
}

// Handle player action
export function handlePlayerAction(
  state: GameState,
  playerId: number,
  action: PlayerAction,
  betAmount?: number,
): GameState {
  const playerIndex = state.players.findIndex((p) => p.id === playerId)

  if (playerIndex === -1 || playerIndex !== state.activePlayerIndex) {
    throw new Error("Not your turn")
  }

  const player = state.players[playerIndex]
  let newState = { ...state }

  // Record the action
  newState.lastAction = {
    playerId,
    action,
    amount: betAmount,
  }

  switch (action) {
    case "fold":
      // Player folds
      newState.players = newState.players.map((p, i) => (i === playerIndex ? { ...p, folded: true, isTurn: false } : p))
      break

    case "check":
      // Player checks (only valid if no bet to call)
      if (state.currentBet > player.bet) {
        throw new Error("Cannot check when there is a bet to call")
      }
      break

    case "call":
      // Player calls the current bet
      const callAmount = state.currentBet - player.bet
      if (callAmount > 0) {
        newState = placeBet(newState, playerIndex, callAmount)
      }
      break

    case "bet":
    case "raise":
      // Player bets or raises
      if (!betAmount || betAmount <= 0) {
        throw new Error("Invalid bet amount")
      }

      const minBetAmount = action === "bet" ? state.tableSettings.bigBlind : state.currentBet + state.minRaise

      if (betAmount < minBetAmount && betAmount < player.chips) {
        throw new Error(`Minimum ${action} is ${minBetAmount}`)
      }

      // Place the bet
      const totalBetAmount = (action === "raise" ? state.currentBet : 0) + betAmount - player.bet
      newState = placeBet(newState, playerIndex, totalBetAmount)

      // Update minimum raise
      newState.minRaise = betAmount
      newState.lastRaiseIndex = playerIndex
      break

    case "all-in":
      // Player goes all-in
      newState = placeBet(newState, playerIndex, player.chips)

      // If this is a raise, update the minimum raise
      if (newState.players[playerIndex].bet > state.currentBet) {
        newState.minRaise = newState.players[playerIndex].bet - state.currentBet
        newState.lastRaiseIndex = playerIndex
      }
      break

    default:
      throw new Error("Invalid action")
  }

  // Move to the next player or stage
  return advanceTurn(newState)
}

// Advance to the next player or stage
function advanceTurn(state: GameState): GameState {
  // Check if the hand is over (only one player left)
  const activePlayers = state.players.filter((p) => !p.folded)

  if (activePlayers.length === 1) {
    // Hand is over, award pot to the remaining player
    return endHand(state)
  }

  // Check if the betting round is complete
  const bettingComplete = isBettingRoundComplete(state)

  if (bettingComplete) {
    // Move to the next stage
    return advanceStage(state)
  }

  // Find the next player to act
  const nextPlayerIndex = findNextActivePlayerIndex(state, state.activePlayerIndex)

  if (nextPlayerIndex === -1) {
    // No more active players, move to the next stage
    return advanceStage(state)
  }

  // Update player turns
  const updatedPlayers = state.players.map((p, i) => ({
    ...p,
    isTurn: i === nextPlayerIndex,
  }))

  return {
    ...state,
    players: updatedPlayers,
    activePlayerIndex: nextPlayerIndex,
    timeLeft: 30, // Reset timer for the next player
  }
}

// Check if the betting round is complete
function isBettingRoundComplete(state: GameState): boolean {
  const { players, currentBet, lastRaiseIndex } = state

  // If there was no raise, check if all active players have acted
  if (lastRaiseIndex === -1) {
    // In pre-flop, we need to make sure everyone after the big blind has acted
    if (state.stage === "pre-flop") {
      const bigBlindIndex = players.findIndex((p) => p.isBigBlind)

      // Check if we've gone around to the big blind
      return state.activePlayerIndex === bigBlindIndex
    }

    // For other stages, check if we've gone around to the dealer
    const dealerIndex = players.findIndex((p) => p.isDealer)
    return state.activePlayerIndex === dealerIndex
  }

  // If there was a raise, check if all active players have had a chance to call or fold
  const activePlayersSinceBet = players.filter((p, i) => {
    // Player is active and not folded
    const isActive = p.isActive && !p.folded

    // Player has acted since the last raise
    const hasActed =
      i === lastRaiseIndex ||
      (i > lastRaiseIndex && i <= state.activePlayerIndex) ||
      (state.activePlayerIndex < lastRaiseIndex && (i > lastRaiseIndex || i <= state.activePlayerIndex))

    return isActive && !hasActed
  })

  // If all active players have acted, or all players are all-in, the betting round is complete
  return activePlayersSinceBet.length === 0 || players.every((p) => p.folded || p.isAllIn)
}

// Advance to the next stage of the hand
function advanceStage(state: GameState): GameState {
  const newState = { ...state }

  // Reset bets for the next round
  newState.players = newState.players.map((p) => ({
    ...p,
    bet: 0,
    isTurn: false,
  }))

  newState.currentBet = 0
  newState.lastRaiseIndex = -1
  newState.minRaise = newState.tableSettings.bigBlind

  // Determine the next stage
  switch (state.stage) {
    case "pre-flop":
      // Deal the flop (3 community cards)
      const flopResult = dealCards(newState.deck, 3)
      newState.communityCards = flopResult.cards
      newState.deck = flopResult.remainingDeck
      newState.stage = "flop"
      break

    case "flop":
      // Deal the turn (1 community card)
      const turnResult = dealCards(newState.deck, 1)
      newState.communityCards = [...newState.communityCards, ...turnResult.cards]
      newState.deck = turnResult.remainingDeck
      newState.stage = "turn"
      break

    case "turn":
      // Deal the river (1 community card)
      const riverResult = dealCards(newState.deck, 1)
      newState.communityCards = [...newState.communityCards, ...riverResult.cards]
      newState.deck = riverResult.remainingDeck
      newState.stage = "river"
      break

    case "river":
      // Move to showdown
      return endHand(newState)

    default:
      throw new Error("Invalid game stage")
  }

  // Set the first active player after the dealer
  const firstToActIndex = findNextActivePlayerIndex(
    newState,
    newState.players.findIndex((p) => p.isDealer),
  )

  if (firstToActIndex !== -1) {
    newState.activePlayerIndex = firstToActIndex
    newState.players[firstToActIndex].isTurn = true
  } else {
    // No active players, end the hand
    return endHand(newState)
  }

  return newState
}

// End the hand and determine the winner(s)
function endHand(state: GameState): GameState {
  // If only one player is left, they win
  const activePlayers = state.players.filter((p) => !p.folded)

  if (activePlayers.length === 1) {
    // Award the pot to the only remaining player
    const winner = activePlayers[0]

    return {
      ...state,
      players: state.players.map((p) =>
        p.id === winner.id ? { ...p, chips: p.chips + state.pot, isTurn: false } : { ...p, isTurn: false },
      ),
      pot: 0,
      stage: "showdown",
      winners: [
        {
          playerId: winner.id,
          amount: state.pot,
          handResult: {
            rank: "high-card",
            cards: [],
            value: 0,
            description: "Last player standing",
          },
        },
      ],
    }
  }

  // Reveal all cards
  const playersWithCards = state.players.map((p) => ({
    ...p,
    cards: p.cards.map((c) => ({ ...c, faceDown: false })),
    isTurn: false,
  }))

  // Evaluate hands for all active players
  const playersWithHands = playersWithCards.map((p) => {
    if (p.folded) return p

    const handResult = findBestHand(p.cards, state.communityCards)
    return { ...p, handResult }
  })

  // Determine the winner(s)
  const eligiblePlayers = playersWithHands
    .filter((p) => !p.folded)
    .map((p) => ({ id: p.id, handResult: p.handResult! }))

  const winnerIds = determineWinners(eligiblePlayers)

  // Award the pot to the winner(s)
  const winAmount = Math.floor(state.pot / winnerIds.length)
  const remainder = state.pot % winnerIds.length

  const winners = winnerIds.map((id, index) => {
    const player = playersWithHands.find((p) => p.id === id)!
    // First winner gets any remainder chips
    const amount = index === 0 ? winAmount + remainder : winAmount

    return {
      playerId: id,
      amount,
      handResult: player.handResult!,
    }
  })

  // Update player chips
  const updatedPlayers = playersWithHands.map((p) => {
    const winner = winners.find((w) => w.playerId === p.id)
    if (winner) {
      return { ...p, chips: p.chips + winner.amount }
    }
    return p
  })

  return {
    ...state,
    players: updatedPlayers,
    pot: 0,
    stage: "showdown",
    winners,
  }
}

// Calculate side pots when players are all-in
export function calculateSidePots(state: GameState): GameState {
  const { players } = state

  // Sort players by their bet amount (lowest to highest)
  const sortedPlayers = [...players].filter((p) => !p.folded).sort((a, b) => a.bet - b.bet)

  if (sortedPlayers.length <= 1) {
    return state
  }

  const sidePots: { amount: number; eligiblePlayers: number[] }[] = []
  let processedBet = 0

  // Calculate side pots
  for (let i = 0; i < sortedPlayers.length; i++) {
    const currentPlayer = sortedPlayers[i]
    const currentBet = currentPlayer.bet

    if (currentBet > processedBet) {
      const contribution = currentBet - processedBet
      const eligiblePlayers = sortedPlayers.slice(i).map((p) => p.id)
      const potAmount = contribution * eligiblePlayers.length

      sidePots.push({
        amount: potAmount,
        eligiblePlayers,
      })

      processedBet = currentBet
    }
  }

  return {
    ...state,
    sidePots,
  }
}

// Get the current game state for a specific player (hiding other players' cards)
export function getPlayerView(state: GameState, playerId: number): GameState {
  // Hide other players' cards
  const playersWithHiddenCards = state.players.map((p) => {
    if (p.id === playerId || state.stage === "showdown") {
      return p
    }

    return {
      ...p,
      cards: p.cards.map((c) => ({ ...c, faceDown: true })),
    }
  })

  return {
    ...state,
    players: playersWithHiddenCards,
    // Hide the deck
    deck: [],
  }
}

// Check if a player can perform a specific action
export function canPlayerAct(state: GameState, playerId: number, action: PlayerAction): boolean {
  const player = state.players.find((p) => p.id === playerId)

  if (!player || player.folded || player.isAllIn || !player.isTurn) {
    return false
  }

  switch (action) {
    case "fold":
      return true

    case "check":
      return player.bet === state.currentBet

    case "call":
      return player.bet < state.currentBet && player.chips > 0

    case "bet":
      return state.currentBet === 0 && player.chips > 0

    case "raise":
      return state.currentBet > 0 && player.chips > state.currentBet - player.bet

    case "all-in":
      return player.chips > 0

    default:
      return false
  }
}

// Get the minimum and maximum bet amounts for a player
export function getBetLimits(state: GameState, playerId: number): { min: number; max: number } {
  const player = state.players.find((p) => p.id === playerId)

  if (!player) {
    return { min: 0, max: 0 }
  }

  const callAmount = state.currentBet - player.bet

  if (state.currentBet === 0) {
    // Bet
    return {
      min: state.tableSettings.bigBlind,
      max: player.chips,
    }
  } else {
    // Raise
    return {
      min: state.currentBet + state.minRaise,
      max: player.chips + player.bet,
    }
  }
}

