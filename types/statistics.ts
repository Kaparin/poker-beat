export interface PlayerStatistics {
  userId: number
  username: string
  avatarUrl?: string
  gamesPlayed: number
  gamesWon: number
  totalWinnings: number
  totalLosses: number
  biggestPot: number
  biggestWin: number
  handsPlayed: number
  handsWon: number
  winPercentage: number
  vpip: number // Voluntarily Put Money In Pot
  pfr: number // Pre-Flop Raise
  af: number // Aggression Factor
  tournamentStats: TournamentStatistics
  rankingPoints: number
  rank: PlayerRank
  achievements: Achievement[]
  lastActive: Date
  createdAt: Date
  updatedAt: Date
}

export interface TournamentStatistics {
  tournamentsPlayed: number
  tournamentsWon: number
  tournamentsInMoney: number
  bestFinish: number
  averageFinish: number
  totalTournamentWinnings: number
}

export interface HandStatistics {
  handId: string
  tableId: string
  tournamentId?: string
  players: HandPlayerStats[]
  communityCards: string[]
  pot: number
  rake: number
  timestamp: Date
}

export interface HandPlayerStats {
  userId: number
  username: string
  position: string // SB, BB, UTG, etc.
  holeCards?: string[]
  actions: PlayerAction[]
  wonAmount: number
  showedCards: boolean
  handRank?: string
}

export interface PlayerAction {
  action: string
  amount?: number
  stage: string
  timestamp: Date
}

export enum PlayerRank {
  BEGINNER = "BEGINNER",
  AMATEUR = "AMATEUR",
  INTERMEDIATE = "INTERMEDIATE",
  ADVANCED = "ADVANCED",
  EXPERT = "EXPERT",
  MASTER = "MASTER",
  GRANDMASTER = "GRANDMASTER",
  LEGEND = "LEGEND",
}

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  unlockedAt: Date
  progress?: number
  maxProgress?: number
}

export interface Leaderboard {
  timeframe: "daily" | "weekly" | "monthly" | "allTime"
  category: "cashGames" | "tournaments" | "overall"
  entries: LeaderboardEntry[]
  lastUpdated: Date
}

export interface LeaderboardEntry {
  position: number
  userId: number
  username: string
  avatarUrl?: string
  value: number
  change?: number
}

