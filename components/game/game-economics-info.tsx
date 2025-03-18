"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  RAKE_PERCENTAGE,
  TREASURY_POOL_PERCENTAGE,
  WINNER_PERCENTAGE,
  MIN_POT_FOR_RAKE,
  MAX_RAKE_PER_POT,
} from "@/lib/constants/game-economics"

export default function GameEconomicsInfo() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setIsOpen(true)}>
        Экономика игры
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Экономика игры</DialogTitle>
            <DialogDescription>Информация о распределении средств в играх</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Распределение банка</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Победитель:</span>
                    <span className="font-medium">{WINNER_PERCENTAGE}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Комиссия платформы:</span>
                    <span className="font-medium">{RAKE_PERCENTAGE}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Treasury Pool:</span>
                    <span className="font-medium">{TREASURY_POOL_PERCENTAGE}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Дополнительная информация</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p>• Минимальный размер банка для взятия комиссии: {MIN_POT_FOR_RAKE.toLocaleString()} фишек</p>
                  <p>• Максимальная комиссия с одного банка: {MAX_RAKE_PER_POT.toLocaleString()} фишек</p>
                  <p>
                    • Средства из Treasury Pool используются для финансирования бонусов, турниров, акций и лидербордов
                  </p>
                  <p>• Часть комиссии идет на формирование джекпота</p>
                </div>
              </CardContent>
            </Card>

            <Button className="w-full" onClick={() => setIsOpen(false)}>
              Закрыть
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

