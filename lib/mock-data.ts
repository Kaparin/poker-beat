import type { UserProfile } from "@/types/user"

export function generateMockProfile(telegramUser: any): UserProfile {
  return {
    id: 1,
    telegramId: telegramUser.id,
    telegramData: telegramUser,
    balance: 5000,
    tonBalance: 0.5,
    inGameName: telegramUser.username || `${telegramUser.first_name}${Math.floor(Math.random() * 1000)}`,
    settings: {
      theme: "light",
      notifications: true,
      soundEffects: true,
      email: "",
    },
    statistics: {
      handsPlayed: 0,
      gamesPlayed: 0,
      gamesWon: 0,
      totalWinnings: 0,
      biggestWin: 0,
      currentStreak: 0,
      winRate: 0,
      level: 1,
      experience: 0,
    },
    gameHistory: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

export function generateMockGameHistory() {
  const gameTypes = ["Cash Game", "Tournament", "Sit & Go"]
  const tableNames = ["High Rollers", "Beginners Table", "Pro League", "Weekend Special"]

  return Array.from({ length: 5 }, (_, i) => {
    const isWin = Math.random() > 0.5
    const amount = Math.floor(Math.random() * 1000) + 100
    const date = new Date()
    date.setDate(date.getDate() - i)

    return {
      id: `game-${i}`,
      date: date.toISOString(),
      gameType: gameTypes[Math.floor(Math.random() * gameTypes.length)],
      result: isWin ? "win" : "loss",
      position: isWin ? Math.floor(Math.random() * 3) + 1 : Math.floor(Math.random() * 6) + 4,
      amountWon: isWin ? amount : undefined,
      amountLost: !isWin ? amount : undefined,
      tableId: `table-${i}`,
      tableName: tableNames[Math.floor(Math.random() * tableNames.length)],
    }
  })
}

