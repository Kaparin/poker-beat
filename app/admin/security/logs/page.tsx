import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import AdminLayout from "@/components/admin/admin-layout"
import SecurityLogsTable from "@/components/admin/security/logs-table"

export const metadata: Metadata = {
  title: "Журнал безопасности | Админ-панель | Poker Beat",
  description: "Журнал событий безопасности для администраторов Poker Beat",
}

export default async function SecurityLogsPage() {
  // Проверяем аутентификацию и права доступа
  const session = await auth()

  if (!session || !session.user.isAdmin) {
    redirect("/admin/login")
  }

  return (
    <AdminLayout>
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-bold">Журнал безопасности</h1>

        <SecurityLogsTable />
      </div>
    </AdminLayout>
  )
}

