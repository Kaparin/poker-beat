"use client"

import { useState, useEffect } from "react"
import { TournamentList } from "@/components/tournaments/tournament-list"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function TournamentsPage() {
  const { token, user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !token) {
      router.push("/")
    } else if (!authLoading && token) {
      setLoading(false)
    }
  }, [authLoading, token, router])

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container max-w-7xl mx-auto p-4 pb-20">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Турниры</h1>
          <p className="text-gray-500 dark:text-gray-400">Участвуйте в турнирах и выигрывайте призы</p>
        </div>
        <div>
          <Button onClick={() => router.push("/lobby")}>Вернуться в лобби</Button>
        </div>
      </div>

      <TournamentList />
    </div>
  )
}

