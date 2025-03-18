import { TreasuryService } from "@/lib/services/treasury-service"
import { db } from "@/lib/db"

/**
 * Класс для управления банком в покере
 */
export class PotManager {
  /**
   * Распределяет банк между победителями с учетом экономической модели
   * @param potAmount - размер банка
   * @param winners - массив победителей с их долями
   * @param tableId - ID стола
   * @param handId - ID раздачи
   */
  static async distributePotToWinners(
    potAmount: number,
    winners: Array<{ userId: string; share: number }>,
    tableId: string,
    handId: string,
  ): Promise<void> {
    // Получаем распределение средств согласно экономической модели
    const { winnerAmount, rakeAmount, treasuryAmount, jackpotAmount } = await TreasuryService.distributePot(
      potAmount,
      tableId,
      handId,
    )

    // Если нет победителей, все средства идут в Treasury Pool
    if (winners.length === 0) {
      await TreasuryService.allocateFunds(
        winnerAmount,
        "unclaimed_pot",
        `Unclaimed pot from hand ${handId} at table ${tableId}`,
      )
      return
    }

    // Распределяем выигрыш между победителями согласно их долям
    const totalShares = winners.reduce((sum, winner) => sum + winner.share, 0)

    for (const winner of winners) {
      const winnerShare = Math.floor(winnerAmount * (winner.share / totalShares))

      if (winnerShare > 0) {
        // Начисляем выигрыш на баланс пользователя
        await db.user.update({
          where: { id: winner.userId },
          data: {
            balance: { increment: winnerShare },
          },
        })

        // Записываем информацию о выигрыше
        await db.winningTransaction.create({
          data: {
            userId: winner.userId,
            amount: winnerShare,
            handId,
            tableId,
            timestamp: new Date(),
          },
        })
      }
    }

    // Записываем информацию о раздаче
    await db.handSummary.update({
      where: { id: handId },
      data: {
        potAmount,
        rakeAmount,
        treasuryAmount,
        jackpotAmount,
        winnerAmount,
      },
    })
  }

  /**
   * Возвращает ставки игрокам в случае отмены раздачи
   * @param bets - массив ставок
   */
  static async returnBetsToPlayers(bets: Array<{ userId: string; amount: number }>): Promise<void> {
    for (const bet of bets) {
      if (bet.amount > 0) {
        await db.user.update({
          where: { id: bet.userId },
          data: {
            balance: { increment: bet.amount },
          },
        })

        await db.transaction.create({
          data: {
            userId: bet.userId,
            amount: bet.amount,
            type: "REFUND",
            description: "Возврат ставки из-за отмены раздачи",
            status: "COMPLETED",
            timestamp: new Date(),
          },
        })
      }
    }
  }
}

