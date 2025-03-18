import crypto from "crypto"
import type { Card, Rank, Suit } from "@/types/poker"

const SUITS: Suit[] = ["hearts", "diamonds", "clubs", "spades"]
const RANKS: Rank[] = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"]

export function createDeck(): Card[] {
  const deck: Card[] = []

  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank })
    }
  }

  return deck
}

// Generate a cryptographically secure random number between min and max (inclusive)
function secureRandom(min: number, max: number): number {
  try {
    const range = max - min + 1
    const bytesNeeded = Math.ceil(Math.log2(range) / 8)
    const maxNum = 256 ** bytesNeeded
    const cutoff = maxNum - (maxNum % range)

    // Generate random bytes
    const randomBytes = crypto.randomBytes(bytesNeeded)
    let value = 0

    // Convert bytes to a number
    for (let i = 0; i < bytesNeeded; i++) {
      value = (value << 8) + randomBytes[i]
    }

    // Ensure unbiased distribution by rejecting values above the cutoff
    if (value >= cutoff) {
      return secureRandom(min, max) // Try again
    }

    // Map to the desired range
    return min + (value % range)
  } catch (error) {
    console.error("Secure random generation error:", error)
    // Fallback to Math.random in case of error
    return Math.floor(Math.random() * (max - min + 1)) + min
  }
}

export function shuffleDeck(deck: Card[]): { shuffledDeck: Card[]; seedUsed: string } {
  try {
    // Generate a random seed
    const seedUsed = crypto.randomBytes(16).toString("hex")

    // Create a copy of the deck
    const shuffled = [...deck]

    // Fisher-Yates shuffle algorithm with cryptographically secure random numbers
    for (let i = shuffled.length - 1; i > 0; i--) {
      // Use the seed to generate a deterministic but secure shuffle
      const seedForThisCard = seedUsed + i.toString()
      const seedBuffer = Buffer.from(seedForThisCard)
      const hash = crypto.createHash("sha256").update(seedBuffer).digest()

      // Use the first 4 bytes of the hash to generate a random index
      const randomValue = hash.readUInt32BE(0)
      const j = randomValue % (i + 1)

      // Swap elements
      const temp = shuffled[i]
      shuffled[i] = shuffled[j]
      shuffled[j] = temp
    }

    return { shuffledDeck: shuffled, seedUsed }
  } catch (error) {
    console.error("Deck shuffling error:", error)

    // Fallback to a less secure but functional shuffle
    const shuffled = [...deck]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      const temp = shuffled[i]
      shuffled[i] = shuffled[j]
      shuffled[j] = temp
    }

    return {
      shuffledDeck: shuffled,
      seedUsed: "fallback-" + Date.now().toString(),
    }
  }
}

export function dealCards(deck: Card[], count: number, faceDown = false): { cards: Card[]; remainingDeck: Card[] } {
  if (count > deck.length) {
    throw new Error(`Cannot deal ${count} cards from a deck of ${deck.length} cards`)
  }

  const cards = deck.slice(0, count).map((card) => ({ ...card, faceDown }))
  const remainingDeck = deck.slice(count)

  return { cards, remainingDeck }
}

