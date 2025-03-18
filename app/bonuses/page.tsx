import { BonusList } from "@/components/bonuses/bonus-list"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Бонусы и акции | Покер",
  description: "Получайте бонусы и участвуйте в акциях на нашей покерной платформе",
}

export default function BonusesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Бонусы и акции</h1>
        <p className="mt-2 text-muted-foreground">Получайте дополнительные фишки и участвуйте в специальных акциях</p>
      </div>

      <BonusList />
    </div>
  )
}

