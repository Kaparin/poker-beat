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

export default function DependenciesAnalysisPage() {
  const [activeTab, setActiveTab] = useState("all")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dependenciesData, setDependenciesData] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [limit, setLimit] = useState(10)

  // Загрузка данных о зависимостях
  const fetchDependencies = async (action = "all") => {
    setLoading(true)
    setError(null)

    try {
      // Формируем URL с параметрами
      let url = `/api/diagnostics/dependencies?action=${action}`

      if (action === "most-used") {
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
      setDependenciesData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Произошла ошибка при загрузке данных")
    } finally {
      setLoading(false)
    }
  }

  // Загружаем данные при монтировании
  useEffect(() => {
    fetchDependencies()
  }, [])

  // Обработчик изменения вкладки
  const handleTabChange = (value: string) => {
    setActiveTab(value)
    fetchDependencies(value)
  }

  // Фильтрация зависимостей по поисковому запросу
  const filteredDependencies =
    dependenciesData?.dependencies?.filter((dep: any) => dep.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    []

  // Экспорт данных в JSON
  const exportData = () => {
    if (!dependenciesData) return

    const dataStr = JSON.stringify(dependenciesData, null, 2)
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`

    const exportFileDefaultName = `dependencies-analysis-${new Date().toISOString()}.json`

    const linkElement = document.createElement("a")
    linkElement.setAttribute("href", dataUri)
    linkElement.setAttribute("download", exportFileDefaultName)
    linkElement.click()
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Анализ зависимостей</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => fetchDependencies(activeTab)} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Обновить
          </Button>
          <Button variant="secondary" onClick={exportData} disabled={!dependenciesData || loading}>
            <Download className="h-4 w-4 mr-2" />
            Экспорт
          </Button>
        </div>
      </div>

      {/* Поиск и фильтры */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Поиск и фильтры</CardTitle>
          <CardDescription>Найдите и проанализируйте зависимости приложения</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Поиск по имени пакета</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="react, next, ..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {activeTab === "most-used" && (
              <div className="w-full md:w-1/4">
                <Label htmlFor="limit">Количество пакетов</Label>
                <Input
                  id="limit"
                  type="number"
                  min="1"
                  value={limit}
                  onChange={(e) => setLimit(Number.parseInt(e.target.value, 10))}
                  onBlur={() => fetchDependencies("most-used")}
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
          <TabsTrigger value="all">Все зависимости</TabsTrigger>
          <TabsTrigger value="unused">Неиспользуемые</TabsTrigger>
          <TabsTrigger value="most-used">Популярные</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <DependenciesList dependencies={filteredDependencies} loading={loading} />
        </TabsContent>

        <TabsContent value="unused">
          {!loading && filteredDependencies.length > 0 && (
            <Alert className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Неиспользуемые зависимости</AlertTitle>
              <AlertDescription>
                Найдено {filteredDependencies.length} неиспользуемых пакетов. Рассмотрите возможность их удаления для
                уменьшения размера сборки.
              </AlertDescription>
            </Alert>
          )}

          <DependenciesList dependencies={filteredDependencies} loading={loading} />
        </TabsContent>

        <TabsContent value="most-used">
          <DependenciesList dependencies={filteredDependencies} loading={loading} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Компонент для отображения списка зависимостей
function DependenciesList({
  dependencies,
  loading,
}: {
  dependencies: any[]
  loading: boolean
}) {
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!dependencies || dependencies.length === 0) {
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
              <TableHead>Пакет</TableHead>
              <TableHead>Версия</TableHead>
              <TableHead>Тип</TableHead>
              <TableHead>Использование</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dependencies.map((dep, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">{dep.name}</TableCell>
                <TableCell>{dep.version}</TableCell>
                <TableCell>
                  <Badge variant={dep.type === "dependency" ? "default" : "secondary"}>
                    {dep.type === "dependency" ? "Основная" : "Dev"}
                  </Badge>
                </TableCell>
                <TableCell>
                  {dep.usedIn.length > 0 ? (
                    <div>
                      <span className="font-medium">{dep.usedIn.length} файлов</span>
                      <details className="mt-1">
                        <summary className="text-xs text-muted-foreground cursor-pointer">Показать файлы</summary>
                        <ul className="mt-1 text-xs space-y-1 max-h-32 overflow-y-auto">
                          {dep.usedIn.map((file: string, i: number) => (
                            <li key={i} className="font-mono">
                              {file}
                            </li>
                          ))}
                        </ul>
                      </details>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">Не используется</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

