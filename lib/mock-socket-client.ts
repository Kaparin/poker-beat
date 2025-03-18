import type { PlayerAction, TableInfo } from "@/types/poker"

// Mock implementation of socket client for development
class MockSocketClient {
  private static instance: MockSocketClient
  private eventHandlers: Record<string, Function[]> = {}
  private connected = false
  private mockTables: TableInfo[] = []
  private mockGameStates: Record<string, any> = {}
  private localStorageKey = "poker_beat_mock_tables"

  private constructor() {
    // Try to load tables from localStorage
    this.loadTablesFromStorage()

    // If no tables in storage, initialize with some mock tables
    if (this.mockTables.length === 0) {
      this.mockTables = [
        {
          id: "mock-table-1",
          name: "Beginner's Table",
          maxPlayers: 6,
          smallBlind: 5,
          bigBlind: 10,
          minBuyIn: 200,
          maxBuyIn: 1000,
          players: [
            { id: 1, name: "Player 1", chips: 500 },
            { id: 2, name: "Player 2", chips: 750 },
          ],
          activePlayers: 2,
          status: "playing",
        },
        {
          id: "mock-table-2",
          name: "High Rollers",
          maxPlayers: 9,
          smallBlind: 50,
          bigBlind: 100,
          minBuyIn: 2000,
          maxBuyIn: 10000,
          players: [
            { id: 3, name: "Player 3", chips: 5000 },
            { id: 4, name: "Player 4", chips: 7500 },
            { id: 5, name: "Player 5", chips: 3000 },
          ],
          activePlayers: 3,
          status: "playing",
        },
        {
          id: "mock-table-new",
          name: "Empty Table",
          maxPlayers: 6,
          smallBlind: 10,
          bigBlind: 20,
          minBuyIn: 400,
          maxBuyIn: 2000,
          players: [],
          activePlayers: 0,
          status: "waiting",
        },
      ]

      // Save initial tables to storage
      this.saveTablestoStorage()
    }

    // Initialize mock game states for each table
    this.mockTables.forEach((table) => {
      if (!this.mockGameStates[table.id]) {
        this.mockGameStates[table.id] = this.createMockGameState(table)
      }
    })
  }

  private loadTablesFromStorage() {
    if (typeof window !== "undefined") {
      try {
        const storedTables = localStorage.getItem(this.localStorageKey)
        if (storedTables) {
          this.mockTables = JSON.parse(storedTables)
          console.log("Loaded mock tables from storage:", this.mockTables)
        }
      } catch (error) {
        console.error("Error loading mock tables from storage:", error)
        this.mockTables = []
      }
    }
  }

