import { type NextRequest, NextResponse } from "next/server"
import { testGameFeatures } from "@/lib/test-utils/game-tester"

export async function GET(request: NextRequest) {
  try {
    const results = await testGameFeatures()

    return NextResponse.json({
      success: true,
      ...results,
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

