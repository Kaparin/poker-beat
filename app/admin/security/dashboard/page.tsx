import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import AdminLayout from "@/components/admin/admin-layout"
import SecurityStatsCards from "@/components/admin/security/stats-cards"
import RecentSecurityEvents from "@/components/admin/security/recent-events"
import SecurityActions from "@/components/admin/security/security-actions"

export const metadata: Metadata = {
  title: "Безопасность | Админ-панель | Poker Beat",
  description: "Панель безопасности для администраторов Poker Beat",
}

export default async function SecurityDashboardPage() {
  // Проверяем аутентификацию и права доступа
  const session = await auth()

  if (!session || !session.user.isAdmin) {
    redirect("/admin/login")
  }

  return (
    <AdminLayout>
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-bold">Панель безопасности</h1>

        <SecurityStatsCards />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <RecentSecurityEvents />
          <SecurityActions />
        </div>
      </div>
    </AdminLayout>
  )
}