  private saveTablestoStorage() {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(this.localStorageKey, JSON.stringify(this.mockTables))
      } catch (error) {
        console.error("Error saving mock tables to storage:", error)
      }
    }
  }

  private createMockGameState(table: TableInfo) {
    return {
      tableId: table.id,
      tableSettings: {
        id: table.id,
        name: table.name,
        maxPlayers: table.maxPlayers,
        smallBlind: table.smallBlind,
        bigBlind: table.bigBlind,
        minBuyIn: table.minBuyIn,
        maxBuyIn: table.maxBuyIn,
      },
      players: [
        {
          id: 12345678, // This should match the mock user ID
          name: "Demo User",
          avatarUrl: "/placeholder.svg?height=200&width=200",
          chips: 500,
          bet: 0,
          folded: false,
          cards: [
            { suit: "hearts", rank: "A" },
            { suit: "spades", rank: "K" },
          ],
          isAllIn: false,
          isDealer: true,
          isSmallBlind: false,
          isBigBlind: false,
          isActive: true,
          isTurn: true,
          seatIndex: 0,
        },
        {
          id: 2,
          name: "Player 2",
          chips: 750,
          bet: 10,
          folded: false,
          cards: [
            { suit: "diamonds", rank: "Q", faceDown: true },
            { suit: "clubs", rank: "J", faceDown: true },
          ],
          isAllIn: false,
          isDealer: false,
          isSmallBlind: true,
          isBigBlind: false,
          isActive: true,
          isTurn: false,
          seatIndex: 1,
        },
        {
          id: 3,
          name: "Player 3",
          chips: 490,
          bet: 20,
          folded: false,
          cards: [
            { suit: "clubs", rank: "10", faceDown: true },
            { suit: "hearts", rank: "9", faceDown: true },
          ],
          isAllIn: false,
          isDealer: false,
          isSmallBlind: false,
          isBigBlind: true,
          isActive: true,
          isTurn: false,
          seatIndex: 2,
        },
      ],
      communityCards: [
        { suit: "hearts", rank: "2" },
        { suit: "diamonds", rank: "7" },
        { suit: "spades", rank: "10" },
      ],
      pot: 30,
      sidePots: [],
      currentBet: 20,
      stage: "flop",
      activePlayerIndex: 0,
      dealerIndex: 0,
      lastRaiseIndex: -1,
      minRaise: 10,
      timeLeft: 30,
    }
  }

  public static getInstance(): MockSocketClient {
    if (!MockSocketClient.instance) {
      MockSocketClient.instance = new MockSocketClient()
    }
    return MockSocketClient.instance
  }

  public connect(url: string, options: any = {}): MockSocketClient {
    console.log("Mock socket connecting to:", url, options)
    this.connected = true

    // Simulate connection event
    setTimeout(() => {
      this.emit("connect")
    }, 100)

    return this
  }

  public disconnect(): void {
    console.log("Mock socket disconnecting")
    this.connected = false
    this.emit("disconnect", "io client disconnect")
  }

  public on(event: string, callback: Function): void {
    if (!this.eventHandlers[event]) {
      this.eventHandlers[event] = []
    }
    this.eventHandlers[event].push(callback)
  }

  public once(event: string, callback: Function): void {
    const wrappedCallback = (...args: any[]) => {
      this.off(event, wrappedCallback)
      callback(...args)
    }
    this.on(event, wrappedCallback)
  }

  public off(event: string, callback?: Function): void {
    if (!callback) {
      delete this.eventHandlers[event]
      return
    }

    if (this.eventHandlers[event]) {
      this.eventHandlers[event] = this.eventHandlers[event].filter((handler) => handler !== callback)
    }
  }

  public emit(event: string, ...args: any[]): void {
    if (this.eventHandlers[event]) {
      this.eventHandlers[event].forEach((callback) => {
        callback(...args)
      })
    }

    // Mock server responses based on emitted events
    this.mockServerResponse(event, ...args)
  }

  private mockServerResponse(event: string, ...args: any[]): void {
    switch (event) {
      case "getTables":
        setTimeout(() => {
          this.emit("tableList", this.mockTables)
        }, 300)
        break

      case "joinTable":
        setTimeout(() => {
          const { tableId } = args[0]
          const table = this.mockTables.find((t) => t.id === tableId)

          if (table) {
            // Add mock user to the table
            if (!table.players.some((p) => p.id === 12345678)) {
              table.players.push({
                id: 12345678,
                name: "Demo User",
                chips: 500,
              })
              table.activePlayers += 1
            }

            // Get the game state for this table
            const gameState = this.mockGameStates[tableId]

            // Make sure the user is in the game state
            if (!gameState.players.some((p) => p.id === 12345678)) {
              gameState.players.push({
                id: 12345678,
                name: "Demo User",
                avatarUrl: "/placeholder.svg?height=200&width=200",
                chips: 500,
                bet: 0,
                folded: false,
                cards: [
                  { suit: "hearts", rank: "A" },
                  { suit: "spades", rank: "K" },
                ],
                isAllIn: false,
                isDealer: false,
                isSmallBlind: false,
                isBigBlind: false,
                isActive: true,
                isTurn: false,
                seatIndex: gameState.players.length,
              })
            }

            // Save changes to storage
            this.saveTablestoStorage()

            this.emit("tableUpdate", table)
            this.emit("gameState", gameState)
          } else {
            this.emit("error", { message: "Table not found" })
          }
        }, 500)
        break

      case "leaveTable":
        setTimeout(() => {
          // Find the table with the user
          const tableWithUser = this.mockTables.find((t) => t.players.some((p) => p.id === 12345678))

          if (tableWithUser) {
            // Remove user from the table
            tableWithUser.players = tableWithUser.players.filter((p) => p.id !== 12345678)
            tableWithUser.activePlayers -= 1

            // Remove user from the game state
            const gameState = this.mockGameStates[tableWithUser.id]
            if (gameState) {
              gameState.players = gameState.players.filter((p) => p.id !== 12345678)
            }

            // Save changes to storage
            this.saveTablestoStorage()

            this.emit("tableUpdate", tableWithUser)
            this.emit("leaveTableSuccess")
          } else {
            this.emit("error", { message: "You are not at a table" })
          }
        }, 300)
        break

      case "playerAction":
        setTimeout(() => {
          const { action, amount } = args[0]
          console.log(`Mock player action: ${action}${amount ? ` ${amount}` : ""}`)

          // Find the table the user is at
          const tableWithUser = this.mockTables.find((t) => t.players.some((p) => p.id === 12345678))

          if (!tableWithUser) {
            this.emit("error", { message: "You are not at a table" })
            return
          }

          // Get the game state for this table
          const gameState = this.mockGameStates[tableWithUser.id]

          // Find the user in the game state
          const playerIndex = gameState.players.findIndex((p) => p.id === 12345678)

          if (playerIndex === -1) {
            this.emit("error", { message: "Player not found in game" })
            return
          }

          // Update mock game state based on action
          if (action === "fold") {
            gameState.players[playerIndex].folded = true
          } else if (action === "check") {
            // No change needed
          } else if (action === "call") {
            const callAmount = gameState.currentBet - gameState.players[playerIndex].bet
            gameState.players[playerIndex].chips -= callAmount
            gameState.players[playerIndex].bet = gameState.currentBet
            gameState.pot += callAmount
          } else if (action === "bet" || action === "raise") {
            const betAmount = amount || gameState.minRaise
            gameState.players[playerIndex].chips -= betAmount
            gameState.players[playerIndex].bet = betAmount
            gameState.currentBet = betAmount
            gameState.pot += betAmount
          }

          // Move turn to next player
          gameState.players[playerIndex].isTurn = false

          // Find next active player
          let nextPlayerIndex = (playerIndex + 1) % gameState.players.length
          while (gameState.players[nextPlayerIndex].folded || gameState.players[nextPlayerIndex].isAllIn) {
            nextPlayerIndex = (nextPlayerIndex + 1) % gameState.players.length
            // If we've gone all the way around, break to avoid infinite loop
            if (nextPlayerIndex === playerIndex) break
          }

          gameState.players[nextPlayerIndex].isTurn = true
          gameState.activePlayerIndex = nextPlayerIndex

          // Emit updated game state
          this.emit("gameState", gameState)
        }, 300)
        break

      case "getBetLimits":
        setTimeout(() => {
          // Find the table the user is at
          const tableWithUser = this.mockTables.find((t) => t.players.some((p) => p.id === 12345678))

          if (!tableWithUser) {
            this.emit("error", { message: "You are not at a table" })
            return
          }

          // Get the game state for this table
          const gameState = this.mockGameStates[tableWithUser.id]

          // Find the user in the game state
          const player = gameState.players.find((p) => p.id === 12345678)

          if (!player) {
            this.emit("error", { message: "Player not found in game" })
            return
          }

          this.emit("betLimits", {
            min: gameState.tableSettings.bigBlind,
            max: player.chips,
          })
        }, 200)
        break

      case "createTable":
        setTimeout(() => {
          const { name, maxPlayers, smallBlind, bigBlind, minBuyIn, maxBuyIn } = args[0]

          // Create a new mock table
          const newTableId = `mock-table-${Date.now()}`
          const newTable: TableInfo = {
            id: newTableId,
            name,
            maxPlayers,
            smallBlind,
            bigBlind,
            minBuyIn,
            maxBuyIn,
            players: [],
            activePlayers: 0,
            status: "waiting",
          }

          this.mockTables.push(newTable)

          // Create a game state for the new table
          this.mockGameStates[newTableId] = this.createMockGameState(newTable)

          // Save changes to storage
          this.saveTablestoStorage()

          console.log("Created new mock table:", newTable)

          this.emit("tableCreated", {
            tableId: newTableId,
            tableInfo: newTable,
          })
        }, 500)
        break
    }
  }

  public isConnected(): boolean {
    return this.connected
  }

  // Method to get a table by ID (for API routes)
  public getTableById(tableId: string): TableInfo | undefined {
    return this.mockTables.find((table) => table.id === tableId)
  }

  // Method to get all tables (for API routes)
  public getAllTables(): TableInfo[] {
    return this.mockTables
  }
}

