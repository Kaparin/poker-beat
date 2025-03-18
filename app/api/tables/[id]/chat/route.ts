import { NextResponse } from "next/server"
import { supabase } from "@/lib/api-client"
import { auth } from "@/lib/auth"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const tableId = params.id

    // Получение параметров запроса
    const url = new URL(request.url)
    const limit = Number.parseInt(url.searchParams.get("limit") || "50")
    const before = url.searchParams.get("before")

    // Проверка существования стола
    const { data: tableData, error: tableError } = await supabase.from("tables").select("id").eq("id", tableId).single()

    if (tableError) {
      if (tableError.code === "PGRST116") {
        return NextResponse.json({ error: "Table not found" }, { status: 404 })
      }
      console.error("Error checking table existence:", tableError)
      return NextResponse.json({ error: "Failed to check table existence" }, { status: 500 })
    }

    // Базовый запрос
    let query = supabase
      .from("table_chat")
      .select(`
        id,
        user_id,
        users:user_id (username, avatar_url),
        message,
        created_at
      `)
      .eq("table_id", tableId)
      .order("created_at", { ascending: false })
      .limit(limit)

    // Добавление фильтра по времени, если указан
    if (before) {
      query = query.lt("created_at", before)
    }

    // Выполнение запроса
    const { data, error } = await query

    if (error) {
      console.error("Error fetching chat messages:", error)
      return NextResponse.json({ error: "Failed to fetch chat messages" }, { status: 500 })
    }

    // Преобразование данных в нужный формат
    const messages = data.map((message) => ({
      id: message.id,
      userId: message.user_id,
      username: message.users?.username || "Unknown",
      avatarUrl: message.users?.avatar_url || null,
      message: message.message,
      createdAt: message.created_at,
    }))

    return NextResponse.json(messages)
  } catch (error) {
    console.error("Table chat API error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    // Проверка аутентификации
    const session = await auth()
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const tableId = params.id

    // Получение данных из запроса
    const body = await request.json()
    const { message } = body

    if (!message || message.trim() === "") {
      return NextResponse.json({ error: "Message cannot be empty" }, { status: 400 })
    }

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

    // Добавление сообщения
    const { data, error } = await supabase
      .from("table_chat")
      .insert({
        table_id: tableId,
        user_id: session.user.id,
        message: message.trim(),
      })
      .select(`
        id,
        user_id,
        message,
        created_at
      `)
      .single()

    if (error) {
      console.error("Error adding chat message:", error)
      return NextResponse.json({ error: "Failed to add chat message" }, { status: 500 })
    }

    // Получение данных пользователя
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("username, avatar_url")
      .eq("id", session.user.id)
      .single()

    if (userError) {
      console.error("Error fetching user data:", userError)
      return NextResponse.json({ error: "Failed to fetch user data" }, { status: 500 })
    }

    // Преобразование данных в нужный формат
    const chatMessage = {
      id: data.id,
      userId: data.user_id,
      username: userData.username,
      avatarUrl: userData.avatar_url,
      message: data.message,
      createdAt: data.created_at,
    }

    return NextResponse.json(chatMessage, { status: 201 })
  } catch (error) {
    console.error("Table chat API error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

