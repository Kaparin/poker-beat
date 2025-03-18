import type { Card, HandResult, Rank } from "@/types/poker"

// Map card ranks to numeric values for comparison
const RANK_VALUES: Record<Rank, number> = {
  "2": 2,
  "3": 3,
  "4": 4,
  "5": 5,
  "6": 6,
  "7": 7,
  "8": 8,
  "9": 9,
  "10": 10,
  J: 11,
  Q: 12,
  K: 13,
  A: 14,
}

// Helper function to sort cards by rank (highest first)
function sortByRank(cards: Card[]): Card[] {
  return [...cards].sort((a, b) => RANK_VALUES[b.rank] - RANK_VALUES[a.rank])
}

// Check for a flush (all cards of the same suit)
function isFlush(cards: Card[]): boolean {
  const suit = cards[0].suit
  return cards.every((card) => card.suit === suit)
}

// Check for a straight (consecutive ranks)
function isStraight(cards: Card[]): boolean {
  const sortedCards = sortByRank(cards)

  // Special case: A-5 straight (Ace can be low)
  if (
    sortedCards[0].rank === "A" &&
    sortedCards[1].rank === "5" &&
    sortedCards[2].rank === "4" &&
    sortedCards[3].rank === "3" &&
    sortedCards[4].rank === "2"
  ) {
    return true
  }

  // Check for consecutive ranks
  for (let i = 0; i < sortedCards.length - 1; i++) {
    if (RANK_VALUES[sortedCards[i].rank] - RANK_VALUES[sortedCards[i + 1].rank] !== 1) {
      return false
    }
  }

  return true
}

// Get the frequency of each rank in the hand
function getRankFrequency(cards: Card[]): Map<Rank, number> {
  const frequency = new Map<Rank, number>()

  for (const card of cards) {
    const count = frequency.get(card.rank) || 0
    frequency.set(card.rank, count + 1)
  }

  return frequency
}

