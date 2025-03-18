import { NextResponse } from "next/server"
import { getRedisClient } from "@/lib/redis"
import { supabase } from "@/lib/db-schema"

export async function GET() {
  try {
    // Проверка базы данных
    const dbStartTime = performance.now()
    const { count, error: dbError } = await supabase.from("users").select("*", { count: "exact", head: true })

    const dbEndTime = performance.now()
    const dbLatency = dbEndTime - dbStartTime

    const dbStatus = dbError ? "down" : "up"

    // Проверка Redis
    const redisStartTime = performance.now()
    const redis = getRedisClient()
    let redisStatus = "down"
    let redisLatency = 0

    try {
      await redis.ping()
      redisStatus = "up"
      const redisEndTime = performance.now()
      redisLatency = redisEndTime - redisStartTime
    } catch (redisError) {
      console.error("Redis health check failed:", redisError)
    }

    // Определяем общий статус
    const checks = {
      database: { status: dbStatus as "up" | "down", latency: dbLatency },
      redis: { status: redisStatus as "up" | "down", latency: redisLatency },
    }

    const allUp = Object.values(checks).every((check) => check.status === "up")
    const allDown = Object.values(checks).every((check) => check.status === "down")

    let status: "healthy" | "degraded" | "unhealthy"

    if (allUp) {
      status = "healthy"
    } else if (allDown) {
      status = "unhealthy"
    } else {
      status = "degraded"
    }

    // Возвращаем статус с кодом 200, если хотя бы один сервис работает
    // или с кодом 503, если все сервисы не работают
    return NextResponse.json({ status, checks }, { status: status === "unhealthy" ? 503 : 200 })
  } catch (error) {
    console.error("Health check error:", error)

    return NextResponse.json(
      {
        status: "unhealthy",
        checks: {
          database: { status: "down" },
          redis: { status: "down" },
        },
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 503 },
    )
  }
}

