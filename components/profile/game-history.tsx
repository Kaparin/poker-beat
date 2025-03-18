import type { GameResult } from "@/types/user"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDistanceToNow } from "date-fns"

interface GameHistoryProps {
  games: GameResult[]
}

export function GameHistory({ games }: GameHistoryProps) {
  if (games.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Game History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-gray-500 dark:text-gray-400 py-6">
            No games played yet. Join a table to start your poker journey!
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Game History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {games.map((game) => (
            <div
              key={game.id}
              className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700"
            >
              <div>
                <h3 className="font-medium">{game.tableName}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {game.gameType} • {formatDistanceToNow(new Date(game.date), { addSuffix: true })}
                </p>
              </div>
              <div className="text-right">
                <p
                  className={`font-medium ${
                    game.result === "win"
                      ? "text-green-600 dark:text-green-400"
                      : game.result === "loss"
                        ? "text-red-600 dark:text-red-400"
                        : "text-gray-600 dark:text-gray-400"
                  }`}
                >
                  {game.result === "win"
                    ? `+${game.amountWon} chips`
                    : game.result === "loss"
                      ? `-${game.amountLost} chips`
                      : "Draw"}
                </p>
                {game.position && <p className="text-sm text-gray-500 dark:text-gray-400">Position: {game.position}</p>}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

