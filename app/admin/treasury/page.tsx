import type { Metadata } from "next"
import TreasuryDashboard from "@/components/admin/treasury-dashboard"

export const metadata: Metadata = {
  title: "Управление Treasury Pool | Админ-панель",
  description: "Управление Treasury Pool и распределением средств",
}

export default function TreasuryPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Управление Treasury Pool</h1>
        <p className="text-muted-foreground">Управление Treasury Pool и распределением средств в покерной платформе</p>
      </div>
      <TreasuryDashboard />
    </div>
  )
}

