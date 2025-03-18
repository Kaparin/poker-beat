import { NextRequest } from "next/server"

export interface PageTestResult {
  status: "success" | "error"
  loadTime: number
  errors: string[]
  warnings: string[]
  redirects: string[]
  resources: {
    loaded: number
    failed: number
    total: number
  }
}

export async function testPageLoad(path: string): Promise<PageTestResult> {
  const startTime = performance.now()

  try {
    const mockRequest = new NextRequest(new URL(`https://example.com${path}`))
    const response = await fetch(mockRequest.url)
    const endTime = performance.now()

    if (!response.ok) {
      return {
        status: "error",
        loadTime: endTime - startTime,
        errors: [`Page returned status code: ${response.status}`],
        warnings: [],
        redirects: [],
        resources: { loaded: 0, failed: 1, total: 1 },
      }
    }

    return {
      status: "success",
      loadTime: endTime - startTime,
      errors: [],
      warnings: [],
      redirects: [],
      resources: { loaded: 1, failed: 0, total: 1 },
    }
  } catch (error) {
    const endTime = performance.now()
    return {
      status: "error",
      loadTime: endTime - startTime,
      errors: [error instanceof Error ? error.message : "Unknown error"],
      warnings: [],
      redirects: [],
      resources: { loaded: 0, failed: 1, total: 1 },
    }
  }
}

