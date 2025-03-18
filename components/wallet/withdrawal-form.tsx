"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { chipsToTon, WITHDRAWAL_FEE_TON, MIN_WITHDRAWAL_CHIPS, isValidTonAddress } from "@/lib/ton-utils"
import { toast } from "@/hooks/use-toast"
import type { WalletBalance } from "@/types/wallet"

interface WithdrawalFormProps {
  balance: WalletBalance
  onClose: () => void
  onWithdraw: (amount: number, address: string) => Promise<void>
}

export function WithdrawalForm({ balance, onClose, onWithdraw }: WithdrawalFormProps) {
  const [amount, setAmount] = useState<number>(MIN_WITHDRAWAL_CHIPS)
  const [address, setAddress] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const maxWithdrawal = balance.chips
  const tonAmount = chipsToTon(amount)
  const tonAmountAfterFee = Math.max(0, tonAmount - WITHDRAWAL_FEE_TON)

  const handleAmountChange = (value: number[]) => {
    setAmount(value[0])
  }

  const handleInputAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseInt(e.target.value)
    if (!isNaN(value) && value >= 0 && value <= maxWithdrawal) {
      setAmount(value)
    }
  }

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddress(e.target.value)
  }

  const handleWithdraw = async () => {
    if (amount < MIN_WITHDRAWAL_CHIPS) {
      toast({
        title: "Invalid amount",
        description: `Minimum withdrawal amount is ${MIN_WITHDRAWAL_CHIPS} chips`,
        variant: "destructive",
      })
      return
    }

    if (!isValidTonAddress(address)) {
      toast({
        title: "Invalid address",
        description: "Please enter a valid TON wallet address",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      await onWithdraw(amount, address)
      toast({
        title: "Withdrawal initiated",
        description: `Your withdrawal of ${tonAmountAfterFee.toFixed(4)} TON is being processed`,
      })
      onClose()
    } catch (error) {
      toast({
        title: "Withdrawal failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Withdraw TON</CardTitle>
        <CardDescription>Convert your chips to TON and withdraw to your wallet</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="withdrawal-amount">Amount (Chips)</Label>
            <div className="flex items-center space-x-2">
              <Input
                id="withdrawal-amount"
                type="number"
                min={MIN_WITHDRAWAL_CHIPS}
                max={maxWithdrawal}
                value={amount}
                onChange={handleInputAmountChange}
              />
              <Button variant="outline" size="sm" onClick={() => setAmount(maxWithdrawal)}>
                Max
              </Button>
            </div>

            <Slider
              value={[amount]}
              min={MIN_WITHDRAWAL_CHIPS}
              max={maxWithdrawal}
              step={10}
              onValueChange={handleAmountChange}
              className="mt-2"
            />

            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{MIN_WITHDRAWAL_CHIPS}</span>
              <span>{maxWithdrawal}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ton-address">TON Wallet Address</Label>
            <Input
              id="ton-address"
              placeholder="EQ..."
              value={address}
              onChange={handleAddressChange}
              className="font-mono"
            />
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md space-y-2">
            <div className="flex justify-between">
              <span className="text-sm">Amount in TON:</span>
              <span className="text-sm font-medium">{tonAmount.toFixed(4)} TON</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Network Fee:</span>
              <span className="text-sm font-medium">{WITHDRAWAL_FEE_TON} TON</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
              <span className="text-sm font-medium">You will receive:</span>
              <span className="text-sm font-bold">{tonAmountAfterFee.toFixed(4)} TON</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col space-y-2">
          <Button
            onClick={handleWithdraw}
            disabled={
              isSubmitting || amount < MIN_WITHDRAWAL_CHIPS || !isValidTonAddress(address) || tonAmountAfterFee <= 0
            }
            className="w-full"
          >
            {isSubmitting ? "Processing..." : "Withdraw TON"}
          </Button>
          <Button variant="outline" onClick={onClose} className="w-full">
            Cancel
          </Button>
        </div>

        <div className="text-xs text-gray-500 bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
          <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">Important</p>
          <p>• Minimum withdrawal: {MIN_WITHDRAWAL_CHIPS} chips</p>
          <p>• Network fee: {WITHDRAWAL_FEE_TON} TON</p>
          <p>• Withdrawals are typically processed within 30 minutes</p>
          <p>• Double-check your wallet address before confirming</p>
        </div>
      </CardContent>
    </Card>
  )
}

