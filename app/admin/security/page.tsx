"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Search, Shield, UserX, RefreshCw } from "lucide-react"

interface SecurityLog {
  id: string
  userId: number | null
  action: string
  ipAddress: string | null
  userAgent: string | null
  details: string | null
  timestamp: string
  userName?: string
}

interface BannedUser {
  id: number
  telegramId: number
  firstName: string
  lastName: string | null
  username: string | null
  banReason: string | null
  bannedAt: string
}

export default function SecurityDashboard() {
  const router = useRouter()
  const { user, token, loading: authLoading } = useAuth()
  const [logs, setLogs] = useState<SecurityLog[]>([])
  const [bannedUsers, setBannedUsers] = useState<BannedUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [actionFilter, setActionFilter] = useState("all")

  useEffect(() => {
    // Redirect if not authenticated or not an admin
    if (!authLoading && (!token || !user || user.role !== "admin")) {
      router.push("/")
      return
    }

    if (token && user?.role === "admin") {
      fetchSecurityData()
    }
  }, [token, authLoading, user, router])

  const fetchSecurityData = async () => {
    try {
      setLoading(true)

      // Fetch security logs
      const logsResponse = await fetch("/api/admin/security/logs", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!logsResponse.ok) {
        throw new Error("Failed to fetch security logs")
      }

      const logsData = await logsResponse.json()
      setLogs(logsData.logs)

      // Fetch banned users
      const bannedResponse = await fetch("/api/admin/security/banned-users", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!bannedResponse.ok) {
        throw new Error("Failed to fetch banned users")
      }

      const bannedData = await bannedResponse.json()
      setBannedUsers(bannedData.users)

      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
      console.error("Error fetching security data:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleBanUser = async (userId: number) => {
    try {
      const reason = prompt("Enter reason for banning this user:")

      if (reason === null) {
        return // User cancelled
      }

      const response = await fetch("/api/admin/security/ban-user", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          reason: reason || "No reason provided",
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to ban user")
      }

      // Refresh data
      fetchSecurityData()
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : "Failed to ban user"}`)
      console.error("Error banning user:", err)
    }
  }

  const handleUnbanUser = async (userId: number) => {
    try {
      if (!confirm("Are you sure you want to unban this user?")) {
        return
      }

      const response = await fetch("/api/admin/security/unban-user", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      })

      if (!response.ok) {
        throw new Error("Failed to unban user")
      }

      // Refresh data
      fetchSecurityData()
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : "Failed to unban user"}`)
      console.error("Error unbanning user:", err)
    }
  }

  // Filter logs based on search term and action filter
  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      searchTerm === "" ||
      log.details?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.userName && log.userName.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesAction = actionFilter === "all" || log.action === actionFilter

    return matchesSearch && matchesAction
  })

  // Get unique actions for filter dropdown
  const uniqueActions = Array.from(new Set(logs.map((log) => log.action)))

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Loader2 className="w-12 h-12 animate-spin text-blue-500 mb-4" />
        <p className="text-lg">Authenticating...</p>
      </div>
    )
  }

  if (!token || !user || user.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="p-4 bg-red-100 text-red-700 rounded-lg">
          <p className="text-lg font-bold">Access Denied</p>
          <p>You do not have permission to access this page.</p>
          <Button onClick={() => router.push("/")} className="mt-4">
            Go to Home
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-7xl mx-auto p-4 pb-20">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Shield className="h-6 w-6 mr-2 text-blue-500" />
          <h1 className="text-2xl font-bold">Security Dashboard</h1>
        </div>

        <Button variant="outline" size="icon" onClick={fetchSecurityData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
          <Button variant="outline" size="sm" onClick={fetchSecurityData} className="mt-2">
            Try Again
          </Button>
        </div>
      )}

      <Tabs defaultValue="logs">
        <TabsList className="mb-4">
          <TabsTrigger value="logs">Security Logs</TabsTrigger>
          <TabsTrigger value="banned">Banned Users</TabsTrigger>
        </TabsList>

        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>Security Logs</CardTitle>
              <CardDescription>View and search security-related events in the system</CardDescription>

              <div className="flex flex-col sm:flex-row gap-4 mt-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Search logs..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="w-full sm:w-64">
                  <Label htmlFor="action-filter" className="sr-only">
                    Filter by action
                  </Label>
                  <select
                    id="action-filter"
                    className="w-full h-10 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md"
                    value={actionFilter}
                    onChange={(e) => setActionFilter(e.target.value)}
                  >
                    <option value="all">All Actions</option>
                    {uniqueActions.map((action) => (
                      <option key={action} value={action}>
                        {action.replace(/_/g, " ")}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                </div>
              ) : filteredLogs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No logs found matching your criteria</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Details</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="whitespace-nowrap">
                            {new Date(log.timestamp).toLocaleString()}
                          </TableCell>
                          <TableCell>{log.userName || (log.userId ? `User #${log.userId}` : "System")}</TableCell>
                          <TableCell className="whitespace-nowrap">{log.action.replace(/_/g, " ")}</TableCell>
                          <TableCell className="max-w-md truncate">{log.details || "-"}</TableCell>
                          <TableCell>
                            {log.userId && (
                              <Button variant="outline" size="sm" onClick={() => handleBanUser(log.userId!)}>
                                <UserX className="h-4 w-4 mr-1" />
                                Ban User
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="banned">
          <Card>
            <CardHeader>
              <CardTitle>Banned Users</CardTitle>
              <CardDescription>View and manage users who have been banned from the platform</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                </div>
              ) : bannedUsers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No banned users found</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Username</TableHead>
                        <TableHead>Ban Reason</TableHead>
                        <TableHead>Banned At</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bannedUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>{user.id}</TableCell>
                          <TableCell>
                            {user.firstName} {user.lastName || ""}
                          </TableCell>
                          <TableCell>{user.username ? `@${user.username}` : "-"}</TableCell>
                          <TableCell>{user.banReason || "No reason provided"}</TableCell>
                          <TableCell>{new Date(user.bannedAt).toLocaleString()}</TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm" onClick={() => handleUnbanUser(user.id)}>
                              Unban User
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

