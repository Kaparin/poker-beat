"use client"

import { useState, useEffect } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type { PlayerAction } from "@/types/poker"

interface ActionConfirmationProps {
  action: PlayerAction | null
  amount?: number
  onConfirm: () => void
  onCancel: () => void
}

export function ActionConfirmation({ action, amount, onConfirm, onCancel }: ActionConfirmationProps) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setOpen(!!action)
  }, [action])

  const handleConfirm = () => {
    setOpen(false)
    onConfirm()
  }

  const handleCancel = () => {
    setOpen(false)
    onCancel()
  }

  if (!action) return null

  const actionText = {
    fold: "fold your hand",
    check: "check",
    call: `call ${amount} chips`,
    bet: `bet ${amount} chips`,
    raise: `raise to ${amount} chips`,
    "all-in": "go all-in",
  }[action]

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm Action</AlertDialogTitle>
          <AlertDialogDescription>Are you sure you want to {actionText}?</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>Confirm</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

