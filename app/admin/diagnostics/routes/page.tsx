"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, RefreshCw, Download, Search, AlertTriangle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"

export default function RoutesAnalysisPage() {
  const [activeTab, setActiveTab] = useState("all")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [routesData, setRoutesData] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [minDays, setMinDays] = useState(30)
  const [limit, setLimit] = useState(10)

  // Загрузка данных о маршрутах
  const fetchRoutes = async (action = "info") => {
    setLoading(true)
    setError(null)

    try {
      // Формируем URL с параметрами
      let url = `/api/diagnostics/routes?action=${action}`

      if (action === "unused") {
        url += `&minDays=${minDays}`
      } else if (action === "most-used") {
        url += `&limit=${limit}`
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Ошибка: ${response.status}`)
      }

      const data = await response.json()
      setRoutesData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Произошла ошибка при загрузке данных")
    } finally {
      setLoading(false)
    }
  }

  // Загружаем данные при монтировании
  useEffect(() => {
    fetchRoutes()
  }, [])

  // Обработчик изменения вкладки
  const handleTabChange = (value: string) => {
    setActiveTab(value)

    switch (value) {
      case "all":
        fetchRoutes("info")
        break
      case "unused":
        fetchRoutes("unused")
        break
      case "most-used":
        fetchRoutes("most-used")
        break
      case "scan":
        fetchRoutes("scan")
        break
    }
  }

  // Фильтрация маршрутов по поисковому запросу
  const filteredRoutes =
    routesData?.routes?.filter((route: any) => route.path.toLowerCase().includes(searchTerm.toLowerCase())) || []

  // Экспорт данных в JSON
  const exportData = () => {
    if (!routesData) return

    const dataStr = JSON.stringify(routesData, null, 2)
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`

    const exportFileDefaultName = `routes-analysis-${new Date().toISOString()}.json`

    const linkElement = document.createElement("a")
    linkElement.setAttribute("href", dataUri)
    linkElement.setAttribute("download", exportFileDefaultName)
    linkElement.click()
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Анализ маршрутов</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => fetchRoutes(activeTab === "all" ? "info" : activeTab)}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Обновить
          </Button>
          <Button variant="secondary" onClick={exportData} disabled={!routesData || loading}>
            <Download className="h-4 w-4 mr-2" />
            Экспорт
          </Button>
        </div>
      </div>

      {/* Поиск и фильтры */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Поиск и фильтры</CardTitle>
          <CardDescription>Найдите и проанализируйте маршруты приложения</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Поиск по пути</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="/api/..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {activeTab === "unused" && (
              <div className="w-full md:w-1/4">
                <Label htmlFor="minDays">Минимальное количество дней</Label>
                <Input
                  id="minDays"
                  type="number"
                  min="1"
                  value={minDays}
                  onChange={(e) => setMinDays(Number.parseInt(e.target.value, 10))}
                  onBlur={() => fetchRoutes("unused")}
                />
              </div>
            )}

            {activeTab === "most-used" && (
              <div className="w-full md:w-1/4">
                <Label htmlFor="limit">Количество маршрутов</Label>
                <Input
                  id="limit"
                  type="number"
                  min="1"
                  value={limit}
                  onChange={(e) => setLimit(Number.parseInt(e.target.value, 10))}
                  onBlur={() => fetchRoutes("most-used")}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Ошибка</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="mb-6">
          <TabsTrigger value="all">Все маршруты</TabsTrigger>
          <TabsTrigger value="unused">Неиспользуемые</TabsTrigger>
          <TabsTrigger value="most-used">Популярные</TabsTrigger>
          <TabsTrigger value="scan">Сканировать</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <RoutesList routes={filteredRoutes} loading={loading} showAccessCount={true} showLastAccessed={true} />
        </TabsContent>

        <TabsContent value="unused">
          {!loading && filteredRoutes.length > 0 && (
            <Alert className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Неиспользуемые маршруты</AlertTitle>
              <AlertDescription>
                Найдено {filteredRoutes.length} маршрутов, которые не использовались более {minDays} дней. Рассмотрите
                возможность их удаления или архивации.
              </AlertDescription>
            </Alert>
          )}

          <RoutesList routes={filteredRoutes} loading={loading} showLastAccessed={true} />
        </TabsContent>

        <TabsContent value="most-used">
          <RoutesList routes={filteredRoutes} loading={loading} showAccessCount={true} />
        </TabsContent>

        <TabsContent value="scan">
          {!loading && filteredRoutes.length > 0 && (
            <Alert className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Результаты сканирования</AlertTitle>
              <AlertDescription>Найдено {filteredRoutes.length} маршрутов в приложении.</AlertDescription>
            </Alert>
          )}

          <RoutesList routes={filteredRoutes} loading={loading} showHandler={true} showMiddleware={true} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Компонент для отображения списка маршрутов
function RoutesList({
  routes,
  loading,
  showAccessCount = false,
  showLastAccessed = false,
  showHandler = false,
  showMiddleware = false,
}: {
  routes: any[]
  loading: boolean
  showAccessCount?: boolean
  showLastAccessed?: boolean
  showHandler?: boolean
  showMiddleware?: boolean
}) {
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!routes || routes.length === 0) {
    return (
      <div className="text-center p-12 border rounded-lg bg-background">
        <p className="text-muted-foreground">Нет данных для отображения</p>
      </div>
    )
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Путь</TableHead>
              <TableHead>Методы</TableHead>
              {showAccessCount && <TableHead>Количество обращений</TableHead>}
              {showLastAccessed && <TableHead>Последний доступ</TableHead>}
              {showHandler && <TableHead>Обработчик</TableHead>}
              {showMiddleware && <TableHead>Middleware</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {routes.map((route, index) => (
              <TableRow key={index}>
                <TableCell className="font-mono text-sm">{route.path}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {route.methods.map((method: string, i: number) => (
                      <Badge
                        key={i}
                        variant={
                          method === "GET"
                            ? "default"
                            : method === "POST"
                              ? "secondary"
                              : method === "PUT"
                                ? "outline"
                                : method === "DELETE"
                                  ? "destructive"
                                  : "default"
                        }
                      >
                        {method}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                {showAccessCount && <TableCell>{route.accessCount}</TableCell>}
                {showLastAccessed && (
                  <TableCell>
                    {route.lastAccessed ? new Date(route.lastAccessed).toLocaleString() : "Никогда"}
                  </TableCell>
                )}
                {showHandler && <TableCell className="font-mono text-xs">{route.handler}</TableCell>}
                {showMiddleware && (
                  <TableCell>
                    {route.middleware.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {route.middleware.map((mw: string, i: number) => (
                          <Badge key={i} variant="outline">
                            {mw}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">Нет</span>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

