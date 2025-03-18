import express from "express"
import http from "http"
import { Server } from "socket.io"
import cors from "cors"
import jwt from "jsonwebtoken"
import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"

// Загрузка переменных окружения
dotenv.config()

// Инициализация Supabase клиента
const supabaseUrl = process.env.SUPABASE_URL || ""
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || ""
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Настройка Express
const app = express()
app.use(cors())
app.use(express.json())

// Создание HTTP сервера
const server = http.createServer(app)

// Настройка Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
})

// Middleware для проверки аутентификации
const authenticateSocket = (socket: any, next: any) => {
  const token = socket.handshake.auth.token

  if (!token) {
    return next(new Error("Authentication error"))
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "")
    socket.user = decoded
    next()
  } catch (error) {
    next(new Error("Authentication error"))
  }
}

// Применение middleware
io.use(authenticateSocket)

// Обработка подключений
io.on("connection", (socket) => {
  console.log("User connected:", socket.id)

  // Присоединение к столу
  socket.on("table:join", async ({ tableId, userId }) => {
    try {
      // Проверка существования стола
      const { data: tableData, error: tableError } = await supabase
        .from("tables")
        .select("id, status")
        .eq("id", tableId)
        .single()

      if (tableError || !tableData) {
        socket.emit("table:error", "Table not found")
        return
      }

      if (tableData.status !== "ACTIVE") {
        socket.emit("table:error", "Table is not active")
        return
      }

      // Проверка, что пользователь сидит за столом или наблюдает
      const { data: playerData, error: playerError } = await supabase
        .from("table_players")
        .select("id")
        .eq("table_id", tableId)
        .eq("user_id", userId)

      const { data: spectatorData, error: spectatorError } = await supabase
        .from("table_spectators")
        .select("id")
        .eq("table_id", tableId)
        .eq("user_id", userId)

      if ((playerError || playerData.length === 0) && (spectatorError || spectatorData.length === 0)) {
        socket.emit("table:error", "You are not at this table")
        return
      }

      // Присоединение к комнате стола
      socket.join(`table:${tableId}`)

      // Отправка текущего состояния стола
      const tableState = await getTableState(tableId)
      socket.emit("table:state", tableState)

      console.log(`User ${userId} joined table ${tableId}`)
    } catch (error) {
      console.error("Error joining table:", error)
      socket.emit("table:error", "Failed to join table")
    }
  })

  // Покидание стола
  socket.on("table:leave", ({ tableId }) => {
    socket.leave(`table:${tableId}`)
    console.log(`User left table ${tableId}`)
  })

  // Игровое действие
  socket.on("table:action", async ({ tableId, action }) => {
    try {
      const userId = socket.user.sub

      // Проверка существования стола
      const { data: tableData, error: tableError } = await supabase
        .from("tables")
        .select("id, status")
        .eq("id", tableId)
        .single()

      if (tableError || !tableData) {
        socket.emit("table:error", "Table not found")
        return
      }

      if (tableData.status !== "ACTIVE") {
        socket.emit("table:error", "Table is not active")
        return
      }

      // Проверка, что пользователь сидит за столом
      const { data: playerData, error: playerError } = await supabase
        .from("table_players")
        .select("id")
        .eq("table_id", tableId)
        .eq("user_id", userId)

      if (playerError || playerData.length === 0) {
        socket.emit("table:error", "You are not playing at this table")
        return
      }

      // Получение текущей игры
      const { data: gameData, error: gameError } = await supabase
        .from("games")
        .select("id, current_player_id, status")
        .eq("table_id", tableId)
        .eq("status", "ACTIVE")
        .single()

      if (gameError || !gameData) {
        socket.emit("table:error", "No active game at this table")
        return
      }

      if (gameData.status !== "ACTIVE") {
        socket.emit("table:error", "Game is not active")
        return
      }

      if (gameData.current_player_id !== userId) {
        socket.emit("table:error", "It is not your turn")
        return
      }

      // Обработка действия
      const result = await processGameAction(gameData.id, userId, action)

      if (!result.success) {
        socket.emit("table:error", result.error || "Failed to process action")
        return
      }

      // Отправка обновленного состояния стола всем игрокам
      const tableState = await getTableState(tableId)
      io.to(`table:${tableId}`).emit("table:state", tableState)

      console.log(`User ${userId} performed action ${action.type} at table ${tableId}`)
    } catch (error) {
      console.error("Error processing action:", error)
      socket.emit("table:error", "Failed to process action")
    }
  })

  // Сообщение в чат
  socket.on("table:chat", async ({ tableId, message }) => {
    try {
      const userId = socket.user.sub

      // Проверка существования стола
      const { data: tableData, error: tableError } = await supabase
        .from("tables")
        .select("id, status")
        .eq("id", tableId)
        .single()

      if (tableError || !tableData) {
        socket.emit("table:error", "Table not found")
        return
      }

      // Проверка, что пользователь сидит за столом или наблюдает
      const { data: playerData, error: playerError } = await supabase
        .from("table_players")
        .select("id")
        .eq("table_id", tableId)
        .eq("user_id", userId)

      const { data: spectatorData, error: spectatorError } = await supabase
        .from("table_spectators")
        .select("id")
        .eq("table_id", tableId)
        .eq("user_id", userId)

      if ((playerError || playerData.length === 0) && (spectatorError || spectatorData.length === 0)) {
        socket.emit("table:error", "You are not at this table")
        return
      }

      // Добавление сообщения в базу данных
      const { data, error } = await supabase
        .from("table_chat")
        .insert({
          table_id: tableId,
          user_id: userId,
          message: message.trim(),
        })
        .select("id, created_at")
        .single()

      if (error) {
        console.error("Error adding chat message:", error)
        socket.emit("table:error", "Failed to send message")
        return
      }

      // Получение данных пользователя
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("username, avatar_url")
        .eq("id", userId)
        .single()

      if (userError) {
        console.error("Error fetching user data:", userError)
        socket.emit("table:error", "Failed to send message")
        return
      }

      // Формирование сообщения
      const chatMessage = {
        id: data.id,
        userId,
        username: userData.username,
        avatarUrl: userData.avatar_url,
        message: message.trim(),
        createdAt: data.created_at,
      }

      // Отправка сообщения всем игрокам за столом
      io.to(`table:${tableId}`).emit("table:chat", chatMessage)

      console.log(`User ${userId} sent message to table ${tableId}`)
    } catch (error) {
      console.error("Error sending chat message:", error)
      socket.emit("table:error", "Failed to send message")
    }
  })

  // Отключение
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id)
  })
})

