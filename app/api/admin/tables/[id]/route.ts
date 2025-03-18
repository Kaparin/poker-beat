import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Инициализация Supabase клиента
const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const body = await request.json()

    // Проверяем, что обновляются только разрешенные поля
    const allowedFields = ["name", "game_type", "stakes", "min_buy_in", "max_buy_in", "max_players", "status"]
    const updateData: Record<string, any> = {}

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    // Добавляем дату обновления
    updateData.updated_at = new Date().toISOString()

    const { data, error } = await supabase.from("tables").update(updateData).eq("id", id).select().single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error("Ошибка обновления стола:", error)
    return NextResponse.json({ message: "Внутренняя ошибка сервера" }, { status: 500 })
  }
}

