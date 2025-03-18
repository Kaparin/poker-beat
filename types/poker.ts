export type Suit = "hearts" | "diamonds" | "clubs" | "spades"
export type Rank = "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K" | "A"

export interface Card {
  suit: Suit
  rank: Rank
  faceDown?: boolean
}

export type HandRank =
  | "high-card"
  | "pair"
  | "two-pair"
  | "three-of-a-kind"
  | "straight"
  | "flush"
  | "full-house"
  | "four-of-a-kind"
  | "straight-flush"
  | "royal-flush"

export interface HandResult {
  rank: HandRank
  cards: Card[]
  value: number
  description: string
}

export type PlayerAction = "fold" | "check" | "call" | "bet" | "raise" | "all-in"

export type GameStage = "waiting" | "pre-flop" | "flop" | "turn" | "river" | "showdown"

export interface PlayerState {
  id: number
  name: string
  avatarUrl?: string
  chips: number
  bet: number
  folded: boolean
  cards: Card[]
  isAllIn: boolean
  isDealer: boolean
  isSmallBlind: boolean
  isBigBlind: boolean
  isActive: boolean
  isTurn: boolean
  handResult?: HandResult
  seatIndex: number
}

export interface TableSettings {
  id: string
  name: string
  maxPlayers: number
  smallBlind: number
  bigBlind: number
  minBuyIn: number
  maxBuyIn: number
}

export interface GameState {
  tableId: string
  tableSettings: TableSettings
  players: PlayerState[]
  communityCards: Card[]
  deck: Card[]
  pot: number
  sidePots: { amount: number; eligiblePlayers: number[] }[]
  currentBet: number
  stage: GameStage
  activePlayerIndex: number
  dealerIndex: number
  lastRaiseIndex: number
  minRaise: number
  timeLeft: number
  winners?: { playerId: number; amount: number; handResult: HandResult }[]
  lastAction?: { playerId: number; action: PlayerAction; amount?: number }
}

export interface TableInfo {
  id: string
  name: string
  maxPlayers: number
  smallBlind: number
  bigBlind: number
  minBuyIn: number
  maxBuyIn: number
  players: { id: number; name: string; chips: number }[]
  activePlayers: number
  status: "waiting" | "playing" | "full"
}

