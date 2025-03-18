export interface Friend {
  id: number
  userId: number
  friendId: number
  status: FriendshipStatus
  createdAt: Date
  updatedAt: Date
  friend: {
    id: number
    username: string
    avatarUrl?: string
    isOnline: boolean
    lastActive?: Date
  }
}

export enum FriendshipStatus {
  PENDING = "PENDING",
  ACCEPTED = "ACCEPTED",
  DECLINED = "DECLINED",
  BLOCKED = "BLOCKED",
}

export interface FriendRequest {
  id: number
  senderId: number
  receiverId: number
  status: FriendshipStatus
  createdAt: Date
  sender: {
    id: number
    username: string
    avatarUrl?: string
  }
}

export interface FriendAction {
  type: "add" | "accept" | "decline" | "cancel" | "remove" | "block" | "unblock"
  userId: number
}