// Функция для получения состояния стола
async function getTableState(tableId: string) {
  try {
    // Получение данных стола
    const { data: tableData, error: tableError } = await supabase
      .from("tables")
      .select(`
        id,
        name,
        game_type,
        blinds,
        min_players,
        max_players,
        current_players,
        status,
        created_at,
        updated_at
      `)
      .eq("id", tableId)
      .single()

    if (tableError) {
      throw new Error("Failed to fetch table data")
    }

    // Получение игроков за столом
    const { data: playersData, error: playersError } = await supabase
      .from("table_players")
      .select(`
        id,
        user_id,
        users:user_id (id, username, avatar_url),
        seat_number,
        chips,
        status,
        joined_at,
        cards,
        current_bet
      `)
      .eq("table_id", tableId)

    if (playersError) {
      throw new Error("Failed to fetch table players")
    }

    // Получение текущей игры за столом
    const { data: gameData, error: gameError } = await supabase
      .from("games")
      .select(`
        id,
        status,
        stage,
        pot_size,
        community_cards,
        current_bet,
        current_player_id,
        dealer_position,
        small_blind_position,
        big_blind_position,
        last_action,
        last_action_player_id,
        timebank,
        created_at,
        updated_at
      `)
      .eq("table_id", tableId)
      .eq("status", "ACTIVE")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    // Получение количества наблюдателей
    const { count: spectatorsCount, error: spectatorsError } = await supabase
      .from("table_spectators")
      .select("id", { count: "exact", head: true })
      .eq("table_id", tableId)

    if (spectatorsError) {
      throw new Error("Failed to count spectators")
    }

    // Преобразование данных игроков
    const players = playersData.map((player) => {
      const isDealer = gameData && gameData.dealer_position === player.seat_number
      const isSmallBlind = gameData && gameData.small_blind_position === player.seat_number
      const isBigBlind = gameData && gameData.big_blind_position === player.seat_number
      const isCurrentPlayer = gameData && gameData.current_player_id === player.user_id

      return {
        id: player.id,
        userId: player.user_id,
        username: player.users?.username || "Unknown",
        avatarUrl: player.users?.avatar_url || null,
        seatNumber: player.seat_number,
        chips: player.chips,
        status: player.status,
        cards: player.cards,
        bet: player.current_bet,
        isDealer,
        isSmallBlind,
        isBigBlind,
        isCurrentPlayer,
        lastAction: player.user_id === gameData?.last_action_player_id ? gameData?.last_action : null,
      }
    })

    // Преобразование данных игры
    const game = gameData
      ? {
          id: gameData.id,
          status: gameData.status,
          stage: gameData.stage,
          potSize: gameData.pot_size,
          communityCards: gameData.community_cards,
          currentBet: gameData.current_bet,
          currentPlayerId: gameData.current_player_id,
          dealerPosition: gameData.dealer_position,
          smallBlindPosition: gameData.small_blind_position,
          bigBlindPosition: gameData.big_blind_position,
          lastAction: gameData.last_action,
          lastActionPlayerId: gameData.last_action_player_id,
          timebank: gameData.timebank,
          createdAt: gameData.created_at,
          updatedAt: gameData.updated_at,
        }
      : null

    // Формирование ответа
    return {
      id: tableData.id,
      name: tableData.name,
      gameType: tableData.game_type,
      blinds: tableData.blinds,
      players,
      currentGame: game,
      spectators: spectatorsCount,
    }
  } catch (error) {
    console.error("Error getting table state:", error)
    throw error
  }
}

