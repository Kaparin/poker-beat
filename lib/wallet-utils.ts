import prisma from "./prisma"
import { encrypt } from "./encryption"
import { simulateTonTransaction } from "./ton-utils"
import { sendTelegramNotification } from "./telegram-notifications"

/**
 * Обрабатывает вывод средств после создания транзакции
 */
export async function processWithdrawal(
  transactionId: string,
  userId: number,
  telegramId: number,
  amount: number,
  tonAmount: number,
  address: string,
  ip: string,
  userAgent: string,
  withdrawalLimit?: any,
) {
  // Симулируем транзакцию блокчейна с задержкой
  setTimeout(async () => {
    try {
      // Симулируем транзакцию
      const txResult = await simulateTonTransaction("app-wallet", address, tonAmount)

      // Обновляем транзакцию
      await prisma.transaction.update({
        where: { id: transactionId },
        data: {
          status: txResult.success ? "completed" : "failed",
          txHash: txResult.success ? txResult.txHash : undefined,
          memo: txResult.success ? "Withdrawal processed" : txResult.error,
        },
      })

      // Логируем результат
      await prisma.securityLog.create({
        data: {
          userId,
          action: txResult.success ? "withdrawal_completed" : "withdrawal_failed",
          ipAddress: encrypt(ip),
          userAgent,
          details: txResult.success
            ? `Withdrawal of ${amount} chips (${tonAmount} TON) completed. TX: ${txResult.txHash}`
            : `Withdrawal of ${amount} chips (${tonAmount} TON) failed: ${txResult.error}`,
        },
      })

      if (!txResult.success) {
        // Возвращаем фишки и TON пользователю, если вывод не удался
        await prisma.user.update({
          where: { id: userId },
          data: {
            balance: { increment: amount },
            tonBalance: { increment: tonAmount }, // Возвращаем TON баланс
          },
        })

        // Обновляем лимиты вывода
        if (withdrawalLimit) {
          await prisma.withdrawalLimit.update({
            where: { userId },
            data: {
              dailyUsed: { decrement: amount },
              monthlyUsed: { decrement: amount },
            },
          })
        }

        // Отправляем уведомление о неудачном выводе
        await sendTelegramNotification(
          telegramId,
          `Your withdrawal of ${tonAmount} TON has failed. The amount has been refunded to your balance.`,
        )
      } else {
        // Отправляем уведомление об успешном выводе
        await sendTelegramNotification(
          telegramId,
          `Your withdrawal of ${tonAmount} TON has been processed successfully.`,
        )
      }
    } catch (error) {
      console.error("Error processing withdrawal:", error)

      // Логируем ошибку
      await prisma.securityLog.create({
        data: {
          userId,
          action: "withdrawal_error",
          ipAddress: encrypt(ip),
          userAgent,
          details: `Error processing withdrawal: ${error instanceof Error ? error.message : "Unknown error"}`,
        },
      })

      // Возвращаем фишки и TON пользователю
      await prisma.user.update({
        where: { id: userId },
        data: {
          balance: { increment: amount },
          tonBalance: { increment: tonAmount }, // Возвращаем TON баланс
        },
      })

      // Обновляем лимиты вывода
      if (withdrawalLimit) {
        await prisma.withdrawalLimit.update({
          where: { userId },
          data: {
            dailyUsed: { decrement: amount },
            monthlyUsed: { decrement: amount },
          },
        })
      }

      // Отправляем уведомление об ошибке
      await sendTelegramNotification(
        telegramId,
        `There was an error processing your withdrawal of ${tonAmount} TON. The amount has been refunded to your balance.`,
      )
    }
  }, 8000) // Симулируем 8-секундную задержку для подтверждения блокчейна
}

