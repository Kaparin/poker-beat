export type TransactionType = "deposit" | "withdrawal" | "game_win" | "game_loss" | "bonus"
export type TransactionStatus = "pending" | "completed" | "failed"

export interface Transaction {
  id: string
  userId: number
  type: TransactionType
  amount: number // Amount in chips
  tonAmount: number // Amount in TON
  timestamp: string
  status: TransactionStatus
  address?: string // TON address for deposits/withdrawals
  txHash?: string // Blockchain transaction hash
  memo?: string // Additional information
}

export interface WalletBalance {
  chips: number
  ton: number
  pendingDeposits: number
  pendingWithdrawals: number
}

export interface WithdrawalRequest {
  userId: number
  amount: number // Amount in chips
  address: string // TON wallet address
}

export interface DepositRequest {
  userId: number
  amount: number // Amount in TON
}

export interface TonAddressInfo {
  address: string
  qrCodeUrl: string
}

