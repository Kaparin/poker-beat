"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { format } from "date-fns"
import { ru } from "date-fns/locale"
import { Lock, Award, CheckCircle2 } from "lucide-react"
import type { Achievement } from "@/types/statistics"

interface AchievementCardProps {
  achievement: Achievement
  isUnlocked: boolean
  progress?: number
  maxProgress?: number
}

export function AchievementCard({ achievement, isUnlocked, progress = 0, maxProgress = 100 }: AchievementCardProps) {
  const progressPercentage = Math.min(100, Math.round((progress / maxProgress) * 100))

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Card
            className={`h-full transition-all duration-200 ${isUnlocked ? "border-primary/50" : "opacity-75 hover:opacity-100"}`}
          >
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg flex items-center">
                  {isUnlocked && <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />}
                  {achievement.name}
                </CardTitle>
                <Badge variant={isUnlocked ? "default" : "outline"}>{isUnlocked ? "Получено" : "Не получено"}</Badge>
              </div>
              <CardDescription>{achievement.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-4">
                <div className="relative w-16 h-16 flex items-center justify-center">
                  {isUnlocked ? (
                    <Award className="h-12 w-12 text-primary" />
                  ) : (
                    <>
                      <Award className="h-12 w-12 text-gray-400" />
                      <Lock className="absolute bottom-0 right-0 h-5 w-5 text-gray-500" />
                    </>
                  )}
                </div>
              </div>

              {!isUnlocked && maxProgress > 0 && (
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Прогресс</span>
                    <span>
                      {progress} / {maxProgress}
                    </span>
                  </div>
                  <Progress value={progressPercentage} className="h-2" />
                </div>
              )}

              {isUnlocked && achievement.unlockedAt && (
                <div className="mt-2 text-xs text-center text-gray-500">
                  Получено {format(new Date(achievement.unlockedAt), "dd MMMM yyyy", { locale: ru })}
                </div>
              )}
            </CardContent>
          </Card>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>{achievement.description}</p>
          {!isUnlocked && maxProgress > 0 && (
            <p className="text-xs mt-1">
              Прогресс: {progress} / {maxProgress}
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