// Export functions that mimic the real socket client API
let mockSocketInstance: MockSocketClient | null = null

export function getSocket(token: string): MockSocketClient {
  if (!mockSocketInstance) {
    mockSocketInstance = MockSocketClient.getInstance()
    mockSocketInstance.connect("mock://localhost", {
      auth: { token },
    })
  }
  return mockSocketInstance
}

export function joinTable(token: string, tableId: string, buyIn: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const socket = getSocket(token)

    socket.emit("joinTable", { tableId, buyIn })

    const successHandler = () => {
      socket.off("error", errorHandler)
      resolve()
    }

    const errorHandler = (error: any) => {
      socket.off("gameState", successHandler)
      reject(error)
    }

    socket.once("gameState", successHandler)
    socket.once("error", errorHandler)

    // Set a timeout to prevent hanging promises
    setTimeout(() => {
      socket.off("gameState", successHandler)
      socket.off("error", errorHandler)
      reject(new Error("Request timed out"))
    }, 5000)
  })
}

export function leaveTable(token: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const socket = getSocket(token)

    socket.emit("leaveTable")

    const successHandler = () => {
      socket.off("error", errorHandler)
      resolve()
    }

    const errorHandler = (error: any) => {
      socket.off("leaveTableSuccess", successHandler)
      reject(error)
    }

    socket.once("leaveTableSuccess", successHandler)
    socket.once("error", errorHandler)

    // Set a timeout to prevent hanging promises
    setTimeout(() => {
      socket.off("leaveTableSuccess", successHandler)
      socket.off("error", errorHandler)
      reject(new Error("Request timed out"))
    }, 5000)
  })
}

