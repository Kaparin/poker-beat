/**
 * Модуль для обработки криптовалютных транзакций.
 * В будущем здесь будет реальная интеграция с блокчейном TON.
 */

import prisma from "./prisma"
import { encrypt, decrypt } from "./encryption"
import { simulateTonTransaction } from "./ton-utils"
import { sendTelegramNotification } from "./telegram-notifications"
import { getUserTonAddress } from "./ton-utils"
import { sendTransactionUpdate } from "./websocket"

// Добавляем кэширование для предотвращения дублирования транзакций
const processingTransactions = new Map<string, boolean>()

/**
 * Создает и обрабатывает депозит
 */
export async function processDeposit(
  userId: number,
  telegramId: number,
  amount: number, // TON amount
  ip: string,
  userAgent: string,
) {
  // Создаем уникальный ключ для этой транзакции
  const transactionKey = `deposit-${userId}-${amount}-${Date.now()}`

  // Проверяем, не обрабатывается ли уже такая транзакция
  if (processingTransactions.get(transactionKey)) {
    throw new Error("Транзакция уже обрабатывается")
  }

  // Помечаем транзакцию как обрабатываемую
  processingTransactions.set(transactionKey, true)

  try {
    // Проверяем валидность суммы
    if (amount <= 0) {
      throw new Error("Сумма депозита должна быть положительной")
    }

    // Получаем или создаем TON-адрес пользователя
    const depositAddress = await getUserTonAddress(userId)

    // Рассчитываем количество фишек
    const chipsAmount = Math.floor(amount * 100) // 1 TON = 100 chips

    // Создаем запись транзакции
    const transaction = await prisma.transaction.create({
      data: {
        userId,
        type: "deposit",
        amount: chipsAmount,
        tonAmount: amount,
        status: "pending",
        address: depositAddress,
        memo: "Deposit initiated",
      },
    })

    // Логируем депозит
    await prisma.securityLog.create({
      data: {
        userId,
        action: "deposit_initiated",
        ipAddress: encrypt(ip),
        userAgent,
        details: `Deposit of ${amount} TON initiated`,
      },
    })

    // В реальной интеграции здесь был бы код для мониторинга блокчейна
    // на предмет появления транзакции на этот адрес.
    // Для демо симулируем транзакцию с задержкой

    const processingPromise = new Promise<any>((resolve, reject) => {
      setTimeout(async () => {
        try {
          // Симулируем транзакцию блокчейна
          const result = await simulateTonTransaction("external-wallet", depositAddress, amount)

          // Обновляем транзакцию
          const updatedTransaction = await prisma.transaction.update({
            where: { id: transaction.id },
            data: {
              status: result.success ? "completed" : "failed",
              txHash: result.success ? result.txHash : undefined,
              memo: result.success ? "Deposit confirmed" : result.error,
            },
          })

          if (result.success) {
            // Обновляем баланс пользователя (фишки и TON)
            await prisma.user.update({
              where: { id: userId },
              data: {
                balance: { increment: chipsAmount },
                tonBalance: { increment: amount }, // Увеличиваем TON баланс
              },
            })

            // Обновляем статистику пользователя
            await prisma.userStatistics.updateMany({
              where: { userId },
              data: {
                totalDeposits: { increment: 1 },
                totalDepositAmount: { increment: amount },
              },
            })

            // Логируем успешный депозит
            await prisma.securityLog.create({
              data: {
                userId,
                action: "deposit_completed",
                ipAddress: encrypt(ip),
                userAgent,
                details: `Deposit of ${amount} TON completed. TX: ${result.txHash}`,
              },
            })

            // Отправляем уведомление в Telegram
            await sendTelegramNotification(
              telegramId,
              `✅ Your deposit of ${amount} TON has been processed successfully. ${chipsAmount} chips have been added to your balance.`,
            )
          } else {
            // Логируем неудачный депозит
            await prisma.securityLog.create({
              data: {
                userId,
                action: "deposit_failed",
                ipAddress: encrypt(ip),
                userAgent,
                details: `Deposit of ${amount} TON failed: ${result.error}`,
              },
            })

            // Отправляем уведомление в Telegram о неудаче
            await sendTelegramNotification(
              telegramId,
              `❌ Your deposit of ${amount} TON has failed. Please try again or contact support if the issue persists.`,
            )
          }

          // Отправляем обновление статуса транзакции через WebSocket
          await sendTransactionUpdate(userId, updatedTransaction)

          // Удаляем транзакцию из обрабатываемых
          processingTransactions.delete(transactionKey)

          resolve(updatedTransaction)
        } catch (error) {
          console.error("Error processing deposit:", error)

          // Логируем ошибку
          await prisma.securityLog.create({
            data: {
              userId,
              action: "deposit_error",
              ipAddress: encrypt(ip),
              userAgent,
              details: `Error processing deposit: ${error instanceof Error ? error.message : "Unknown error"}`,
            },
          })

          // Удаляем транзакцию из обрабатываемых
          processingTransactions.delete(transactionKey)

          reject(error)
        }
      }, 5000) // 5-секундная задержка для симуляции подтверждения блокчейном
    })

    return {
      transaction,
      processingPromise,
    }
  } catch (error) {
    // Удаляем транзакцию из обрабатываемых в случае ошибки
    processingTransactions.delete(transactionKey)
    console.error("Error initiating deposit:", error)
    throw error
  }
}

