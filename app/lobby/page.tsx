"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import type { TableInfo } from "@/types/poker"
import { getTables, createTable } from "@/lib/socket-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Plus, RefreshCw, Users } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"

export default function LobbyPage() {
  const router = useRouter()
  const { user, token, loading: authLoading } = useAuth()
  const [tables, setTables] = useState<TableInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  // Form state for creating a table
  const [tableName, setTableName] = useState("")
  const [maxPlayers, setMaxPlayers] = useState(6)
  const [smallBlind, setSmallBlind] = useState(5)
  const [bigBlind, setBigBlind] = useState(10)
  const [minBuyIn, setMinBuyIn] = useState(200)
  const [maxBuyIn, setMaxBuyIn] = useState(1000)
  const [creatingTable, setCreatingTable] = useState(false)

  useEffect(() => {
    // Redirect to home if not authenticated
    if (!authLoading && !token) {
      router.push("/")
      return
    }

    if (token) {
      fetchTables()

      // Refresh tables every 10 seconds
      const interval = setInterval(() => fetchTables(), 10000)

      return () => clearInterval(interval)
    }
  }, [token, authLoading, router])

  const fetchTables = async () => {
    if (!token) return

    try {
      setRefreshing(true)

      // Используем REST API вместо WebSocket для получения списка столов
      const response = await fetch("/api/tables", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to fetch tables")
      }

      const data = await response.json()
      setTables(data.tables)
      setError(null)
    } catch (err) {
      // Если REST API не сработал, пробуем WebSocket как запасной вариант
      try {
        const tableList = await getTables(token)
        setTables(tableList)
        setError(null)
      } catch (wsErr) {
        setError(err instanceof Error ? err.message : "Failed to fetch tables")
        console.error("Error fetching tables:", err)
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleCreateTable = async () => {
    if (!token) return

    try {
      setCreatingTable(true)

      // Validate form
      if (!tableName) {
        toast({
          title: "Error",
          description: "Please enter a table name",
          variant: "destructive",
        })
        return
      }

      if (maxPlayers < 2 || maxPlayers > 9) {
        toast({
          title: "Error",
          description: "Max players must be between 2 and 9",
          variant: "destructive",
        })
        return
      }

      if (smallBlind <= 0 || bigBlind <= 0 || minBuyIn <= 0 || maxBuyIn <= 0) {
        toast({
          title: "Error",
          description: "All values must be positive",
          variant: "destructive",
        })
        return
      }

      if (bigBlind < smallBlind * 2) {
        toast({
          title: "Error",
          description: "Big blind must be at least twice the small blind",
          variant: "destructive",
        })
        return
      }

      if (minBuyIn < bigBlind * 10) {
        toast({
          title: "Error",
          description: "Minimum buy-in must be at least 10 times the big blind",
          variant: "destructive",
        })
        return
      }

      if (maxBuyIn < minBuyIn) {
        toast({
          title: "Error",
          description: "Maximum buy-in must be greater than minimum buy-in",
          variant: "destructive",
        })
        return
      }

      // Try both methods to create a table
      let tableId = ""
      let tableData = null

      // First try REST API
      try {
        const response = await fetch("/api/tables", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: tableName,
            maxPlayers,
            smallBlind,
            bigBlind,
            minBuyIn,
            maxBuyIn,
          }),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || "Failed to create table")
        }

        const data = await response.json()
        tableId = data.table.id
        tableData = data.table
      } catch (restError) {
        console.error("REST API table creation failed:", restError)

        // If REST API fails, try WebSocket
        try {
          const result = await createTable(token, tableName, maxPlayers, smallBlind, bigBlind, minBuyIn, maxBuyIn)
          tableId = result.tableId
          tableData = result.tableInfo
        } catch (wsError) {
          console.error("WebSocket table creation failed:", wsError)
          throw new Error("Failed to create table through both methods")
        }
      }

      // Close the dialog
      setCreateDialogOpen(false)

      // Refresh the table list
      fetchTables()

      // Show success message
      toast({
        title: "Success",
        description: "Table created successfully",
      })

      console.log("Created table:", tableData)
      console.log("Navigating to:", `/table/${tableId}`)

      // Navigate to the table
      router.push(`/table/${tableId}`)
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to create table",
        variant: "destructive",
      })
      console.error("Error creating table:", err)
    } finally {
      setCreatingTable(false)
    }
  }

  const handleJoinTable = (tableId: string) => {
    router.push(`/table/${tableId}`)
  }

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Loader2 className="w-12 h-12 animate-spin text-blue-500 mb-4" />
        <p className="text-lg">Authenticating...</p>
      </div>
    )
  }

  if (!token) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="p-4 bg-red-100 text-red-700 rounded-lg">
          <p className="text-lg font-bold">Authentication Required</p>
          <p>Please log in to access the lobby</p>
          <Button onClick={() => router.push("/")} className="mt-4">
            Go to Login
          </Button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Loader2 className="w-12 h-12 animate-spin text-blue-500 mb-4" />
        <p className="text-lg">Loading tables...</p>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl mx-auto p-4 pb-20">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Poker Tables</h1>
        <div className="flex space-x-2">
          <Button variant="outline" size="icon" onClick={fetchTables} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          </Button>

          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Table
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create a New Table</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="table-name">Table Name</Label>
                  <Input
                    id="table-name"
                    value={tableName}
                    onChange={(e) => setTableName(e.target.value)}
                    placeholder="My Poker Table"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="max-players">Max Players</Label>
                    <Input
                      id="max-players"
                      type="number"
                      min={2}
                      max={9}
                      value={maxPlayers}
                      onChange={(e) => setMaxPlayers(Number.parseInt(e.target.value))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="small-blind">Small Blind</Label>
                    <Input
                      id="small-blind"
                      type="number"
                      min={1}
                      value={smallBlind}
                      onChange={(e) => setSmallBlind(Number.parseInt(e.target.value))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="big-blind">Big Blind</Label>
                    <Input
                      id="big-blind"
                      type="number"
                      min={2}
                      value={bigBlind}
                      onChange={(e) => setBigBlind(Number.parseInt(e.target.value))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="min-buy-in">Min Buy-in</Label>
                    <Input
                      id="min-buy-in"
                      type="number"
                      min={100}
                      value={minBuyIn}
                      onChange={(e) => setMinBuyIn(Number.parseInt(e.target.value))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="max-buy-in">Max Buy-in</Label>
                    <Input
                      id="max-buy-in"
                      type="number"
                      min={200}
                      value={maxBuyIn}
                      onChange={(e) => setMaxBuyIn(Number.parseInt(e.target.value))}
                    />
                  </div>
                </div>

                <Button onClick={handleCreateTable} className="w-full" disabled={creatingTable}>
                  {creatingTable ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Table"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
          <Button variant="outline" size="sm" onClick={fetchTables} className="mt-2">
            Try Again
          </Button>
        </div>
      )}

      <Tabs defaultValue="all">
        <TabsList className="mb-4">
          <TabsTrigger value="all">All Tables</TabsTrigger>
          <TabsTrigger value="waiting">Waiting</TabsTrigger>
          <TabsTrigger value="playing">Playing</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tables.length === 0 ? (
              <div className="col-span-2 text-center py-8 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <p className="text-gray-500 dark:text-gray-400">No tables available</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Create a new table to start playing</p>
              </div>
            ) : (
              tables.map((table) => <TableCard key={table.id} table={table} onJoin={() => handleJoinTable(table.id)} />)
            )}
          </div>
        </TabsContent>

        <TabsContent value="waiting">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tables.filter((t) => t.status === "waiting").length === 0 ? (
              <div className="col-span-2 text-center py-8 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <p className="text-gray-500 dark:text-gray-400">No waiting tables</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Create a new table to start playing</p>
              </div>
            ) : (
              tables
                .filter((t) => t.status === "waiting")
                .map((table) => <TableCard key={table.id} table={table} onJoin={() => handleJoinTable(table.id)} />)
            )}
          </div>
        </TabsContent>

        <TabsContent value="playing">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tables.filter((t) => t.status === "playing").length === 0 ? (
              <div className="col-span-2 text-center py-8 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <p className="text-gray-500 dark:text-gray-400">No active games</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                  Join a waiting table or create a new one
                </p>
              </div>
            ) : (
              tables
                .filter((t) => t.status === "playing")
                .map((table) => <TableCard key={table.id} table={table} onJoin={() => handleJoinTable(table.id)} />)
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface TableCardProps {
  table: TableInfo
  onJoin: () => void
}

function TableCard({ table, onJoin }: TableCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>{table.name}</CardTitle>
        <CardDescription>
          Blinds: {table.smallBlind}/{table.bigBlind}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Players:</span>
            <span className="font-medium">
              {table.activePlayers}/{table.maxPlayers}
            </span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Buy-in:</span>
            <span className="font-medium">
              {table.minBuyIn} - {table.maxBuyIn}
            </span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Status:</span>
            <span
              className={`font-medium ${
                table.status === "waiting"
                  ? "text-yellow-600 dark:text-yellow-400"
                  : table.status === "playing"
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
              }`}
            >
              {table.status.charAt(0).toUpperCase() + table.status.slice(1)}
            </span>
          </div>

          <Button onClick={onJoin} className="w-full mt-4" disabled={table.status === "full"}>
            <Users className="h-4 w-4 mr-2" />
            {table.status === "full" ? "Table Full" : "Join Table"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

