"use client"

import { useState, useEffect } from "react"
import { TournamentDetails } from "@/components/tournaments/tournament-details"
import { useAuth } from "@/contexts/auth-context"
import { useRouter, useParams } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function TournamentDetailsPage() {
  const { token, loading: authLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const [loading, setLoading] = useState(true)

  const tournamentId = params?.id as string

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
      <TournamentDetails tournamentId={tournamentId} />
    </div>
  )
}