// Evaluate a 5-card poker hand
export function evaluateHand(cards: Card[]): HandResult {
  if (cards.length !== 5) {
    throw new Error("Hand must contain exactly 5 cards")
  }

  const sortedCards = sortByRank(cards)
  const isHandFlush = isFlush(cards)
  const isHandStraight = isStraight(sortedCards)
  const frequency = getRankFrequency(cards)

  // Get frequency counts (e.g., [2, 2, 1] for two pairs)
  const counts = Array.from(frequency.values()).sort((a, b) => b - a)

  // Royal Flush: A-K-Q-J-10 of the same suit
  if (
    isHandFlush &&
    sortedCards[0].rank === "A" &&
    sortedCards[1].rank === "K" &&
    sortedCards[2].rank === "Q" &&
    sortedCards[3].rank === "J" &&
    sortedCards[4].rank === "10"
  ) {
    return {
      rank: "royal-flush",
      cards: sortedCards,
      value: 9000,
      description: "Royal Flush",
    }
  }

  // Straight Flush: Five consecutive cards of the same suit
  if (isHandFlush && isHandStraight) {
    return {
      rank: "straight-flush",
      cards: sortedCards,
      value: 8000 + RANK_VALUES[sortedCards[0].rank],
      description: `Straight Flush, ${sortedCards[0].rank} high`,
    }
  }

  // Four of a Kind: Four cards of the same rank
  if (counts[0] === 4) {
    const quadRank = Array.from(frequency.entries()).find(([_, count]) => count === 4)![0]
    const kicker = Array.from(frequency.entries()).find(([_, count]) => count === 1)![0]

    return {
      rank: "four-of-a-kind",
      cards: sortedCards,
      value: 7000 + RANK_VALUES[quadRank] * 10 + RANK_VALUES[kicker],
      description: `Four of a Kind, ${quadRank}s`,
    }
  }

  // Full House: Three cards of one rank and two of another
  if (counts[0] === 3 && counts[1] === 2) {
    const tripRank = Array.from(frequency.entries()).find(([_, count]) => count === 3)![0]
    const pairRank = Array.from(frequency.entries()).find(([_, count]) => count === 2)![0]

    return {
      rank: "full-house",
      cards: sortedCards,
      value: 6000 + RANK_VALUES[tripRank] * 10 + RANK_VALUES[pairRank],
      description: `Full House, ${tripRank}s over ${pairRank}s`,
    }
  }

  // Flush: Five cards of the same suit
  if (isHandFlush) {
    return {
      rank: "flush",
      cards: sortedCards,
      value: 5000 + RANK_VALUES[sortedCards[0].rank],
      description: `Flush, ${sortedCards[0].rank} high`,
    }
  }

  // Straight: Five consecutive cards
  if (isHandStraight) {
    // Handle A-5 straight (Ace is low)
    const highCard = sortedCards[0].rank === "A" && sortedCards[1].rank === "5" ? "5" : sortedCards[0].rank

    return {
      rank: "straight",
      cards: sortedCards,
      value: 4000 + RANK_VALUES[highCard],
      description: `Straight, ${highCard} high`,
    }
  }

  // Three of a Kind: Three cards of the same rank
  if (counts[0] === 3) {
    const tripRank = Array.from(frequency.entries()).find(([_, count]) => count === 3)![0]

    return {
      rank: "three-of-a-kind",
      cards: sortedCards,
      value: 3000 + RANK_VALUES[tripRank],
      description: `Three of a Kind, ${tripRank}s`,
    }
  }

  // Two Pair: Two cards of one rank and two of another
  if (counts[0] === 2 && counts[1] === 2) {
    const pairRanks = Array.from(frequency.entries())
      .filter(([_, count]) => count === 2)
      .map(([rank, _]) => rank)
      .sort((a, b) => RANK_VALUES[b] - RANK_VALUES[a])

    const kicker = Array.from(frequency.entries()).find(([_, count]) => count === 1)![0]

    return {
      rank: "two-pair",
      cards: sortedCards,
      value: 2000 + RANK_VALUES[pairRanks[0]] * 100 + RANK_VALUES[pairRanks[1]] * 10 + RANK_VALUES[kicker],
      description: `Two Pair, ${pairRanks[0]}s and ${pairRanks[1]}s`,
    }
  }

  // Pair: Two cards of the same rank
  if (counts[0] === 2) {
    const pairRank = Array.from(frequency.entries()).find(([_, count]) => count === 2)![0]

    const kickers = Array.from(frequency.entries())
      .filter(([_, count]) => count === 1)
      .map(([rank, _]) => rank)
      .sort((a, b) => RANK_VALUES[b] - RANK_VALUES[a])

    return {
      rank: "pair",
      cards: sortedCards,
      value: 1000 + RANK_VALUES[pairRank] * 100 + RANK_VALUES[kickers[0]] * 10 + RANK_VALUES[kickers[1]],
      description: `Pair of ${pairRank}s`,
    }
  }

  // High Card: Highest card in the hand
  return {
    rank: "high-card",
    cards: sortedCards,
    value:
      RANK_VALUES[sortedCards[0].rank] * 100 + RANK_VALUES[sortedCards[1].rank] * 10 + RANK_VALUES[sortedCards[2].rank],
    description: `High Card, ${sortedCards[0].rank}`,
  }
}

// Find the best 5-card hand from 7 cards (2 hole cards + 5 community cards)
export function findBestHand(holeCards: Card[], communityCards: Card[]): HandResult {
  const allCards = [...holeCards, ...communityCards]

  // Generate all possible 5-card combinations
  const combinations: Card[][] = []

  // Helper function to generate combinations
  function generateCombinations(cards: Card[], start: number, current: Card[]) {
    if (current.length === 5) {
      combinations.push([...current])
      return
    }

    for (let i = start; i < cards.length; i++) {
      current.push(cards[i])
      generateCombinations(cards, i + 1, current)
      current.pop()
    }
  }

  generateCombinations(allCards, 0, [])

  // Evaluate each combination and find the best hand
  let bestHand: HandResult | null = null

  for (const combo of combinations) {
    const result = evaluateHand(combo)

    if (!bestHand || result.value > bestHand.value) {
      bestHand = result
    }
  }

  return bestHand!
}

// Determine the winner(s) from a list of players
export function determineWinners(players: { id: number; handResult: HandResult }[]): number[] {
  let highestValue = -1
  const winners: number[] = []

  for (const player of players) {
    if (player.handResult.value > highestValue) {
      highestValue = player.handResult.value
      winners.length = 0
      winners.push(player.id)
    } else if (player.handResult.value === highestValue) {
      winners.push(player.id)
    }
  }

  return winners
}

