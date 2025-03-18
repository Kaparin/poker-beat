import Image from "next/image"
import type { TelegramUser } from "@/types/telegram"

interface ProfileDisplayProps {
  user: TelegramUser
  balance?: number
}

export function ProfileDisplay({ user, balance = 0 }: ProfileDisplayProps) {
  return (
    <div className="flex flex-col items-center p-6 bg-white rounded-lg shadow-md">
      <div className="relative w-24 h-24 mb-4 overflow-hidden rounded-full">
        {user.photo_url ? (
          <Image
            src={user.photo_url || "/placeholder.svg"}
            alt={`${user.first_name}'s profile`}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full bg-gray-200 text-gray-600">
            {user.first_name.charAt(0)}
            {user.last_name && user.last_name.charAt(0)}
          </div>
        )}
      </div>

      <h2 className="mb-1 text-xl font-bold">
        {user.first_name} {user.last_name}
      </h2>

      {user.username && <p className="mb-4 text-sm text-gray-600">@{user.username}</p>}

      <div className="px-4 py-2 mt-2 text-center bg-green-100 rounded-full">
        <span className="font-semibold">Balance: </span>
        <span>{balance} chips</span>
      </div>
    </div>
  )
}

