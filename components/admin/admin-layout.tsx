"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, Users, Table, CreditCard, Gift, Shield, Trophy, Bell, Settings, LogOut } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import Cookies from "js-cookie"

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Проверяем аутентификацию на клиенте
  useEffect(() => {
    const token = Cookies.get("token")
    if (!token) {
      router.push("/admin/login")
    }
  }, [router])

  const handleLogout = () => {
    Cookies.remove("token")
    router.push("/admin/login")
  }

  const navItems = [
    { href: "/admin/dashboard", label: "Панель управления", icon: <LayoutDashboard className="h-5 w-5" /> },
    { href: "/admin/users", label: "Пользователи", icon: <Users className="h-5 w-5" /> },
    { href: "/admin/tables", label: "Столы", icon: <Table className="h-5 w-5" /> },
    { href: "/admin/transactions", label: "Транзакции", icon: <CreditCard className="h-5 w-5" /> },
    { href: "/admin/promo-codes", label: "Промо-коды", icon: <Gift className="h-5 w-5" /> },
    { href: "/admin/security", label: "Безопасность", icon: <Shield className="h-5 w-5" /> },
    { href: "/admin/tournaments", label: "Турниры", icon: <Trophy className="h-5 w-5" /> },
    { href: "/admin/notifications", label: "Уведомления", icon: <Bell className="h-5 w-5" /> },
    { href: "/admin/settings", label: "Настройки", icon: <Settings className="h-5 w-5" /> },
  ]

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Боковая панель */}
      <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-xl font-bold">Poker Beat Admin</h1>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center px-4 py-2 rounded-md ${
                pathname === item.href
                  ? "bg-gray-100 dark:bg-gray-700 text-primary"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              {item.icon}
              <span className="ml-3">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Тема</span>
            <ThemeToggle />
          </div>
          <Button variant="outline" className="w-full justify-start" onClick={handleLogout}>
            <LogOut className="h-5 w-5 mr-2" />
            Выйти
          </Button>
        </div>
      </aside>

      {/* Мобильная навигация */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Poker Beat Admin</h1>
          <div className="flex items-center space-x-2">
            <ThemeToggle />
            <Button variant="outline" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              <span className="sr-only">Открыть меню</span>
              {isMobileMenuOpen ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </Button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <nav className="mt-4 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-4 py-2 rounded-md ${
                  pathname === item.href
                    ? "bg-gray-100 dark:bg-gray-700 text-primary"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.icon}
                <span className="ml-3">{item.label}</span>
              </Link>
            ))}

            <Button variant="outline" className="w-full justify-start mt-4" onClick={handleLogout}>
              <LogOut className="h-5 w-5 mr-2" />
              Выйти
            </Button>
          </nav>
        )}
      </div>

      {/* Основное содержимое */}
      <main className="flex-1 overflow-y-auto p-6 md:p-8 pt-20 md:pt-8">{children}</main>
    </div>
  )
}

