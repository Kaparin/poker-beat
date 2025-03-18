import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { supabase } from "@/lib/db-schema"
import { withErrorHandler } from "@/lib/error-handler"
import { withRateLimit } from "@/lib/rate-limiter"
import { withPerformanceMonitoring } from "@/lib/monitoring"
import { ForbiddenError, NotFoundError, ValidationError } from "@/lib/error-handler"
import { logSecurityEvent } from "@/lib/db-schema"

// Обработчик GET запроса для получения списка заблокированных пользователей
async function handleGet(request: Request) {
  // Проверка аутентификации и прав доступа
  const session = await auth()

  if (!session || !session.user.isAdmin) {
    throw new ForbiddenError()
  }

  // Получаем параметры запроса
  const url = new URL(request.url)
  const page = Number.parseInt(url.searchParams.get("page") || "1")
  const limit = Number.parseInt(url.searchParams.get("limit") || "20")

  // Проверяем валидность параметров
  if (page < 1 || limit < 1 || limit > 100) {
    return NextResponse.json({ error: "Некорректные параметры пагинации" }, { status: 400 })
  }

  // Вычисляем смещение
  const offset = (page - 1) * limit

  // Получаем заблокированных пользователей
  const { data, count, error } = await supabase
    .from("users")
    .select("*", { count: "exact" })
    .eq("status", "banned")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error("Error fetching banned users:", error)
    throw new Error("Ошибка при получении списка заблокированных пользователей")
  }

  // Возвращаем результаты
  return NextResponse.json({
    users: data || [],
    total: count || 0,
    page,
    limit,
  })
}

// Обработчик POST запроса для блокировки пользователя
async function handlePost(request: Request) {
  // Проверка аутентификации и прав доступа
  const session = await auth()

  if (!session || !session.user.isAdmin) {
    throw new ForbiddenError()
  }

  // Получаем данные запроса
  const { userId, reason } = await request.json()

  if (!userId) {
    throw new ValidationError("Ошибка валидации", {
      userId: "Идентификатор пользователя обязателен",
    })
  }

  // Проверяем, существует ли пользователь
  const { data: user, error: userError } = await supabase.from("users").select("*").eq("id", userId).single()

  if (userError || !user) {
    throw new NotFoundError("Пользователь не найден")
  }

  // Проверяем, не заблокирован ли пользователь уже
  if (user.status === "banned") {
    return NextResponse.json({
      message: "Пользователь уже заблокирован",
    })
  }

  // Блокируем пользователя
  const { error: updateError } = await supabase.from("users").update({ status: "banned" }).eq("id", userId)

  if (updateError) {
    console.error("Error banning user:", updateError)
    throw new Error("Ошибка при блокировке пользователя")
  }

  // Логируем событие блокировки
  await logSecurityEvent({
    action: "user_banned",
    user_id: userId,
    details: {
      admin_id: session.user.id,
      reason: reason || "Не указана",
    },
  })

  return NextResponse.json({
    message: "Пользователь успешно заблокирован",
  })
}

// Обработчик DELETE запроса для разблокировки пользователя
async function handleDelete(request: Request) {
  // Проверка аутентификации и прав доступа
  const session = await auth()

  if (!session || !session.user.isAdmin) {
    throw new ForbiddenError()
  }

  // Получаем идентификатор пользователя из URL
  const url = new URL(request.url)
  const userId = url.searchParams.get("userId")

  if (!userId) {
    throw new ValidationError("Ошибка валидации", {
      userId: "Идентификатор пользователя обязателен",
    })
  }

  // Проверяем, существует ли пользователь
  const { data: user, error: userError } = await supabase.from("users").select("*").eq("id", userId).single()

  if (userError || !user) {
    throw new NotFoundError("Пользователь не найден")
  }

  // Проверяем, заблокирован ли пользователь
  if (user.status !== "banned") {
    return NextResponse.json({
      message: "Пользователь не заблокирован",
    })
  }

  // Разблокируем пользователя
  const { error: updateError } = await supabase.from("users").update({ status: "active" }).eq("id", userId)

  if (updateError) {
    console.error("Error unbanning user:", updateError)
    throw new Error("Ошибка при разблокировке пользователя")
  }

  // Логируем событие разблокировки
  await logSecurityEvent({
    action: "user_unbanned",
    user_id: userId,
    details: {
      admin_id: session.user.id,
    },
  })

  return NextResponse.json({
    message: "Пользователь успешно разблокирован",
  })
}

// Оборачиваем обработчики в middleware
export const GET = withErrorHandler(withRateLimit(withPerformanceMonitoring(handleGet), "admin"))

export const POST = withErrorHandler(withRateLimit(withPerformanceMonitoring(handlePost), "admin"))

export const DELETE = withErrorHandler(withRateLimit(withPerformanceMonitoring(handleDelete), "admin"))

