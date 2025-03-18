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

    // Проверка, что пользователь сидит за этим столом
    const { data: playerData, error: playerError } = await supabase
      .from("table_players")
      .select("id, chips")
      .eq("table_id", tableId)
      .eq("user_id", session.user.id)
      .single()

    if (playerError) {
      if (playerError.code === "PGRST116") {
        return NextResponse.json({ error: "You are not at this table" }, { status: 404 })
      }
      console.error("Error checking player existence:", playerError)
      return NextResponse.json({ error: "Failed to check player existence" }, { status: 500 })
    }

    // Начало транзакции
    const { error: transactionError } = await supabase.rpc("leave_table", {
      p_user_id: session.user.id,
      p_table_id: tableId,
    })

    if (transactionError) {
      console.error("Error leaving table:", transactionError)
      return NextResponse.json({ error: "Failed to leave table" }, { status: 500 })
    }

    return NextResponse.json({ success: true, chipsReturned: playerData.chips })
  } catch (error) {
    console.error("Leave table API error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

