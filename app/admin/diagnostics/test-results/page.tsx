"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, AlertCircle, AlertTriangle, Clock } from "lucide-react"
import type { GameTestSummary } from "@/lib/test-utils/game-tester"
import type { NavigationTestResult } from "@/lib/test-utils/navigation-tester"

export default function TestResultsPage() {
  const [navigationResults, setNavigationResults] = useState<{
    success: boolean
    results: NavigationTestResult[]
    summary: {
      total: number
      success: number
      warnings: number
      errors: number
    }
  } | null>(null)

  const [gameResults, setGameResults] = useState<GameTestSummary | null>(null)

  const [loading, setLoading] = useState({
    navigation: true,
    game: true,
  })

  useEffect(() => {
    // Fetch navigation test results
    fetch("/api/test/navigation")
      .then((res) => res.json())
      .then((data) => {
        setNavigationResults(data)
        setLoading((prev) => ({ ...prev, navigation: false }))
      })
      .catch((err) => {
        console.error("Error fetching navigation test results:", err)
        setLoading((prev) => ({ ...prev, navigation: false }))
      })

    // Fetch game test results
    fetch("/api/test/game")
      .then((res) => res.json())
      .then((data) => {
        setGameResults(data)
        setLoading((prev) => ({ ...prev, game: false }))
      })
      .catch((err) => {
        console.error("Error fetching game test results:", err)
        setLoading((prev) => ({ ...prev, game: false }))
      })
  }, [])

  return (
    <div className="container mx-auto py-6">
      <h1 className="mb-6 text-3xl font-bold">Результаты тестирования</h1>

      <Tabs defaultValue="navigation">
        <TabsList className="mb-4">
          <TabsTrigger value="navigation">Навигация</TabsTrigger>
          <TabsTrigger value="game">Игровая логика</TabsTrigger>
        </TabsList>

        <TabsContent value="navigation">
          <Card>
            <CardHeader>
              <CardTitle>Тестирование навигации</CardTitle>
              <CardDescription>Проверка доступности и корректности всех страниц приложения</CardDescription>
            </CardHeader>
            <CardContent>
              {loading.navigation ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
                  <span className="ml-2">Загрузка результатов...</span>
                </div>
              ) : navigationResults ? (
                <div>
                  <div className="mb-4 grid grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <p className="text-sm text-gray-500">Всего страниц</p>
                          <p className="text-3xl font-bold">{navigationResults.summary.total}</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-green-50 dark:bg-green-900/20">
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <p className="text-sm text-gray-500">Успешно</p>
                          <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                            {navigationResults.summary.success}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-yellow-50 dark:bg-yellow-900/20">
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <p className="text-sm text-gray-500">Предупреждения</p>
                          <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                            {navigationResults.summary.warnings}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-red-50 dark:bg-red-900/20">
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <p className="text-sm text-gray-500">Ошибки</p>
                          <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                            {navigationResults.summary.errors}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-4">
                    {navigationResults.results.map((result, index) => (
                      <Card
                        key={index}
                        className={
                          result.status === "success"
                            ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20"
                            : result.status === "warning"
                              ? "border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20"
                              : "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20"
                        }
                      >
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center">
                                {result.status === "success" ? (
                                  <CheckCircle className="mr-2 h-5 w-5 text-green-600 dark:text-green-400" />
                                ) : result.status === "warning" ? (
                                  <AlertTriangle className="mr-2 h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                                ) : (
                                  <AlertCircle className="mr-2 h-5 w-5 text-red-600 dark:text-red-400" />
                                )}
                                <h3 className="font-medium">
                                  {result.link.label} ({result.link.path})
                                </h3>
                              </div>

                              {result.errors.length > 0 && (
                                <div className="mt-2">
                                  <h4 className="font-medium text-red-600 dark:text-red-400">Ошибки:</h4>
                                  <ul className="ml-6 list-disc">
                                    {result.errors.map((error, i) => (
                                      <li key={i} className="text-sm">
                                        {error}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {result.warnings.length > 0 && (
                                <div className="mt-2">
                                  <h4 className="font-medium text-yellow-600 dark:text-yellow-400">Предупреждения:</h4>
                                  <ul className="ml-6 list-disc">
                                    {result.warnings.map((warning, i) => (
                                      <li key={i} className="text-sm">
                                        {warning}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>

                            <Badge
                              variant={
                                result.status === "success"
                                  ? "success"
                                  : result.status === "warning"
                                    ? "warning"
                                    : "destructive"
                              }
                            >
                              {result.status === "success"
                                ? "Успешно"
                                : result.status === "warning"
                                  ? "Предупреждение"
                                  : "Ошибка"}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Ошибка</AlertTitle>
                  <AlertDescription>Не удалось загрузить результаты тестирования навигации</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="game">
          <Card>
            <CardHeader>
              <CardTitle>Тестирование игровой логики</CardTitle>
              <CardDescription>Проверка корректности работы игровых механик и правил покера</CardDescription>
            </CardHeader>
            <CardContent>
              {loading.game ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
                  <span className="ml-2">Загрузка результатов...</span>
                </div>
              ) : gameResults ? (
                <div>
                  <div className="mb-4 grid grid-cols-5 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <p className="text-sm text-gray-500">Всего тестов</p>
                          <p className="text-3xl font-bold">{gameResults.totalTests}</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-green-50 dark:bg-green-900/20">
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <p className="text-sm text-gray-500">Успешно</p>
                          <p className="text-3xl font-bold text-green-600 dark:text-green-400">{gameResults.passed}</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-yellow-50 dark:bg-yellow-900/20">
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <p className="text-sm text-gray-500">Предупреждения</p>
                          <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                            {gameResults.warnings}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-red-50 dark:bg-red-900/20">
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <p className="text-sm text-gray-500">Ошибки</p>
                          <p className="text-3xl font-bold text-red-600 dark:text-red-400">{gameResults.failed}</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-gray-50 dark:bg-gray-800">
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <p className="text-sm text-gray-500">Не протестировано</p>
                          <p className="text-3xl font-bold text-gray-600 dark:text-gray-400">{gameResults.notTested}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-4">
                    {gameResults.results.map((result, index) => (
                      <Card
                        key={index}
                        className={
                          result.status === "success"
                            ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20"
                            : result.status === "warning"
                              ? "border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20"
                              : result.status === "error"
                                ? "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20"
                                : "border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800"
                        }
                      >
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center">
                                {result.status === "success" ? (
                                  <CheckCircle className="mr-2 h-5 w-5 text-green-600 dark:text-green-400" />
                                ) : result.status === "warning" ? (
                                  <AlertTriangle className="mr-2 h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                                ) : result.status === "error" ? (
                                  <AlertCircle className="mr-2 h-5 w-5 text-red-600 dark:text-red-400" />
                                ) : (
                                  <Clock className="mr-2 h-5 w-5 text-gray-600 dark:text-gray-400" />
                                )}
                                <h3 className="font-medium">{result.feature}</h3>
                              </div>

                              <div className="mt-2">
                                <p className="text-sm">{result.details}</p>
                              </div>
                            </div>

                            <Badge
                              variant={
                                result.status === "success"
                                  ? "success"
                                  : result.status === "warning"
                                    ? "warning"
                                    : result.status === "error"
                                      ? "destructive"
                                      : "outline"
                              }
                            >
                              {result.status === "success"
                                ? "Успешно"
                                : result.status === "warning"
                                  ? "Предупреждение"
                                  : result.status === "error"
                                    ? "Ошибка"
                                    : "Не протестировано"}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Ошибка</AlertTitle>
                  <AlertDescription>Не удалось загрузить результаты тестирования игровой логики</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

