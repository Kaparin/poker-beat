import { db } from "@/lib/db"
import {
  RAKE_PERCENTAGE,
  TREASURY_POOL_PERCENTAGE,
  MIN_POT_FOR_RAKE,
  MAX_RAKE_PER_POT,
  JACKPOT_PERCENTAGE_FROM_RAKE,
} from "@/lib/constants/game-economics"

/**
 * Сервис для управления Treasury Pool и распределения средств
 */
export class TreasuryService {
  /**
   * Рассчитывает и распределяет средства из банка
   * @param potAmount - размер банка
   * @param tableId - ID стола
   * @param handId - ID раздачи
   * @returns объект с распределением средств
   */
  static async distributePot(
    potAmount: number,
    tableId: string,
    handId: string,
  ): Promise<{
    winnerAmount: number
    rakeAmount: number
    treasuryAmount: number
    jackpotAmount: number
  }> {
    // Не берем рейк с маленьких банков
    if (potAmount < MIN_POT_FOR_RAKE) {
      return {
        winnerAmount: potAmount,
        rakeAmount: 0,
        treasuryAmount: 0,
        jackpotAmount: 0,
      }
    }

    // Рассчитываем распределение средств
    let rakeAmount = Math.floor(potAmount * (RAKE_PERCENTAGE / 100))

    // Ограничиваем максимальный рейк
    if (rakeAmount > MAX_RAKE_PER_POT) {
      rakeAmount = MAX_RAKE_PER_POT
    }

    const treasuryAmount = Math.floor(potAmount * (TREASURY_POOL_PERCENTAGE / 100))
    const jackpotAmount = Math.floor(rakeAmount * (JACKPOT_PERCENTAGE_FROM_RAKE / 100))

    // Сумма, которую получает победитель
    const winnerAmount = potAmount - rakeAmount - treasuryAmount

    // Записываем информацию о рейке и распределении средств
    await this.recordPotDistribution(potAmount, rakeAmount, treasuryAmount, jackpotAmount, tableId, handId)

    // Обновляем Treasury Pool
    await this.updateTreasuryPool(treasuryAmount)

    // Обновляем джекпот
    await this.updateJackpot(jackpotAmount)

    return {
      winnerAmount,
      rakeAmount,
      treasuryAmount,
      jackpotAmount,
    }
  }

  /**
   * Записывает информацию о распределении банка
   */
  private static async recordPotDistribution(
    potAmount: number,
    rakeAmount: number,
    treasuryAmount: number,
    jackpotAmount: number,
    tableId: string,
    handId: string,
  ): Promise<void> {
    await db.potDistribution.create({
      data: {
        potAmount,
        rakeAmount,
        treasuryAmount,
        jackpotAmount,
        tableId,
        handId,
        timestamp: new Date(),
      },
    })
  }

  /**
   * Обновляет Treasury Pool
   */
  private static async updateTreasuryPool(amount: number): Promise<void> {
    // Получаем текущее состояние Treasury Pool
    const treasuryPool = await db.treasuryPool.findFirst()

    if (treasuryPool) {
      // Обновляем существующий Treasury Pool
      await db.treasuryPool.update({
        where: { id: treasuryPool.id },
        data: {
          totalAmount: { increment: amount },
          lastUpdated: new Date(),
        },
      })
    } else {
      // Создаем новый Treasury Pool, если он не существует
      await db.treasuryPool.create({
        data: {
          totalAmount: amount,
          lastUpdated: new Date(),
        },
      })
    }
  }

  /**
   * Обновляет джекпот
   */
  private static async updateJackpot(amount: number): Promise<void> {
    // Получаем текущее состояние джекпота
    const jackpot = await db.jackpot.findFirst()

    if (jackpot) {
      // Обновляем существующий джекпот
      await db.jackpot.update({
        where: { id: jackpot.id },
        data: {
          amount: { increment: amount },
          lastUpdated: new Date(),
        },
      })
    } else {
      // Создаем новый джекпот, если он не существует
      await db.jackpot.create({
        data: {
          amount,
          lastUpdated: new Date(),
        },
      })
    }
  }

  /**
   * Получает текущее состояние Treasury Pool
   */
  static async getTreasuryPoolStatus(): Promise<{
    totalAmount: number
    lastUpdated: Date
  }> {
    const treasuryPool = await db.treasuryPool.findFirst()

    if (!treasuryPool) {
      return {
        totalAmount: 0,
        lastUpdated: new Date(),
      }
    }

    return {
      totalAmount: treasuryPool.totalAmount,
      lastUpdated: treasuryPool.lastUpdated,
    }
  }

  /**
   * Выделяет средства из Treasury Pool на определенную цель
   */
  static async allocateFunds(amount: number, purpose: string, description: string): Promise<boolean> {
    const treasuryPool = await db.treasuryPool.findFirst()

    if (!treasuryPool || treasuryPool.totalAmount < amount) {
      return false // Недостаточно средств
    }

    // Обновляем Treasury Pool
    await db.treasuryPool.update({
      where: { id: treasuryPool.id },
      data: {
        totalAmount: { decrement: amount },
        lastUpdated: new Date(),
      },
    })

    // Записываем информацию о выделении средств
    await db.treasuryAllocation.create({
      data: {
        amount,
        purpose,
        description,
        timestamp: new Date(),
      },
    })

    return true
  }
}

