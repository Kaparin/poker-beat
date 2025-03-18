"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Copy } from "lucide-react"
import { tonToChips, MIN_DEPOSIT_TON } from "@/lib/ton-utils"
import { toast } from "@/hooks/use-toast"
import Image from "next/image"

interface DepositSectionProps {
  tonAddress: string
  qrCodeUrl: string
  onClose: () => void
  onDepositSimulate: (amount: number) => Promise<void>
}

export function DepositSection({ tonAddress, qrCodeUrl, onClose, onDepositSimulate }: DepositSectionProps) {
  const [amount, setAmount] = useState<number>(0.1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(tonAddress)
    toast({
      title: "Address copied",
      description: "TON address copied to clipboard",
    })
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseFloat(e.target.value)
    if (!isNaN(value) && value >= 0) {
      setAmount(value)
    }
  }

  const handleSimulateDeposit = async () => {
    if (amount < MIN_DEPOSIT_TON) {
      toast({
        title: "Invalid amount",
        description: `Minimum deposit amount is ${MIN_DEPOSIT_TON} TON`,
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      await onDepositSimulate(amount)
      toast({
        title: "Deposit initiated",
        description: `Your deposit of ${amount} TON is being processed`,
      })
      onClose()
    } catch (error) {
      toast({
        title: "Deposit failed",
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
        <CardTitle>Deposit TON</CardTitle>
        <CardDescription>Send TON to your wallet address to receive chips</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col items-center space-y-4">
          <div className="bg-white p-2 rounded-lg">
            <div className="relative w-48 h-48">
              <Image
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCodeUrl)}`}
                alt="Deposit QR Code"
                fill
                className="object-contain"
              />
            </div>
          </div>

          <div className="w-full">
            <Label htmlFor="ton-address">Your TON Address</Label>
            <div className="flex mt-1.5">
              <Input id="ton-address" value={tonAddress} readOnly className="font-mono text-sm" />
              <Button type="button" variant="outline" size="icon" className="ml-2" onClick={handleCopyAddress}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-1">Send TON to this address to deposit funds</p>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t">
          <div className="space-y-2">
            <Label htmlFor="deposit-amount">Deposit Amount (TON)</Label>
            <Input
              id="deposit-amount"
              type="number"
              min={MIN_DEPOSIT_TON}
              step="0.01"
              value={amount}
              onChange={handleAmountChange}
            />
            <p className="text-sm text-gray-500">You will receive: {tonToChips(amount)} chips</p>
          </div>

          <div className="flex flex-col space-y-2">
            <Button
              onClick={handleSimulateDeposit}
              disabled={isSubmitting || amount < MIN_DEPOSIT_TON}
              className="w-full"
            >
              {isSubmitting ? "Processing..." : "Simulate Deposit"}
            </Button>
            <Button variant="outline" onClick={onClose} className="w-full">
              Cancel
            </Button>
          </div>

          <div className="text-xs text-gray-500 bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
            <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">Important</p>
            <p>• Minimum deposit: {MIN_DEPOSIT_TON} TON</p>
            <p>• Only send TON to this address</p>
            <p>• Deposits are typically credited within 1-2 minutes</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

