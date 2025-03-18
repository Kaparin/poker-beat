"use client"

import { forwardRef } from "react"
import { Chip } from "./chip"
import { cn } from "@/lib/utils"

interface PotProps {
  amount: number
  className?: string
}

export const Pot = forwardRef<HTMLDivElement, PotProps>(({ amount, className }, ref) => {
  if (amount === 0) return null

  return (
    <div ref={ref} className={cn("flex flex-col items-center", className)}>
      <Chip value={amount} size="lg" />
      <div className="mt-1 text-sm font-medium">Pot: {amount}</div>
    </div>
  )
})

Pot.displayName = "Pot"

