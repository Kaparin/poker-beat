import prisma from "./prisma"

export enum TransactionType {
  DEPOSIT = "deposit",
  WITHDRAWAL = "withdrawal",
  GAME_WIN = "game_win",
  GAME_LOSS = "game_loss",
  GAME_BUY_IN = "game_buy_in",
  GAME_CASH_OUT = "game_cash_out",
  BONUS = "bonus",
}

export enum TransactionStatus {
  PENDING = "pending",
  COMPLETED = "completed",
  FAILED = "failed",
}

interface TransactionLogParams {
  userId: number
  type: TransactionType
  amount: number
  tonAmount: number
  status: TransactionStatus
  address?: string
  txHash?: string
  memo?: string
  gameId?: string
  ip?: string
  userAgent?: string
}

export async function logTransaction(params: TransactionLogParams) {
  try {
    // Create the transaction record
    const transaction = await prisma.transaction.create({
      data: {
        userId: params.userId,
        type: params.type,
        amount: params.amount,
        tonAmount: params.tonAmount,
        status: params.status,
        address: params.address,
        txHash: params.txHash,
        memo: params.memo,
        gameId: params.gameId,
        metadata: {
          ip: params.ip,
          userAgent: params.userAgent,
        },
      },
    })

    // For critical transactions (withdrawals), also log to a separate audit table
    if (params.type === TransactionType.WITHDRAWAL) {
      await prisma.auditLog.create({
        data: {
          userId: params.userId,
          action: "WITHDRAWAL",
          details: JSON.stringify({
            transactionId: transaction.id,
            amount: params.amount,
            tonAmount: params.tonAmount,
            address: params.address,
            status: params.status,
          }),
          ip: params.ip,
          userAgent: params.userAgent,
        },
      })
    }

    return transaction
  } catch (error) {
    console.error("Error logging transaction:", error)
    throw error
  }
}

