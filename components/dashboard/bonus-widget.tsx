import type React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Gift, ChevronRight } from "lucide-react"
import Link from "next/link"
import { DailyBonus } from "@/components/bonuses/daily-bonus"

export const BonusWidget: React.FC = () => {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">Бонусы и акции</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <DailyBonus />

        <div className="mt-4 rounded-lg border p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Gift className="mr-2 h-5 w-5 text-green-500" />
              <div>
                <h4 className="text-sm font-medium">Доступны новые бонусы</h4>
                <p className="text-xs text-muted-foreground">Проверьте страницу бонусов</p>
              </div>
            </div>
            <Link href="/bonuses">
              <Button variant="ghost" size="sm">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

