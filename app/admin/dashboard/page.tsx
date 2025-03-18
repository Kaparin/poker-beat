import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import AdminLayout from "@/components/admin/admin-layout"
import StatsCards from "@/components/admin/stats-cards"
import RecentUsers from "@/components/admin/recent-users"
import RecentTransactions from "@/components/admin/recent-transactions"
import ActiveTables from "@/components/admin/active-tables"

export const metadata: Metadata = {
  title: "Админ-панель | Poker Beat",
  description: "Панель управления для администраторов Poker Beat",
}

export default async function AdminDashboardPage() {
  // Проверяем аутентификацию и права доступа
  const session = await auth()

  if (!session || !session.user.isAdmin) {
    redirect("/admin/login")
  }

  return (
    <AdminLayout>
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-bold">Панель управления</h1>

        <StatsCards />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <RecentUsers />
          <RecentTransactions />
        </div>

        <ActiveTables />
      </div>
    </AdminLayout>
  )
}

