import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Инициализация Supabase клиента
const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET(request: Request) {
  try {
    const { data: tables, error } = await supabase.from("tables").select("*").order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json(tables)
  } catch (error) {
    console.error("Ошибка получения столов:", error)
    return NextResponse.json({ message: "Внутренняя ошибка сервера" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Проверяем обязательные поля
    const requiredFields = ["name", "game_type", "stakes", "min_buy_in", "max_buy_in", "max_players"]
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({ message: `Поле ${field} обязательно` }, { status: 400 })
      }
    }

    // Создаем новый стол
    const { data, error } = await supabase
      .from("tables")
      .insert({
        name: body.name,
        game_type: body.game_type,
        stakes: body.stakes,
        min_buy_in: body.min_buy_in,
        max_buy_in: body.max_buy_in,
        max_players: body.max_players,
        status: "active",
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error("Ошибка создания стола:", error)
    return NextResponse.json({ message: "Внутренняя ошибка сервера" }, { status: 500 })
  }
}