// Функция для обработки игрового действия
async function processGameAction(gameId: string, userId: string, action: any) {
  try {
    // Вызов хранимой процедуры для обработки действия
    const { data, error } = await supabase.rpc("process_game_action", {
      p_game_id: gameId,
      p_user_id: userId,
      p_action_type: action.type,
      p_amount: action.amount || 0,
    })

    if (error) {
      console.error("Error processing game action:", error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Error processing game action:", error)
    return { success: false, error: "Internal server error" }
  }
}

// Настройка админского API
app.use("/admin", (req, res, next) => {
  const username = req.headers["x-admin-user"] as string
  const password = req.headers["x-admin-password"] as string

  if (username !== process.env.SOCKET_ADMIN_USER || password !== process.env.SOCKET_ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Unauthorized" })
  }

  next()
})

// Получение списка активных столов
app.get("/admin/tables", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("tables")
      .select("id, name, game_type, blinds, current_players, status")
      .eq("status", "ACTIVE")

    if (error) {
      throw error
    }

    res.json(data)
  } catch (error) {
    console.error("Error fetching tables:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

// Получение списка подключенных клиентов
app.get("/admin/clients", (req, res) => {
  const clients = Array.from(io.sockets.sockets.values()).map((socket) => ({
    id: socket.id,
    userId: socket.user?.sub,
    rooms: Array.from(socket.rooms),
    connected: socket.connected,
  }))

  res.json(clients)
})

// Запуск сервера
const PORT = process.env.PORT || 3001
server.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`)
})

