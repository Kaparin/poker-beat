import { NextResponse } from "next/server"
import { supabase } from "@/lib/api-client"
import { auth } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    // Проверка аутентификации
    const session = await auth()
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Получение данных из запроса
    const body = await request.json()
    const { username } = body

    if (!username || username.trim() === "") {
      return NextResponse.json({ error: "Username cannot be empty" }, { status: 400 })
    }

    // Проверка длины имени пользователя
    if (username.length < 3 || username.length > 20) {
      return NextResponse.json({ error: "Username must be between 3 and 20 characters" }, { status: 400 })
    }

    // Проверка, что имя пользователя содержит только допустимые символы
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return NextResponse.json(
        { error: "Username can only contain letters, numbers, and underscores" },
        { status: 400 },
      )
    }

    // Проверка, что имя пользователя не занято
    const { data: existingUser, error: existingUserError } = await supabase
      .from("users")
      .select("id")
      .eq("username", username)
      .neq("id", session.user.id)

    if (existingUserError) {
      console.error("Error checking username availability:", existingUserError)
      return NextResponse.json({ error: "Failed to check username availability" }, { status: 500 })
    }

    if (existingUser.length > 0) {
      return NextResponse.json({ error: "Username is already taken" }, { status: 400 })
    }

    // Обновление имени пользователя
    const { data, error } = await supabase
      .from("users")
      .update({ username })
      .eq("id", session.user.id)
      .select("username")
      .single()

    if (error) {
      console.error("Error updating username:", error)
      return NextResponse.json({ error: "Failed to update username" }, { status: 500 })
    }

    return NextResponse.json({ success: true, username: data.username })
  } catch (error) {
    console.error("Update username API error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

