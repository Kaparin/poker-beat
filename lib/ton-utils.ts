import crypto from "crypto"
import type { Transaction, TransactionStatus, TransactionType } from "@/types/wallet"
import { v4 as uuidv4 } from "uuid"
import prisma from "./prisma"

// Constants for conversion rates
export const TON_TO_CHIPS_RATE = 100 // 1 TON = 100 chips
export const WITHDRAWAL_FEE_TON = 0.01 // Fee for withdrawals in TON
export const MIN_DEPOSIT_TON = 0.1 // Minimum deposit amount
export const MIN_WITHDRAWAL_CHIPS = 10 // Minimum withdrawal amount in chips

// Generate a TON address for a user or get existing one
export async function getUserTonAddress(userId: number): Promise<string> {
  try {
    // Check if user already has a TON address
    const existingAddress = await prisma.userTonAddress.findUnique({
      where: { userId },
    })

    if (existingAddress) {
      return existingAddress.tonAddress
    }

    // Generate a new TON address for this user
    // In a real app, you would generate or assign a real TON address from your wallet service
    const userIdStr = userId.toString().padStart(2, "0")
    const randomPart = crypto.randomBytes(32).toString("hex")
    const address = `EQ${userIdStr}${randomPart.substring(0, 64 - userIdStr.length)}`

    // Save the address to the database
    await prisma.userTonAddress.create({
      data: {
        userId,
        tonAddress: address,
      },
    })

    return address
  } catch (error) {
    console.error("Error getting/generating TON address:", error)

    // Fallback to a deterministic but temporary address (don't save it)
    // This should almost never happen in production
    return `EQ${userId.toString().padStart(2, "0")}${"0".repeat(64 - userId.toString().length)}`
  }
}

// Generate a QR code URL for a TON address
export function generateQrCodeUrl(address: string, amount?: number): string {
  try {
    // In a real app, you would generate a proper TON transfer QR code
    // For now, we'll just create a URL that could be used to generate a QR code
    const baseUrl = `ton://transfer/${address}`
    const params = new URLSearchParams()

    if (amount) {
      params.append("amount", amount.toString())
    }

    params.append("text", "Deposit to Poker Beat")

    return `${baseUrl}?${params.toString()}`
  } catch (error) {
    console.error("Error generating QR code URL:", error)
    return address // Fallback to just the address
  }
}

// Convert TON to chips
export function tonToChips(tonAmount: number): number {
  return Math.floor(tonAmount * TON_TO_CHIPS_RATE)
}

// Convert chips to TON
export function chipsToTon(chipsAmount: number): number {
  return chipsAmount / TON_TO_CHIPS_RATE
}

// Simulate a TON blockchain transaction
export async function simulateTonTransaction(
  fromAddress: string,
  toAddress: string,
  amount: number,
): Promise<{ success: boolean; txHash: string; error?: string }> {
  try {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Simulate success with 95% probability
    const success = Math.random() < 0.95

    if (success) {
      // Generate a mock transaction hash
      const txHash = crypto.randomBytes(32).toString("hex")
      return { success: true, txHash }
    } else {
      return {
        success: false,
        txHash: "",
        error: "Transaction failed. Please try again.",
      }
    }
  } catch (error) {
    console.error("Transaction simulation error:", error)
    return {
      success: false,
      txHash: "",
      error: "An unexpected error occurred during the transaction.",
    }
  }
}

// Create a transaction record
export function createTransaction(
  userId: number,
  type: TransactionType,
  chipsAmount: number,
  tonAmount: number,
  status: TransactionStatus = "pending",
  address?: string,
  txHash?: string,
  memo?: string,
): Transaction {
  return {
    id: uuidv4(),
    userId,
    type,
    amount: chipsAmount,
    tonAmount,
    timestamp: new Date().toISOString(),
    status,
    address,
    txHash,
    memo,
  }
}

// Validate a TON address
export function isValidTonAddress(address: string): boolean {
  if (!address) return false

  // Check if it's a raw address (base64 format)
  const rawAddressRegex = /^(?:EQ|UQ|kQ)[a-zA-Z0-9_-]{46}$/
  if (rawAddressRegex.test(address)) return true

  // Check if it's a user-friendly address
  const friendlyAddressRegex = /^[a-zA-Z0-9+/]+={0,2}$/
  if (friendlyAddressRegex.test(address) && (address.length === 48 || address.length === 44)) return true

  return false
}

// Calculate maximum withdrawal amount based on user balance and fees
export function calculateMaxWithdrawal(balanceInChips: number): { chips: number; ton: number } {
  const maxChips = balanceInChips
  const maxTon = chipsToTon(maxChips)
  const tonAfterFee = Math.max(0, maxTon - WITHDRAWAL_FEE_TON)

  // If the fee would make the withdrawal zero, return zero
  if (tonAfterFee <= 0) {
    return { chips: 0, ton: 0 }
  }

  // Calculate the exact chip amount that would result in the maximum TON after fees
  const adjustedChips = tonToChips(tonAfterFee + WITHDRAWAL_FEE_TON)

  return {
    chips: Math.min(adjustedChips, maxChips),
    ton: tonAfterFee,
  }
}

