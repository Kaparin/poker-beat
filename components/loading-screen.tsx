"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2 } from "lucide-react"

export function LoadingScreen() {
  const [progress, setProgress] = useState(0)
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setTimeout(() => setIsVisible(false), 500)
          return 100
        }
        return prev + 5
      })
    }, 100)

    return () => clearInterval(interval)
  }, [])

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black"
        >
          <div className="relative mb-8 h-40 w-80">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Image src="/logo.svg" alt="Poker Logo" width={320} height={160} className="h-auto w-auto" priority />
            </motion.div>
          </div>

          <div className="mb-4 flex space-x-4">
            {["♠", "♥", "♦", "♣"].map((suit, index) => (
              <motion.div
                key={suit}
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: index * 0.2, duration: 0.5 }}
                className={`text-4xl ${suit === "♥" || suit === "♦" ? "text-red-500" : "text-white"}`}
              >
                {suit}
              </motion.div>
            ))}
          </div>

          <div className="relative mb-6 h-2 w-64 overflow-hidden rounded-full bg-gray-800">
            <motion.div
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-500 to-purple-600"
              initial={{ width: "0%" }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>

          <div className="flex items-center text-white">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            <span>Загрузка игры... {progress}%</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

