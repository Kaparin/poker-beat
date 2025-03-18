import { PrismaClient } from "@prisma/client"

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
// Learn more: https://pris.ly/d/help/next-js-best-practices

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

// Helper function to handle Prisma errors consistently
export async function handlePrismaOperation<T>(operation: () => Promise<T>): Promise<[T | null, Error | null]> {
  try {
    const result = await operation()
    return [result, null]
  } catch (error) {
    console.error("Prisma operation error:", error)
    return [null, error instanceof Error ? error : new Error("Unknown database error")]
  }
}

export default prisma

