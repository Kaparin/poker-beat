import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import AdminLayout from "@/components/admin/admin-layout"
import BannedUsersTable from "@/components/admin/security/banned-users-table"

export const metadata: Metadata = {
  title: "Заблокированные пользователи | Админ-панель | Poker Beat",
  description: "Управление заблокированными пользователями Poker Beat",
}

export default async function BannedUsersPage() {
  // Проверяем аутентификацию и права доступа
  const session = await auth()

  if (!session || !session.user.isAdmin) {
    redirect("/admin/login")
  }

  return (
    <AdminLayout>
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-bold">Заблокированные пользователи</h1>

        <BannedUsersTable />
      </div>
    </AdminLayout>
  )
}

