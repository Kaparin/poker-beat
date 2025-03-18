import type { Metadata } from "next"
import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import UserManagement from "@/components/admin/user-management"

export const metadata: Metadata = {
  title: "Управление пользователями | Poker Beat",
  description: "Управление пользователями покерной платформы",
}

export default async function UserManagementPage() {
  const session = await getServerSession(authOptions)

  // Проверяем авторизацию и права администратора
  if (!session || session.user.role !== "ADMIN") {
    redirect("/")
  }

  return <UserManagement />
}