/**
 * Обрабатывает вывод средств
 */
export async function processWithdrawal(
  userId: number,
  telegramId: number,
  chipsAmount: number,
  tonAmount: number,
  address: string,
  withdrawalFee = 0.01,
  ip: string,
  userAgent: string,
) {
  // Создаем уникальный ключ для этой транзакции
  const transactionKey = `withdrawal-${userId}-${tonAmount}-${Date.now()}`

  // Проверяем, не обрабатывается ли уже такая транзакция
  if (processingTransactions.get(transactionKey)) {
    throw new Error("Транзакция уже обрабатывается")
  }

  // Помечаем транзакцию как обрабатываемую
  processingTransactions.set(transactionKey, true)

  try {
    // Проверяем валидность суммы и адреса
    if (chipsAmount <= 0 || tonAmount <= 0) {
      throw new Error("Сумма вывода должна быть положительной")
    }

    if (!address || address.trim().length < 10) {
      throw new Error("Недействительный TON адрес")
    }

    // Проверяем, достаточно ли у пользователя средств
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { balance: true, tonBalance: true },
    })

    if (!user) {
      throw new Error("Пользователь не найден")
    }

    if (user.balance < chipsAmount) {
      throw new Error("Недостаточно фишек для вывода")
    }

    if (user.tonBalance < tonAmount) {
      throw new Error("Недостаточно TON для вывода")
    }

    // Создаем запись транзакции
    const transaction = await prisma.transaction.create({
      data: {
        userId,
        type: "withdrawal",
        amount: chipsAmount,
        tonAmount: tonAmount,
        status: "pending",
        address,
        memo: "Withdrawal initiated",
      },
    })

    // Логируем запрос на вывод
    await prisma.securityLog.create({
      data: {
        userId,
        action: "withdrawal_initiated",
        ipAddress: encrypt(ip),
        userAgent,
        details: `Withdrawal of ${chipsAmount} chips (${tonAmount} TON) to address ${address}`,
      },
    })

    // Отправляем уведомление о начале вывода средств
    await sendTelegramNotification(
      telegramId,
      `⏳ Your withdrawal request of ${tonAmount} TON has been initiated and is being processed.`,
    )

    // В реальной интеграции здесь был бы код для создания транзакции в блокчейне
    // Для демо симулируем транзакцию с задержкой

    const processingPromise = new Promise<any>((resolve, reject) => {
      setTimeout(async () => {
        try {
          // Симулируем транзакцию блокчейна
          const result = await simulateTonTransaction("app-wallet", address, tonAmount)

          // Обновляем транзакцию
          const updatedTransaction = await prisma.transaction.update({
            where: { id: transaction.id },
            data: {
              status: result.success ? "completed" : "failed",
              txHash: result.success ? result.txHash : undefined,
              memo: result.success ? "Withdrawal processed" : result.error,
            },
          })

          if (result.success) {
            // Обновляем статистику пользователя
            await prisma.userStatistics.updateMany({
              where: { userId },
              data: {
                totalWithdrawals: { increment: 1 },
                totalWithdrawalAmount: { increment: tonAmount },
              },
            })

            // Логируем успешный вывод
            await prisma.securityLog.create({
              data: {
                userId,
                action: "withdrawal_completed",
                ipAddress: encrypt(ip),
                userAgent,
                details: `Withdrawal of ${chipsAmount} chips (${tonAmount} TON) completed. TX: ${result.txHash}`,
              },
            })

            // Отправляем уведомление об успешном выводе
            await sendTelegramNotification(
              telegramId,
              `✅ Your withdrawal of ${tonAmount} TON has been processed successfully. Transaction hash: ${result.txHash || "N/A"}`,
            )
          } else {
            // Возвращаем фишки и TON пользователю
            await prisma.user.update({
              where: { id: userId },
              data: {
                balance: { increment: chipsAmount },
                tonBalance: { increment: tonAmount },
              },
            })

            // Логируем неудачный вывод
            await prisma.securityLog.create({
              data: {
                userId,
                action: "withdrawal_failed",
                ipAddress: encrypt(ip),
                userAgent,
                details: `Withdrawal of ${chipsAmount} chips (${tonAmount} TON) failed: ${result.error}`,
              },
            })

            // Отправляем уведомление о неудачном выводе
            await sendTelegramNotification(
              telegramId,
              `❌ Your withdrawal of ${tonAmount} TON has failed. The amount has been returned to your balance.`,
            )
          }

          // Отправляем обновление статуса транзакции через WebSocket
          await sendTransactionUpdate(userId, updatedTransaction)

          // Удаляем транзакцию из обрабатываемых
          processingTransactions.delete(transactionKey)

          resolve(updatedTransaction)
        } catch (error) {
          console.error("Error processing withdrawal:", error)

          // Возвращаем фишки пользователю в случае ошибки
          await prisma.user.update({
            where: { id: userId },
            data: {
              balance: { increment: chipsAmount },
              tonBalance: { increment: tonAmount },
            },
          })

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

          // Отправляем уведомление об ошибке
          await sendTelegramNotification(
            telegramId,
            `❌ There was an error processing your withdrawal of ${tonAmount} TON. The amount has been returned to your balance.`,
          )

          // Удаляем транзакцию из обрабатываемых
          processingTransactions.delete(transactionKey)

          reject(error)
        }
      }, 8000) // 8-секундная задержка для симуляции вывода
    })

    return {
      transaction,
      processingPromise,
    }
  } catch (error) {
    // Удаляем транзакцию из обрабатываемых в случае ошибки
    processingTransactions.delete(transactionKey)
    console.error("Error initiating withdrawal:", error)
    throw error
  }
}

