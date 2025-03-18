import { type NextRequest, NextResponse } from "next/server"
import { testNavigation } from "@/lib/test-utils/navigation-tester"

export async function GET(request: NextRequest) {
  try {
    const results = await testNavigation()

    return NextResponse.json({
      success: true,
      results,
      summary: {
        total: results.length,
        success: results.filter((r) => r.status === "success").length,
        warnings: results.filter((r) => r.status === "warning").length,
        errors: results.filter((r) => r.status === "error").length,
      },
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