export function sendPlayerAction(token: string, action: PlayerAction, amount?: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const socket = getSocket(token)

    socket.emit("playerAction", { action, amount })

    // We don't wait for a response, as the game state will be updated via the gameState event
    setTimeout(resolve, 100)
  })
}

export function getBetLimits(token: string): Promise<{ min: number; max: number }> {
  return new Promise((resolve, reject) => {
    const socket = getSocket(token)

    socket.emit("getBetLimits")

    const limitsHandler = (limits: { min: number; max: number }) => {
      socket.off("error", errorHandler)
      resolve(limits)
    }

    const errorHandler = (error: any) => {
      socket.off("betLimits", limitsHandler)
      reject(error)
    }

    socket.once("betLimits", limitsHandler)
    socket.once("error", errorHandler)

    // Set a timeout to prevent hanging promises
    setTimeout(() => {
      socket.off("betLimits", limitsHandler)
      socket.off("error", errorHandler)
      reject(new Error("Request timed out"))
    }, 5000)
  })
}

export function createTable(
  token: string,
  name: string,
  maxPlayers: number,
  smallBlind: number,
  bigBlind: number,
  minBuyIn: number,
  maxBuyIn: number,
): Promise<{ tableId: string; tableInfo: any }> {
  return new Promise((resolve, reject) => {
    const socket = getSocket(token)

    socket.emit("createTable", { name, maxPlayers, smallBlind, bigBlind, minBuyIn, maxBuyIn })

    const tableHandler = (data: { tableId: string; tableInfo: any }) => {
      socket.off("error", errorHandler)
      resolve(data)
    }

    const errorHandler = (error: any) => {
      socket.off("tableCreated", tableHandler)
      reject(error)
    }

    socket.once("tableCreated", tableHandler)
    socket.once("error", errorHandler)

    // Set a timeout to prevent hanging promises
    setTimeout(() => {
      socket.off("tableCreated", tableHandler)
      socket.off("error", errorHandler)
      reject(new Error("Request timed out"))
    }, 5000)
  })
}

export function getTables(token: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const socket = getSocket(token)

    socket.emit("getTables")

    const tablesHandler = (tables: any[]) => {
      socket.off("error", errorHandler)
      resolve(tables)
    }

    const errorHandler = (error: any) => {
      socket.off("tableList", tablesHandler)
      reject(error)
    }

    socket.once("tableList", tablesHandler)
    socket.once("error", errorHandler)

    // Set a timeout to prevent hanging promises
    setTimeout(() => {
      socket.off("tableList", tablesHandler)
      socket.off("error", errorHandler)
      reject(new Error("Request timed out"))
    }, 5000)
  })
}

export function subscribeToGameState(token: string, callback: (gameState: any) => void): () => void {
  const socket = getSocket(token)

  socket.on("gameState", callback)

  // Return a function to unsubscribe
  return () => {
    socket.off("gameState", callback)
  }
}

export function subscribeToTableUpdates(token: string, callback: (tableInfo: any) => void): () => void {
  const socket = getSocket(token)

  socket.on("tableUpdate", callback)

  // Return a function to unsubscribe
  return () => {
    socket.off("tableUpdate", callback)
  }
}

export function subscribeToTransactionUpdates(token: string, callback: (transaction: any) => void): () => void {
  const socket = getSocket(token)

  socket.on("transactionUpdate", ({ transaction }) => {
    callback(transaction)
  })

  // Return a function to unsubscribe
  return () => {
    socket.off("transactionUpdate")
  }
}

export function disconnectSocket(): void {
  if (mockSocketInstance) {
    mockSocketInstance.disconnect()
    mockSocketInstance = null
  }
}

// Export the MockSocketClient class for use in API routes
export const MockSocketClientAPI = {
  getInstance: () => MockSocketClient.getInstance(),
}

