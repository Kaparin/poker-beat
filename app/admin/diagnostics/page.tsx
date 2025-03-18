"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertCircle, RefreshCw, Download } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function DiagnosticsPage() {
  const [activeTab, setActiveTab] = useState("performance")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [diagnosticsData, setDiagnosticsData] = useState<any>(null)
  const [filters, setFilters] = useState({
    route: "",
    startDate: "",
    endDate: "",
    component: "",
  })

  // Загрузка данных диагностики
  const fetchDiagnostics = async () => {
    setLoading(true)
    setError(null)

    try {
      // Формируем URL с параметрами фильтрации
      let url = "/api/diagnostics?type=all"

      if (filters.route) url += `&route=${encodeURIComponent(filters.route)}`
      if (filters.startDate) url += `&startDate=${encodeURIComponent(filters.startDate)}`
      if (filters.endDate) url += `&endDate=${encodeURIComponent(filters.endDate)}`
      if (filters.component) url += `&component=${encodeURIComponent(filters.component)}`

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Ошибка: ${response.status}`)
      }

      const data = await response.json()
      setDiagnosticsData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Произошла ошибка при загрузке данных")
    } finally {
      setLoading(false)
    }
  }

  // Загружаем данные при монтировании и изменении фильтров
  useEffect(() => {
    fetchDiagnostics()
  }, [])

  // Обработчик изменения фильтров
  const handleFilterChange = (name: string, value: string) => {
    setFilters((prev) => ({ ...prev, [name]: value }))
  }

  // Применение фильтров
  const applyFilters = () => {
    fetchDiagnostics()
  }

  // Экспорт данных в JSON
  const exportData = () => {
    if (!diagnosticsData) return

    const dataStr = JSON.stringify(diagnosticsData, null, 2)
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`

    const exportFileDefaultName = `diagnostics-${new Date().toISOString()}.json`

    const linkElement = document.createElement("a")
    linkElement.setAttribute("href", dataUri)
    linkElement.setAttribute("download", exportFileDefaultName)
    linkElement.click()
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Диагностика системы</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchDiagnostics} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Обновить
          </Button>
          <Button variant="secondary" onClick={exportData} disabled={!diagnosticsData || loading}>
            <Download className="h-4 w-4 mr-2" />
            Экспорт
          </Button>
        </div>
      </div>

      {/* Фильтры */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Фильтры</CardTitle>
          <CardDescription>Настройте параметры для анализа данных</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="route">Маршрут</Label>
              <Input
                id="route"
                placeholder="/api/..."
                value={filters.route}
                onChange={(e) => handleFilterChange("route", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="startDate">Начальная дата</Label>
              <Input
                id="startDate"
                type="datetime-local"
                value={filters.startDate}
                onChange={(e) => handleFilterChange("startDate", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="endDate">Конечная дата</Label>
              <Input
                id="endDate"
                type="datetime-local"
                value={filters.endDate}
                onChange={(e) => handleFilterChange("endDate", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="component">Компонент</Label>
              <Input
                id="component"
                placeholder="Имя компонента"
                value={filters.component}
                onChange={(e) => handleFilterChange("component", e.target.value)}
              />
            </div>
          </div>
          <Button className="mt-4" onClick={applyFilters}>
            Применить фильтры
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Ошибка</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="performance">Производительность API</TabsTrigger>
          <TabsTrigger value="components">Компоненты</TabsTrigger>
          <TabsTrigger value="system">Система</TabsTrigger>
        </TabsList>

        {/* Вкладка производительности API */}
        <TabsContent value="performance">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : diagnosticsData?.metrics ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Среднее время ответа</CardTitle>
                    <CardDescription>Среднее время обработки запросов</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      {diagnosticsData.aggregatedMetrics.avgDuration.toFixed(2)} мс
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>95-й перцентиль</CardTitle>
                    <CardDescription>95% запросов быстрее чем</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      {diagnosticsData.aggregatedMetrics.p95Duration.toFixed(2)} мс
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Процент ошибок</CardTitle>
                    <CardDescription>Запросы с кодом 4xx и 5xx</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{diagnosticsData.aggregatedMetrics.errorRate.toFixed(2)}%</div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Метрики API</CardTitle>
                  <CardDescription>Детальная информация о запросах</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Маршрут</TableHead>
                        <TableHead>Метод</TableHead>
                        <TableHead>Время (мс)</TableHead>
                        <TableHead>Статус</TableHead>
                        <TableHead>Время запроса</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {diagnosticsData.metrics.slice(0, 20).map((metric: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell>{metric.route}</TableCell>
                          <TableCell>{metric.method}</TableCell>
                          <TableCell>{metric.duration.toFixed(2)}</TableCell>
                          <TableCell>
                            <span
                              className={`px-2 py-1 rounded text-xs ${
                                metric.status < 300
                                  ? "bg-green-100 text-green-800"
                                  : metric.status < 400
                                    ? "bg-blue-100 text-blue-800"
                                    : metric.status < 500
                                      ? "bg-yellow-100 text-yellow-800"
                                      : "bg-red-100 text-red-800"
                              }`}
                            >
                              {metric.status}
                            </span>
                          </TableCell>
                          <TableCell>{new Date(metric.timestamp).toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {diagnosticsData.metrics.length > 20 && (
                    <div className="text-center text-sm text-muted-foreground mt-4">
                      Показаны первые 20 из {diagnosticsData.metrics.length} записей
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="text-center p-6">Нет данных для отображения</div>
          )}
        </TabsContent>

        {/* Вкладка компонентов */}
        <TabsContent value="components">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : diagnosticsData?.componentInfo ? (
            <Card>
              <CardHeader>
                <CardTitle>Производительность компонентов</CardTitle>
                <CardDescription>Время загрузки и рендеринга компонентов</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Компонент</TableHead>
                      <TableHead>Среднее время загрузки (мс)</TableHead>
                      <TableHead>Среднее время рендеринга (мс)</TableHead>
                      <TableHead>Количество загрузок</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {diagnosticsData.componentInfo.map((info: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell>{info.name}</TableCell>
                        <TableCell>{info.avgLoadTime.toFixed(2)}</TableCell>
                        <TableCell>{info.avgRenderTime.toFixed(2)}</TableCell>
                        <TableCell>{info.loadCount}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <div className="text-center p-6">Нет данных для отображения</div>
          )}
        </TabsContent>

        {/* Вкладка системы */}
        <TabsContent value="system">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : diagnosticsData?.system ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Информация о системе</CardTitle>
                  <CardDescription>Основные параметры сервера</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Node.js версия:</span>
                      <span className="font-medium">{diagnosticsData.system.nodeVersion}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Платформа:</span>
                      <span className="font-medium">{diagnosticsData.system.platform}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Архитектура:</span>
                      <span className="font-medium">{diagnosticsData.system.arch}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Время работы:</span>
                      <span className="font-medium">
                        {Math.floor(diagnosticsData.system.uptime / 3600)} ч{" "}
                        {Math.floor((diagnosticsData.system.uptime % 3600) / 60)} мин
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Использование памяти</CardTitle>
                  <CardDescription>Текущее потребление памяти</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">RSS:</span>
                      <span className="font-medium">
                        {Math.round(diagnosticsData.system.memoryUsage.rss / 1024 / 1024)} МБ
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Heap Total:</span>
                      <span className="font-medium">
                        {Math.round(diagnosticsData.system.memoryUsage.heapTotal / 1024 / 1024)} МБ
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Heap Used:</span>
                      <span className="font-medium">
                        {Math.round(diagnosticsData.system.memoryUsage.heapUsed / 1024 / 1024)} МБ
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">External:</span>
                      <span className="font-medium">
                        {Math.round(diagnosticsData.system.memoryUsage.external / 1024 / 1024)} МБ
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center p-6">Нет данных для отображения</div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

