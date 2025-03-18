import { NextResponse } from "next/server"
import { supabase } from "@/lib/api-client"
import { auth } from "@/lib/auth"

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    // Проверка аутентификации
    const session = await auth()
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const tableId = params.id

    // Проверка существования стола
    const { data: tableData, error: tableError } = await supabase
      .from("tables")
      .select("id, status")
      .eq("id", tableId)
      .single()

    if (tableError) {
      if (tableError.code === "PGRST116") {
        return NextResponse.json({ error: "Table not found" }, { status: 404 })
      }
      console.error("Error checking table existence:", tableError)
      return NextResponse.json({ error: "Failed to check table existence" }, { status: 500 })
    }

    // Проверка статуса стола
    if (tableData.status !== "ACTIVE") {
      return NextResponse.json({ error: "Table is not active" }, { status: 400 })
    }

    // Проверка, что пользователь уже не наблюдает за этим столом
    const { data: spectatorData, error: spectatorError } = await supabase
      .from("table_spectators")
      .select("id")
      .eq("table_id", tableId)
      .eq("user_id", session.user.id)

    if (spectatorError) {
      console.error("Error checking spectator existence:", spectatorError)
      return NextResponse.json({ error: "Failed to check spectator existence" }, { status: 500 })
    }

    if (spectatorData.length > 0) {
      return NextResponse.json({ error: "You are already spectating this table" }, { status: 400 })
    }

    // Добавление наблюдателя
    const { data, error } = await supabase
      .from("table_spectators")
      .insert({
        table_id: tableId,
        user_id: session.user.id,
      })
      .select()
      .single()

    if (error) {
      console.error("Error adding spectator:", error)
      return NextResponse.json({ error: "Failed to add spectator" }, { status: 500 })
    }

    return NextResponse.json({ success: true, spectatorId: data.id })
  } catch (error) {
    console.error("Spectate table API error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    // Проверка аутентификации
    const session = await auth()
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const tableId = params.id

    // Проверка существования стола
    const { data: tableData, error: tableError } = await supabase.from("tables").select("id").eq("id", tableId).single()

    if (tableError) {
      if (tableError.code === "PGRST116") {
        return NextResponse.json({ error: "Table not found" }, { status: 404 })
      }
      console.error("Error checking table existence:", tableError)
      return NextResponse.json({ error: "Failed to check table existence" }, { status: 500 })
    }

    // Проверка, что пользователь наблюдает за этим столом
    const { data: spectatorData, error: spectatorError } = await supabase
      .from("table_spectators")
      .select("id")
      .eq("table_id", tableId)
      .eq("user_id", session.user.id)

    if (spectatorError) {
      console.error("Error checking spectator existence:", spectatorError)
      return NextResponse.json({ error: "Failed to check spectator existence" }, { status: 500 })
    }

    if (spectatorData.length === 0) {
      return NextResponse.json({ error: "You are not spectating this table" }, { status: 400 })
    }

    // Удаление наблюдателя
    const { error } = await supabase
      .from("table_spectators")
      .delete()
      .eq("table_id", tableId)
      .eq("user_id", session.user.id)

    if (error) {
      console.error("Error removing spectator:", error)
      return NextResponse.json({ error: "Failed to remove spectator" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Stop spectating table API error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

