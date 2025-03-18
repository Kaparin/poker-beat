import type { UserStatistics } from "@/types/user"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trophy, Zap, DollarSign, TrendingUp, Clock } from "lucide-react"

interface StatisticsProps {
  statistics: UserStatistics
}

export function Statistics({ statistics }: StatisticsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Statistics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Games Won</p>
              <p className="font-medium">{statistics.gamesWon}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-blue-500" />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Win Rate</p>
              <p className="font-medium">{statistics.winRate}%</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5 text-green-500" />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Winnings</p>
              <p className="font-medium">{statistics.totalWinnings} chips</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-purple-500" />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Biggest Win</p>
              <p className="font-medium">{statistics.biggestWin} chips</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-orange-500" />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Hands Played</p>
              <p className="font-medium">{statistics.handsPlayed}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 flex items-center justify-center bg-red-100 rounded-full text-red-500">
              {statistics.currentStreak}
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Current Streak</p>
              <p className="font-medium">{statistics.currentStreak} wins</p>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Experience</p>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${statistics.experience % 100}%` }}></div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Level {statistics.level} • {statistics.experience % 100}/100 XP to next level
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

