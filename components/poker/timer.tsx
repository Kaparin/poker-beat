"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

interface TimerProps {
  seconds: number
  onTimeout?: () => void
  className?: string
}

export function Timer({ seconds, onTimeout, className }: TimerProps) {
  const [timeLeft, setTimeLeft] = useState(seconds)

  useEffect(() => {
    setTimeLeft(seconds)

    if (seconds <= 0) return

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          onTimeout?.()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [seconds, onTimeout])

  const percentage = Math.max(0, (timeLeft / seconds) * 100)

  let color = "bg-green-500"
  if (percentage < 30) color = "bg-red-500"
  else if (percentage < 60) color = "bg-yellow-500"

  return (
    <div className={cn("w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden", className)}>
      <div
        className={`h-full ${color} transition-all duration-1000 ease-linear`}
        style={{ width: `${percentage}%` }}
      ></div>
    </div>
  )
}

