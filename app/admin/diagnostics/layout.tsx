import type React from "react"
import type { Metadata } from "next"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Диагностика системы",
  description: "Инструменты для диагностики и анализа приложения",
}

export default function DiagnosticsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="container mx-auto py-4">
      <h1 className="text-3xl font-bold mb-6">Диагностика системы</h1>

      <div className="mb-8">
        <Tabs defaultValue="performance" className="w-full">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="performance" asChild>
              <Link href="/admin/diagnostics">Производительность</Link>
            </TabsTrigger>
            <TabsTrigger value="routes" asChild>
              <Link href="/admin/diagnostics/routes">Маршруты</Link>
            </TabsTrigger>
            <TabsTrigger value="dependencies" asChild>
              <Link href="/admin/diagnostics/dependencies">Зависимости</Link>
            </TabsTrigger>
            <TabsTrigger value="components" asChild>
              <Link href="/admin/diagnostics/components">Компоненты</Link>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {children}
    </div>
  )
}

