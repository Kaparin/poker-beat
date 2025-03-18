"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertCircle, RefreshCw, Download, Search } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { getAggregatedComponentInfo } from "@/lib/component-analyzer"

export default function ComponentsAnalysisPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [componentsData, setComponentsData] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")

  // Загрузка данных о компонентах
  const fetchComponents = async () => {
    setLoading(true)
    setError(null)

    try {
      // В реальном приложении здесь был бы запрос к API
      // Для демонстрации используем прямой вызов функции
      const data = getAggregatedComponentInfo()
      setComponentsData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Произошла ошибка при загрузке данных")
    } finally {
      setLoading(false)
    }
  }

  // Загружаем данные при монтировании
  useEffect(() => {
    fetchComponents()
  }, [])

  // Фильтрация компонентов по поисковому запросу
  const filteredComponents = componentsData.filter((comp) => comp.name.toLowerCase().includes(searchTerm.toLowerCase()))

  // Экспорт данных в JSON
  const exportData = () => {
    if (componentsData.length === 0) return

    const dataStr = JSON.stringify(componentsData, null, 2)
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`

    const exportFileDefaultName = `components-analysis-${new Date().toISOString()}.json`

    const linkElement = document.createElement("a")
    linkElement.setAttribute("href", dataUri)
    linkElement.setAttribute("download", exportFileDefaultName)
    linkElement.click()
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Анализ компонентов</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchComponents} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Обновить
          </Button>
          <Button variant="secondary" onClick={exportData} disabled={componentsData.length === 0 || loading}>
            <Download className="h-4 w-4 mr-2" />
            Экспорт
          </Button>
        </div>
      </div>

      {/* Поиск */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Поиск компонентов</CardTitle>
          <CardDescription>Найдите компоненты по имени</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Имя компонента..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
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

      <Card>
        <CardHeader>
          <CardTitle>Производительность компонентов</CardTitle>
          <CardDescription>Время загрузки и рендеринга компонентов</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredComponents.length > 0 ? (
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
                {filteredComponents.map((comp, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{comp.name}</TableCell>
                    <TableCell>{comp.avgLoadTime.toFixed(2)}</TableCell>
                    <TableCell>{comp.avgRenderTime.toFixed(2)}</TableCell>
                    <TableCell>{comp.loadCount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center p-12 border rounded-lg bg-background">
              <p className="text-muted-foreground">
                {searchTerm ? "Нет компонентов, соответствующих поисковому запросу" : "Нет данных о компонентах"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