/**
 * Проверяет код подтверждения и обрабатывает подтвержденный вывод
 */
export async function verifyAndProcessWithdrawal(
  userId: number,
  telegramId: number,
  withdrawalId: string,
  code: string,
  ip: string,
  userAgent: string,
) {
  try {
    // Находим ожидающий вывод
    const pendingWithdrawal = await prisma.pendingWithdrawal.findUnique({
      where: { id: withdrawalId },
    })

    if (!pendingWithdrawal) {
      throw new Error("Withdrawal not found")
    }

    // Проверяем, принадлежит ли вывод пользователю
    if (pendingWithdrawal.userId !== userId) {
      // Логируем попытку несанкционированного доступа
      await prisma.securityLog.create({
        data: {
          userId,
          action: "unauthorized_withdrawal_verification_attempt",
          ipAddress: encrypt(ip),
          userAgent,
          details: `User ${userId} attempted to verify withdrawal ${withdrawalId} belonging to user ${pendingWithdrawal.userId}`,
        },
      })

      throw new Error("Unauthorized")
    }

    // Проверяем, не истек ли срок действия вывода
    if (new Date() > pendingWithdrawal.expiresAt) {
      // Удаляем истекший вывод
      await prisma.pendingWithdrawal.delete({
        where: { id: withdrawalId },
      })

      throw new Error("Verification code has expired")
    }

    // Проверяем код
    const decryptedCode = decrypt(pendingWithdrawal.verificationCode)

    if (code !== decryptedCode) {
      // Логируем неудачную попытку верификации
      await prisma.securityLog.create({
        data: {
          userId,
          action: "withdrawal_verification_failed",
          ipAddress: encrypt(ip),
          userAgent,
          details: `Failed verification attempt for withdrawal ${withdrawalId}`,
        },
      })

      throw new Error("Invalid verification code")
    }

    // Логируем успешную верификацию
    await prisma.securityLog.create({
      data: {
        userId,
        action: "withdrawal_verification_success",
        ipAddress: encrypt(ip),
        userAgent,
        details: `Successful verification for withdrawal ${withdrawalId}`,
      },
    })

    // Удаляем ожидающий вывод
    await prisma.pendingWithdrawal.delete({
      where: { id: withdrawalId },
    })

    // Обрабатываем подтвержденный вывод
    return await processWithdrawal(
      userId,
      telegramId,
      pendingWithdrawal.amount,
      pendingWithdrawal.tonAmount,
      pendingWithdrawal.address,
      0.01, // стандартная комиссия за вывод
      ip,
      userAgent,
    )
  } catch (error) {
    console.error("Error verifying withdrawal:", error)
    throw error
  }
}

