import type { TelegramUser } from "./telegram"

export interface GameResult {
  id: string
  date: string
  gameType: string
  result: "win" | "loss" | "draw"
  position?: number
  amountWon?: number
  amountLost?: number
  tableId: string
  tableName: string
}

export interface UserStatistics {
  handsPlayed: number
  gamesPlayed: number
  gamesWon: number
  totalWinnings: number
  biggestWin: number
  currentStreak: number
  winRate: number
  level: number
  experience: number
}

export interface UserSettings {
  theme: "light" | "dark" | "system"
  notifications: boolean
  soundEffects: boolean
  inGameName?: string
  email?: string
}

export interface UserProfile {
  id: number
  telegramId: number
  telegramData: TelegramUser
  balance: number
  tonBalance?: number
  inGameName?: string
  settings: UserSettings
  statistics: UserStatistics
  gameHistory: GameResult[]
  createdAt: string
  updatedAt: string
}

