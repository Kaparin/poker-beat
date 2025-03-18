import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Инициализация Supabase клиента
const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    // Обновляем статус пользователя на "active"
    const { data: user, error: updateError } = await supabase
      .from("users")
      .update({ status: "active" })
      .eq("id", id)
      .select()
      .single()

    if (updateError) throw updateError

    // Записываем информацию о разблокировке в журнал безопасности
    const { error: logError } = await supabase.from("security_logs").insert({
      user_id: id,
      action: "user_unbanned",
      ip_address: request.headers.get("x-forwarded-for") || "unknown",
    })

    if (logError) throw logError

    return NextResponse.json({ message: "Пользователь разблокирован" })
  } catch (error) {
    console.error("Ошибка разблокировки пользователя:", error)
    return NextResponse.json({ message: "Внутренняя ошибка сервера" }, { status: 500 })
  }
}

