export interface TournamentSettings {
  name: string
  description?: string
  startTime: Date
  registrationStartTime: Date
  registrationEndTime: Date
  buyIn: number
  entryFee: number
  startingChips: number
  maxPlayers: number
  minPlayers: number
  blindLevels: BlindLevel[]
  payoutStructure: PayoutStructure[]
  lateRegistrationPeriod?: number // в минутах
  rebuyOption?: RebuyOption
  addOnOption?: AddOnOption
  tableSize: number
  isPrivate: boolean
  password?: string
  status: TournamentStatus
}

export interface Tournament extends TournamentSettings {
  id: string
  createdAt: Date
  updatedAt: Date
  players: TournamentPlayer[]
  tables: string[] // ID столов
  currentLevel: number
  nextLevelTime?: Date
  prizes: TournamentPrize[]
  winnerId?: number
  isFinished: boolean
}

export interface TournamentPlayer {
  userId: number
  username: string
  avatarUrl?: string
  chips: number
  tableId?: string
  position?: number
  status: PlayerTournamentStatus
  registeredAt: Date
  eliminatedAt?: Date
  finalPosition?: number
  rebuyCount: number
  addOnCount: number
}

export interface BlindLevel {
  level: number
  smallBlind: number
  bigBlind: number
  ante: number
  duration: number // в минутах
}

export interface PayoutStructure {
  position: number
  percentage: number
}

export interface TournamentPrize {
  position: number
  userId?: number
  amount: number
  isPaid: boolean
}

export interface RebuyOption {
  price: number
  chips: number
  maxRebuys: number
  availableUntilLevel: number
}

export interface AddOnOption {
  price: number
  chips: number
  availableAtBreak: boolean
  availableUntilLevel: number
}

export enum TournamentStatus {
  SCHEDULED = "SCHEDULED",
  REGISTRATION_OPEN = "REGISTRATION_OPEN",
  REGISTRATION_CLOSED = "REGISTRATION_CLOSED",
  RUNNING = "RUNNING",
  BREAK = "BREAK",
  FINAL_TABLE = "FINAL_TABLE",
  FINISHED = "FINISHED",
  CANCELLED = "CANCELLED",
}

export enum PlayerTournamentStatus {
  REGISTERED = "REGISTERED",
  PLAYING = "PLAYING",
  AWAY = "AWAY",
  ELIMINATED = "ELIMINATED",
  WINNER = "WINNER",
}

export interface TournamentAction {
  type: "register" | "unregister" | "rebuy" | "addon" | "start" | "cancel" | "pause" | "resume"
  tournamentId: string
  userId?: number
  amount?: number
}

export interface TournamentState {
  tournament: Tournament
  currentLevel: BlindLevel
  timeToNextLevel: number
  registeredPlayers: number
  activePlayers: number
  eliminatedPlayers: number
  prizePool: number
  isRegistrationOpen: boolean
  canRebuy: boolean
  canAddOn: boolean
}

