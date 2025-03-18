import { TelegramAuth } from "@/components/telegram-auth"

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <TelegramAuth />
    </main>
  )
}

