import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Инициализация Supabase клиента
const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const { reason } = await request.json()

    // Обновляем статус пользователя на "banned"
    const { data: user, error: updateError } = await supabase
      .from("users")
      .update({ status: "banned" })
      .eq("id", id)
      .select()
      .single()

    if (updateError) throw updateError

    // Записываем информацию о блокировке в журнал безопасности
    const { error: logError } = await supabase.from("security_logs").insert({
      user_id: id,
      action: "user_banned",
      details: { reason },
      ip_address: request.headers.get("x-forwarded-for") || "unknown",
    })

    if (logError) throw logError

    return NextResponse.json({ message: "Пользователь заблокирован" })
  } catch (error) {
    console.error("Ошибка блокировки пользователя:", error)
    return NextResponse.json({ message: "Внутренняя ошибка сервера" }, { status: 500 })
  }
}

