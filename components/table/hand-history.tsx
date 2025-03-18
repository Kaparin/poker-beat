"use client"

import { useEffect, useState } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDistanceToNow } from "date-fns"
import { ru } from "date-fns/locale"
import { PlayingCard } from "@/components/table/playing-card"

interface HandHistoryProps {
  tableId: string
}

interface GameHistory {
  id: string
  status: string
  potSize: number
  winnerId: string
  winnerName: string
  winningHand: string
  communityCards: string[]
  createdAt: string
  endedAt: string
}

interface PaginationInfo {
  total: number
  page: number
  limit: number
  pages: number
}

export function HandHistory({ tableId }: HandHistoryProps) {
  const [games, setGames] = useState<GameHistory[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: 10,
    pages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  
  useEffect(() => {
    fetchHistory(1);
  }, [tableId]);
  
  const fetchHistory = async (page: number) => {
    try {
      const isInitialLoad = page === 1;
      
      if (isInitialLoad) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      
      const response = await fetch(`/api/tables/${tableId}/history?page=${page}&limit=10`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch history');
      }
      
      const data = await response.json();
      
      if (isInitialLoad) {
        setGames(data.games);
      } else {
        setGames((prev) => [...prev, ...data.games]);
      }
      
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching hand history:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };
  
  const loadMore = () => {
    if (pagination.page < pagination.pages) {
      fetchHistory(pagination.page + 1);
    }
  };
  
  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-[100px] rounded-md" />
        ))}
      </div>
    );
  }
  
  if (games.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        История игр пуста
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-4">
          {games.map((game) => (
            <Card key={game.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-medium">Пот: {game.potSize.toLocaleString()} фишек</div>
                    <div className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(game.endedAt), { addSuffix: true, locale: ru })}
                    </div>
                  </div>
                  <Badge variant="outline">
                    {game.status}
                  </Badge>
                </div>
                
                <div className="mt-2">
                  <div className="text-sm">
                    Победитель: <span className="font-medium">{game.winnerName}</span>
                  </div>
                  {game.winningHand && (
                    <div className="text-sm">
                      Комбинация: <span className="font-medium">{game.winningHand}</span>
                    </div>
                  )}
                </div>
                
                {game.communityCards && game.communityCards.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {game.communityCards.map((card, index) => (
                      <PlayingCard key={index} card={card} size="sm" />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>\

