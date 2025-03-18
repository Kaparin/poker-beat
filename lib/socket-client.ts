import { io, type Socket } from "socket.io-client"

// Типы для событий сокета
export interface TableState {
  id: string
  name: string
  gameType: string
  blinds: string
  players: Player[]
  currentGame: Game | null
  spectators: number
}

export interface Player {
  id: string
  userId: string
  username: string
  avatarUrl: string | null
  seatNumber: number
  chips: number
  status: string
  cards?: string[]
  bet?: number
  isDealer?: boolean
  isSmallBlind?: boolean
  isBigBlind?: boolean
  isCurrentPlayer?: boolean
  lastAction?: string
}

export interface Game {
  id: string
  status: string
  stage: string
  potSize: number
  communityCards: string[]
  currentBet: number
  currentPlayerId: string | null
  dealerPosition: number
  smallBlindPosition: number
  bigBlindPosition: number
  lastAction: string | null
  lastActionPlayerId: string | null
  timebank: number
}

export interface ChatMessage {
  id: string
  userId: string
  username: string
  avatarUrl: string | null
  message: string
  createdAt: string
}

export interface GameAction {
  type: "fold" | "check" | "call" | "bet" | "raise" | "all-in"
  amount?: number
}

// Класс для работы с сокетами
export class SocketClient {
  private socket: Socket | null = null
  private tableId: string | null = null
  private userId: string | null = null
  private token: string | null = null

  // Обработчики событий
  private tableStateHandler: ((state: TableState) => void) | null = null
  private chatMessageHandler: ((message: ChatMessage) => void) | null = null
  private errorHandler: ((error: string) => void) | null = null
  private connectionStatusHandler: ((status: boolean) => void) | null = null

  constructor() {
    // Инициализация сокета при создании экземпляра класса
    this.initSocket()
  }

  // Инициализация сокета
  private initSocket() {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001"

    this.socket = io(socketUrl, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    // Обработчики системных событий
    this.socket.on("connect", () => {
      console.log("Socket connected")
      if (this.connectionStatusHandler) {
        this.connectionStatusHandler(true)
      }

      // Если есть сохраненные данные, присоединяемся к столу
      if (this.tableId && this.userId && this.token) {
        this.joinTable(this.tableId, this.userId, this.token)
      }
    })

    this.socket.on("disconnect", () => {
      console.log("Socket disconnected")
      if (this.connectionStatusHandler) {
        this.connectionStatusHandler(false)
      }
    })

    this.socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error)
      if (this.errorHandler) {
        this.errorHandler("Connection error")
      }
    })

    // Обработчики игровых событий
    this.socket.on("table:state", (state: TableState) => {
      if (this.tableStateHandler) {
        this.tableStateHandler(state)
      }
    })

    this.socket.on("table:chat", (message: ChatMessage) => {
      if (this.chatMessageHandler) {
        this.chatMessageHandler(message)
      }
    })

    this.socket.on("table:error", (error: string) => {
      console.error("Table error:", error)
      if (this.errorHandler) {
        this.errorHandler(error)
      }
    })
  }

  // Подключение к сокету
  connect() {
    if (this.socket && !this.socket.connected) {
      this.socket.connect()
    }
  }

  // Отключение от сокета
  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
    }
  }

  // Присоединение к столу
  joinTable(tableId: string, userId: string, token: string) {
    if (!this.socket) {
      return
    }

    this.tableId = tableId
    this.userId = userId
    this.token = token

    if (!this.socket.connected) {
      this.connect()
      return
    }

    this.socket.emit("table:join", { tableId, userId, token })
  }

  // Покидание стола
  leaveTable() {
    if (!this.socket || !this.tableId) {
      return
    }

    this.socket.emit("table:leave", { tableId: this.tableId })
    this.tableId = null
  }

  // Отправка игрового действия
  sendAction(action: GameAction) {
    if (!this.socket || !this.tableId) {
      return
    }

    this.socket.emit("table:action", { tableId: this.tableId, action })
  }

  // Отправка сообщения в чат
  sendChatMessage(message: string) {
    if (!this.socket || !this.tableId) {
      return
    }

    this.socket.emit("table:chat", { tableId: this.tableId, message })
  }

  // Установка обработчика состояния стола
  onTableState(handler: (state: TableState) => void) {
    this.tableStateHandler = handler
  }

  // Установка обработчика сообщений чата
  onChatMessage(handler: (message: ChatMessage) => void) {
    this.chatMessageHandler = handler
  }

  // Установка обработчика ошибок
  onError(handler: (error: string) => void) {
    this.errorHandler = handler
  }

  // Установка обработчика статуса соединения
  onConnectionStatus(handler: (status: boolean) => void) {
    this.connectionStatusHandler = handler
  }
}

// Создание и экспорт экземпляра клиента
export const socketClient = new SocketClient()

